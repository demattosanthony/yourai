import { NextFunction, Router, Request, Response } from "express";
import { and, eq, sql } from "drizzle-orm";
import db from "../config/db";
import {
  organizationMembers,
  organizations,
  samlConfigs,
  users,
} from "../config/schema";
import { authMiddleware } from "../middleware/auth";

const router = Router();

// Middleware to check if user is org admin
async function isOrgAdmin(req: any, res: Response, next: NextFunction) {
  const member = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, req.params.orgId),
      eq(organizationMembers.userId, req.dbUser!.id)
    ),
  });

  if (!member || member.role !== "admin") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }
  next();
}

// Create organization
router.post("/", authMiddleware, async (req, res) => {
  const { name, domain } = req.body;

  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");

    // Create org and add current user as admin in transaction
    const [org] = await db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name,
          slug,
          domain: domain || null,
        })
        .returning();

      await tx.insert(organizationMembers).values({
        organizationId: org.id,
        userId: req.dbUser!.id,
        role: "admin",
      });

      return [org];
    });

    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create organization" });
  }
});

// Get organization by domain (used for SSO)
router.get("/domain/:domain", async (req, res) => {
  const org = await db.query.organizations.findFirst({
    where: sql`${organizations.domain} @> ARRAY[${req.params.domain}]`,
    with: {
      samlConfig: true,
    },
  });

  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }

  res.json(org);
});

// Get user's organizations
router.get("/me", async (req, res) => {
  const memberships = await db.query.organizationMembers.findMany({
    where: eq(organizationMembers.userId, req.dbUser!.id),
    with: {
      organization: true,
    },
  });

  res.json(
    memberships.map((m) => ({
      ...m.organization,
      role: m.role,
    }))
  );
});

// Update organization settings (including SAML)
router.put("/:orgId", authMiddleware, isOrgAdmin, async (req, res) => {
  const { name, domain, saml } = req.body;

  try {
    await db.transaction(async (tx) => {
      // Update org details
      if (name || domain) {
        await tx
          .update(organizations)
          .set({
            name: name || undefined,
            domain: domain || undefined,
          })
          .where(eq(organizations.id, req.params.orgId));
      }

      // Update or create SAML config
      if (saml) {
        const existing = await tx.query.samlConfigs.findFirst({
          where: eq(samlConfigs.organizationId, req.params.orgId),
        });

        if (existing) {
          await tx
            .update(samlConfigs)
            .set({
              entryPoint: saml.entryPoint,
              issuer: saml.issuer,
              cert: saml.cert,
              callbackUrl: saml.callbackUrl,
            })
            .where(eq(samlConfigs.id, existing.id));
        } else {
          await tx.insert(samlConfigs).values({
            organizationId: req.params.orgId,
            ...saml,
          });
        }
      }
    });

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, req.params.orgId),
      with: {
        samlConfig: true,
      },
    });

    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to update organization" });
  }
});

// Manage members
router.post("/:orgId/members", authMiddleware, isOrgAdmin, async (req, res) => {
  const { email, role } = req.body;

  try {
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }

    await db.insert(organizationMembers).values({
      organizationId: req.params.orgId,
      userId: user.id,
      role,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: "Failed to add member" });
  }
});

export default router;
