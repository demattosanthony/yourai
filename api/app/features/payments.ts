import { Stripe } from "stripe";
import stripe, { allowedEvents, syncStripeData } from "../config/stripe";
import db from "../config/db";
import { organizations, users } from "../config/schema";
import { eq } from "drizzle-orm";
import { Request, Response, Router } from "express";

export interface CheckoutSessionParams {
  userId: string;
  email: string;
  lookupKey: string;
  stripeCustomerId?: string;
  quantity?: number;
  organizationId?: string;
}

export interface PortalSessionParams {
  stripeCustomerId: string;
}

const ops = {
  customers: {
    create: async (email: string, userId: string, organizationId?: string) => {
      const customer = await stripe.customers.create({
        email,
        metadata: organizationId ? { organizationId } : { userId },
      });

      if (organizationId) {
        await db
          .update(organizations)
          .set({ stripeCustomerId: customer.id })
          .where(eq(organizations.id, organizationId));
      } else {
        await db
          .update(users)
          .set({ stripeCustomerId: customer.id })
          .where(eq(users.id, userId));
      }

      return customer;
    },
  },

  checkout: {
    createSession: async ({
      userId,
      email,
      lookupKey,
      stripeCustomerId,
      organizationId,
      quantity = 1,
    }: CheckoutSessionParams) => {
      // Create customer if needed
      const customerId =
        stripeCustomerId ||
        (await ops.customers.create(email, userId, organizationId)).id;

      const prices = await stripe.prices.list({
        lookup_keys: [lookupKey],
        expand: ["data.product"],
      });

      return stripe.checkout.sessions.create({
        billing_address_collection: "auto",
        customer: customerId,
        line_items: [{ price: prices.data[0].id, quantity: quantity }],
        mode: "subscription",
        success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: process.env.FRONTEND_URL,
        metadata: organizationId
          ? { organization_id: organizationId }
          : { user_id: userId },
        subscription_data: {
          metadata: organizationId
            ? { organization_id: organizationId }
            : { user_id: userId },
        },
      });
    },
  },

  portal: {
    createSession: async ({ stripeCustomerId }: PortalSessionParams) => {
      return stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: process.env.FRONTEND_URL,
      });
    },
  },

  webhooks: {
    processEvent: async (event: Stripe.Event) => {
      if (!allowedEvents.includes(event.type)) return;

      const { customer: customerId } = event?.data?.object as {
        customer: string;
      };

      if (typeof customerId !== "string") {
        throw new Error(
          `[STRIPE HOOK][ERROR] ID isn't string.\nEvent type: ${event.type}`
        );
      }

      return syncStripeData(customerId);
    },

    constructEvent: async (payload: any, signature: string) => {
      return stripe.webhooks.constructEventAsync(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );
    },
  },
};

// payments/handlers.ts
const handlers = {
  createCheckoutSession: async (req: Request, res: Response) => {
    try {
      const { lookup_key, organization_id, seat_count } = req.body;

      const session = await ops.checkout.createSession({
        userId: req.dbUser!.id,
        email: req.dbUser!.email,
        lookupKey: lookup_key,
        stripeCustomerId: organization_id
          ? (
              await db.query.organizations.findFirst({
                where: eq(organizations.id, organization_id),
              })
            )?.stripeCustomerId || undefined
          : undefined,
        quantity: seat_count || 1,
        organizationId: organization_id,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },

  syncAfterSuccess: async (req: Request, res: Response) => {
    try {
      if (!req.dbUser?.stripeCustomerId) {
        res.status(400).json({ error: "No Stripe customer ID found" });
        return;
      }

      await syncStripeData(req.dbUser.stripeCustomerId);
      res.status(200).json({ message: "Successfully synced data" });
    } catch (error) {
      console.error("Error syncing after success:", error);
      res.status(500).json({ error: "Failed to sync after success" });
    }
  },

  createPortalSession: async (req: Request, res: Response) => {
    try {
      if (!req.dbUser?.stripeCustomerId) {
        res.status(400).json({ error: "No billing information found" });
        return;
      }

      const session = await ops.portal.createSession({
        stripeCustomerId: req.dbUser.stripeCustomerId,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Error creating portal session:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  },

  webhook: async (req: Request, res: Response) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing Stripe signature");
      return;
    }

    try {
      const event = await ops.webhooks.constructEvent(req.body, signature);
      await ops.webhooks.processEvent(event);
      res.json({ received: true });
    } catch (error) {
      console.error("Error processing webhook:", error);
      res.status(400).json({ error: "Webhook error" });
    }
  },
};

export default Router()
  .post("/create-checkout-session", handlers.createCheckoutSession)
  .post("/sync-after-success", handlers.syncAfterSuccess)
  .post("/create-portal-session", handlers.createPortalSession)
  .post("/webhook", handlers.webhook);
