import Stripe from "stripe";
import db from "./db";
import { users } from "./schema";
import { eq } from "drizzle-orm";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

export const allowedEvents: Stripe.Event.Type[] = [
  "checkout.session.completed",
  "customer.subscription.created",
  "customer.subscription.updated",
  "customer.subscription.deleted",
  "customer.subscription.paused",
  "customer.subscription.resumed",
  "customer.subscription.pending_update_applied",
  "customer.subscription.pending_update_expired",
  "customer.subscription.trial_will_end",
  "invoice.paid",
  "invoice.payment_failed",
  "invoice.payment_action_required",
  "invoice.upcoming",
  "invoice.marked_uncollectible",
  "invoice.payment_succeeded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "payment_intent.canceled",
];

export async function syncStripeData(customerId: string) {
  try {
    console.log("Syncing Stripe data for customer:", customerId);

    // Fetch latest subscription data from Stripe
    const stripeSubscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    // If user has no subscription on Stripe
    if (stripeSubscriptions.data.length === 0) {
      await db
        .update(users)
        .set({ subscriptionStatus: "incomplete", subscriptionPlan: null })
        .where(eq(users.stripeCustomerId, customerId));
      return {
        subscriptionId: null,
        status: "none",
      };
    }

    // For a single subscription scenario, always pick the first
    const subscription = stripeSubscriptions.data[0];

    const subscriptionId = subscription.id;
    const status = subscription.status as
      | "active"
      | "canceled"
      | "incomplete"
      | "incomplete_expired"
      | "past_due"
      | "trialing"
      | "unpaid";
    const priceId = subscription.items.data[0].price.id;

    // Normally you could store these in the subscriptions table if you want
    // but if using a single-subscription approach, store them on the user record.
    await db
      .update(users)
      .set({ subscriptionStatus: status, subscriptionPlan: "basic" })
      .where(eq(users.stripeCustomerId, customerId));

    return {
      subscriptionId,
      status,
      priceId,
      currentPeriodEnd: subscription.current_period_end,
      currentPeriodStart: subscription.current_period_start,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      paymentMethod:
        typeof subscription.default_payment_method !== "string"
          ? {
              brand: subscription.default_payment_method?.card?.brand ?? null,
              last4: subscription.default_payment_method?.card?.last4 ?? null,
            }
          : null,
    };
  } catch (error) {
    console.error("Error syncing Stripe data:", error);
    throw error; // Re-throw to allow for retry mechanisms
  }
}

export default stripe;
