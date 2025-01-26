import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import stripe, { allowedEvents, syncStripeData } from "../config/stripe";
import db from "../config/db";
import { users } from "../config/schema";
import { eq } from "drizzle-orm";
import Stripe from "stripe";

const router = Router();

router.post("/create-checkout-session", authMiddleware, async (req, res) => {
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

router.post("/sync-after-success", authMiddleware, async (req, res) => {
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

router.post("/create-portal-session", authMiddleware, async (req, res) => {
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

router.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig) {
    res.status(400).send("Missing Stripe signature");
    return;
  }

  async function doProcessing() {
    if (typeof sig !== "string") {
      throw new Error("[STRIPE HOOK] Header isn't a string???");
    }

    const event = await stripe.webhooks.constructEventAsync(
      req.body,
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

  res.json({ received: true });
});

export default router;
