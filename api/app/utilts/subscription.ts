import { eq } from "drizzle-orm";
import { users } from "../config/schema";
import db from "../config/db";
import stripe from "../config/stripe";

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
        .set({ subscriptionStatus: "incomplete" })
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
      .set({ subscriptionStatus: status })
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
