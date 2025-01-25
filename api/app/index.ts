import Express from "express";
import cors from "cors";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import cookieParser from "cookie-parser";
import { CONFIG } from "./config/constants";
import { authMiddleware } from "./middleware/auth";
import Stripe from "stripe";

// Clients
import db from "./config/db";
import s3 from "./config/s3";
import myPassport from "./config/passport";
import stripe, { allowedEvents, syncStripeData } from "./config/stripe";

// Routes
import authRoutes from "./routes/auth";
import threadRoutes from "./routes/threads";
import modelRoutes from "./routes/model";
import paymentRoutes from "./routes/payments";

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
  app.use("/payments", paymentRoutes);

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

  // Stripe webhook
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
