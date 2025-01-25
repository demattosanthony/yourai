import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import stripe, { syncStripeData } from "../config/stripe";
import db from "../config/db";
import { users } from "../config/schema";
import { eq } from "drizzle-orm";

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

export default router;
