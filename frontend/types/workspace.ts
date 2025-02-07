export type Workspace = {
  id: string;
  name: string;
  type: "personal" | "organization";
  logo?: string;
  subscriptionPlan?: string;
};
