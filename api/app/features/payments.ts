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
  return_url?: string;
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
        success_url: organizationId
          ? `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}&organization_id=${organizationId}`
          : `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: organizationId
          ? `${process.env.FRONTEND_URL}/cancel?organization_id=${organizationId}`
          : `${process.env.FRONTEND_URL}/cancel`,
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
    createSession: async ({
      stripeCustomerId,
      return_url,
    }: PortalSessionParams) => {
      return stripe.billingPortal.sessions.create({
        customer: stripeCustomerId,
        return_url: process.env.FRONTEND_URL + (return_url || "/"),
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
      const { organization_id, seats } = req.body;

      let stripeCustomerId: string | undefined;

      if (organization_id) {
        // Get organization's stripe customer ID
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, organization_id),
        });

        stripeCustomerId = org?.stripeCustomerId || undefined;
      } else {
        stripeCustomerId = req.dbUser?.stripeCustomerId || undefined;
      }

      const session = await ops.checkout.createSession({
        userId: req.dbUser!.id,
        email: req.dbUser!.email,
        lookupKey: req.body.lookup_key,
        stripeCustomerId: stripeCustomerId,
        organizationId: organization_id,
        quantity: seats,
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  },

  syncAfterSuccess: async (req: Request, res: Response) => {
    try {
      const { organization_id } = req.body;
      let stripeCustomerId: string | undefined;

      if (organization_id) {
        // Get organization's stripe customer ID
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, organization_id),
        });

        if (!org?.stripeCustomerId) {
          res.status(400).json({
            error: "No billing information found for this organization",
          });
          return;
        }
        stripeCustomerId = org.stripeCustomerId;
      } else {
        // Use user's stripe customer ID
        if (!req.dbUser?.stripeCustomerId) {
          res.status(400).json({ error: "No billing information found" });
          return;
        }
        stripeCustomerId = req.dbUser.stripeCustomerId;
      }

      await syncStripeData(stripeCustomerId);
      res.status(200).json({ message: "Successfully synced data" });
    } catch (error) {
      console.error("Error syncing after success:", error);
      res.status(500).json({ error: "Failed to sync after success" });
    }
  },

  createPortalSession: async (req: Request, res: Response) => {
    try {
      const { organization_id, return_url } = req.body;
      let stripeCustomerId: string | undefined;

      if (organization_id) {
        // Get organization's stripe customer ID
        const org = await db.query.organizations.findFirst({
          where: eq(organizations.id, organization_id),
        });

        if (!org?.stripeCustomerId) {
          res.status(400).json({
            error: "No billing information found for this organization",
          });
          return;
        }
        stripeCustomerId = org.stripeCustomerId;
      } else {
        // Use user's stripe customer ID
        if (!req.dbUser?.stripeCustomerId) {
          res.status(400).json({ error: "No billing information found" });
          return;
        }
        stripeCustomerId = req.dbUser.stripeCustomerId;
      }

      const session = await ops.portal.createSession({
        stripeCustomerId,
        return_url,
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

export const { webhook } = handlers;

export default Router()
  .post("/create-checkout-session", handlers.createCheckoutSession)
  .post("/sync-after-success", handlers.syncAfterSuccess)
  .post("/create-portal-session", handlers.createPortalSession);
