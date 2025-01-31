import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { superAdminMiddleware } from "../middleware/superAdmin";
import z from "zod";
import db from "../config/db";
import {
  organizationMembers,
  organizations,
  samlConfigs,
  users,
} from "../config/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

router.use("/admin/*", authMiddleware, superAdminMiddleware);

// List all organizations with pagination
router.get("/organizations", async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  const [orgs, totalCount] = await Promise.all([
    db.query.organizations.findMany({
      orderBy: organizations.createdAt,
      limit,
      offset,
    }),
    db.select({ count: sql`count(*)` }).from(organizations),
  ]);

  const totalPages = Math.ceil(Number(totalCount[0].count) / limit);

  res.json({
    data: orgs,
    pagination: {
      page,
      limit,
      totalItems: Number(totalCount[0].count),
      totalPages,
    },
  });
});

const createOrgSchema = z.object({
  name: z.string().min(1).max(255),
  ownerEmail: z.string().email(),
  ownerName: z.string().min(1).max(255),
  domain: z.string().optional(),
  logo: z.string().optional(),
});

// Create organization
router.post("/organizations", async (req, res) => {
  const validatedData = createOrgSchema.parse(req.body);
  const { name, domain, ownerEmail, ownerName, logo } = validatedData;

  try {
    if (!req.dbUser) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Generate slug from name
    const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "-");
    const existingOrg = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });

    if (existingOrg) {
      res
        .status(400)
        .json({ error: "Organization with similar name already exists" });
      return;
    }

    // Create org and add current user as owner in transaction
    const [org] = await db.transaction(async (tx) => {
      // Find or create the owner user
      let owner = await tx.query.users.findFirst({
        where: eq(users.email, ownerEmail),
      });

      if (!owner) {
        const [newUser] = await tx
          .insert(users)
          .values({
            email: ownerEmail,
            name: ownerName,
            identityProvider: "saml",
            createdAt: new Date(),
          })
          .returning();
        owner = newUser;
      }

      const [org] = await tx
        .insert(organizations)
        .values({
          name,
          slug,
          domain: domain || null,
          logo: logo || null,
        })
        .returning();

      await tx.insert(organizationMembers).values({
        organizationId: org.id,
        userId: owner.id,
        role: "owner",
      });

      return [org];
    });

    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to create organization" });
  }
});

// Get organization details by domain
router.get("/organizations/domain/:domain", async (req, res) => {
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.domain, req.params.domain),
    with: {
      samlConfig: true,
    },
  });

  if (!org) {
    res.status(404).json({ error: "Organization not found" });
    return;
  }

  const passphrase = process.env.PGCRYPTO_KEY;
  if (!passphrase) {
    throw new Error("Encryption key not configured");
  }

  // If there's a SAML config, decrypt it before sending
  if (org?.samlConfig) {
    const decryptedConfig = await db
      .execute(
        sql`
        SELECT 
          pgp_sym_decrypt(${org.samlConfig.entryPoint}, ${passphrase})::text as entry_point,
          pgp_sym_decrypt(${org.samlConfig.issuer}, ${passphrase})::text as issuer,
          pgp_sym_decrypt(${org.samlConfig.cert}, ${passphrase})::text as cert,
          ${org.samlConfig.callbackUrl} as callback_url
      `
      )
      .then((result) => result.rows[0] as unknown as DecryptedSamlConfig);

    // Replace the encrypted values with decrypted ones in the response
    org.samlConfig = {
      ...org.samlConfig,
      entryPoint: decryptedConfig.entry_point as unknown as any,
      issuer: decryptedConfig.issuer as unknown as any,
      cert: decryptedConfig.cert as unknown as any,
    };
  }

  res.json(org);
});

const samlConfigSchema = z.object({
  entryPoint: z.string().url(),
  issuer: z.string().min(1),
  cert: z.string().min(1),
  callbackUrl: z.string().url(),
});

interface DecryptedSamlConfig {
  entry_point: string;
  issuer: string;
  cert: string;
  callback_url: string;
}

// Update organization settings (including SAML)
router.put("/organizations/:orgId", async (req, res) => {
  const { name, domain, saml } = req.body;

  try {
    if (saml) {
      samlConfigSchema.parse(saml); // Validate SAML config
    }

    const passphrase = process.env.PGCRYPTO_KEY;
    if (!passphrase) {
      throw new Error("Encryption key not configured");
    }

    await db.transaction(async (tx) => {
      // Update org details
      if (name || domain) {
        await tx
          .update(organizations)
          .set({
            name: name || undefined,
            domain: domain || undefined,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, req.params.orgId));
      }

      // Update or create SAML config
      if (saml) {
        const existing = await tx.query.samlConfigs.findFirst({
          where: eq(samlConfigs.organizationId, req.params.orgId),
        });

        // Encrypt SAML data using pgcrypto
        const encryptedConfig = {
          entryPoint: sql`pgp_sym_encrypt(${saml.entryPoint}::text, ${passphrase})`,
          issuer: sql`pgp_sym_encrypt(${saml.issuer}::text, ${passphrase})`,
          cert: sql`pgp_sym_encrypt(${saml.cert}::text, ${passphrase})`,
          callbackUrl: saml.callbackUrl,
          updatedAt: new Date(),
        };

        // Insert or update SAML config
        if (existing) {
          await tx
            .update(samlConfigs)
            .set(encryptedConfig)
            .where(eq(samlConfigs.id, existing.id));
        } else {
          await tx.insert(samlConfigs).values({
            organizationId: req.params.orgId,
            ...encryptedConfig,
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

    // If there's a SAML config, decrypt it before sending
    if (org?.samlConfig) {
      const decryptedConfig = await db
        .execute(
          sql`
        SELECT 
          pgp_sym_decrypt(${org.samlConfig.entryPoint}, ${passphrase})::text as entry_point,
          pgp_sym_decrypt(${org.samlConfig.issuer}, ${passphrase})::text as issuer,
          pgp_sym_decrypt(${org.samlConfig.cert}, ${passphrase})::text as cert,
          ${org.samlConfig.callbackUrl} as callback_url
      `
        )
        .then((result) => result.rows[0] as unknown as DecryptedSamlConfig);

      // Replace the encrypted values with decrypted ones in the response
      org.samlConfig = {
        ...org.samlConfig,
        entryPoint: decryptedConfig.entry_point as unknown as any,
        issuer: decryptedConfig.issuer as unknown as any,
        cert: decryptedConfig.cert as unknown as any,
      };
    }

    res.json(org);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: "Failed to update organization" });
  }
});

export default router;
