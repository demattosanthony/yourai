import { eq } from "drizzle-orm";
import db from "../app/config/db";
import { users, organizationMembers } from "../app/config/schema";

const email = process.argv[2];
const orgId = process.argv[3];

if (!email || !orgId) {
  console.error("Please provide an email address and organization ID");
  process.exit(1);
}

// Get the user ID first
const user = await db.query.users.findFirst({
  where: eq(users.email, email),
});

if (!user) {
  console.error("User not found");
  process.exit(1);
}

// Update organization member record to owner role
await db
  .update(organizationMembers)
  .set({ role: "owner" })
  .where(
    eq(organizationMembers.userId, user.id) &&
      eq(organizationMembers.organizationId, orgId)
  );
