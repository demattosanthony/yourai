export interface User {
  id: string;
  name: string;
  email: string;
  profilePicture: string;
  subscriptionStatus:
    | "active"
    | "inactive"
    | "canceled"
    | "incomplete"
    | "incomplete_expired"
    | "past_due"
    | "trialing"
    | "unpaid";
  subscriptionPlan?: "basic";
  stripeCustomerId?: string;
}
