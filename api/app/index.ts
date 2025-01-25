import Express from "express";
import cors from "cors";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import cookieParser from "cookie-parser";
import { CONFIG } from "./config/constants";
import { authMiddleware } from "./middleware/auth";

// Clients
import db from "./config/db";
import s3 from "./config/s3";
import myPassport from "./config/passport";

// Routes
import authRoutes from "./routes/auth";
import threadRoutes from "./routes/threads";
import modelRoutes from "./routes/model";
import { syncStripeData } from "./utilts/subscription";
import { users } from "./config/schema";
import { eq } from "drizzle-orm";
import stripe, { allowedEvents } from "./config/stripe";
import Stripe from "stripe";

// Error Handling
export function handleError(res: Express.Response, error: Error) {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}

async function main() {
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../drizzle"),
    });
  } catch (error) {
    console.error("Error occurred during database migration", error);
    process.exit(1);
  }

  const app = Express();

  if (CONFIG.__prod__) {
    // you need this if you have nginx or another proxy in front
    // dokku uses nginx
    app.set("trust proxy", 1);
  }

  app.use("/webhook", Express.raw({ type: "application/json" }));
  app.use(Express.json({ limit: "50mb" }));

  app.use(
    cors({
      credentials: true,
      origin: CONFIG.CORS_ORIGINS,
    })
  );
  app.use(cookieParser());
  app.use(myPassport.initialize());

  app.use("/auth", authRoutes);
  app.use("/threads", threadRoutes);
  app.use("/models", modelRoutes);

  app.post("/presigned-url", authMiddleware, async (req, res) => {
    try {
      const { filename, mime_type, size } = req.body;
      const file_key = `uploads/${Date.now()}-${filename}`;
      const url = s3.presign(file_key, {
        expiresIn: 3600, // 1 hour
        type: mime_type,
        method: "PUT",
      });
      const viewUrl = s3.file(file_key).presign({
        expiresIn: 3600,
        method: "GET",
      });

      res.json({
        url,
        viewUrl,
        file_metadata: {
          filename,
          mime_type,
          file_key,
          size,
        },
      });
    } catch (error: any) {
      handleError(res, error);
    }
  });

  // Stripe
  app.post("/create-checkout-session", authMiddleware, async (req, res) => {
    try {
      let customerId = req.dbUser?.stripeCustomerId;

      // Create a new Stripe customer if this user doesn't have one
      if (!customerId) {
        const newCustomer = await stripe.customers.create({
          email: req.dbUser!.email,
          metadata: {
            userId: req.dbUser!.id, // DO NOT FORGET THIS
          },
        });

        // Store the relation between userId and stripeCustomerId in your database
        await db
          .update(users)
          .set({ stripeCustomerId: newCustomer.id })
          .where(eq(users.id, req.dbUser!.id));

        customerId = newCustomer.id;
      }

      const prices = await stripe.prices.list({
        lookup_keys: [req.body.lookup_key],
        expand: ["data.product"],
      });

      const session = await stripe.checkout.sessions.create({
        billing_address_collection: "auto",
        customer: customerId, // Use the customer ID here
        line_items: [
          {
            price: prices.data[0].id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.FRONTEND_URL,
        metadata: {
          user_id: req.dbUser?.id || null,
        },
        subscription_data: {
          metadata: {
            user_id: req.dbUser?.id || null,
          },
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/sync-after-success", authMiddleware, async (req, res) => {
    try {
      const stripeCustomerId = req.dbUser?.stripeCustomerId;

      if (!stripeCustomerId) {
        res.status(400).json({ error: "No Stripe customer ID found" });
        return;
      }

      await syncStripeData(stripeCustomerId);

      res.status(200).json({ message: "Successfully synced data" });
    } catch (error) {
      console.error("Error syncing after success:", error);
      res.status(500).json({ error: "Failed to sync after success" });
    }
  });

  app.post("/create-portal-session", authMiddleware, async (req, res) => {
    try {
      const user = req.dbUser;

      console.log(`User ID: ${user}`);

      if (!user?.stripeCustomerId) {
        res.status(400).json({
          error: "No billing information found",
        });
        return;
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${process.env.FRONTEND_URL}`,
      });

      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  async function processEvent(event: Stripe.Event) {
    // Skip processing if the event isn't one I'm tracking (list of all events below)
    if (!allowedEvents.includes(event.type)) return;

    // All the events I track have a customerId
    const { customer: customerId } = event?.data?.object as {
      customer: string; // Sadly TypeScript does not know this
    };

    // This helps make it typesafe and also lets me know if my assumption is wrong
    if (typeof customerId !== "string") {
      throw new Error(
        `[STRIPE HOOK][CANCER] ID isn't string.\nEvent type: ${event.type}`
      );
    }

    return await syncStripeData(customerId);
  }

  app.post("/webhook", async (request, response) => {
    const sig = request.headers["stripe-signature"];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig) {
      response.status(400).send("Missing Stripe signature");
      return;
    }

    async function doProcessing() {
      if (typeof sig !== "string") {
        throw new Error("[STRIPE HOOK] Header isn't a string???");
      }

      const event = await stripe.webhooks.constructEventAsync(
        request.body,
        sig!,
        endpointSecret!
      );

      await processEvent(event);
    }

    try {
      await doProcessing();
    } catch (err) {
      console.error("Error processing webhook event:", err);
    }

    response.json({ received: true });
  });

  app.listen(CONFIG.PORT, () => {
    console.log(`Server is running on http://localhost:${CONFIG.PORT}`);
  });
}

main();
