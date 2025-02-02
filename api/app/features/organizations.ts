import { Request, Response, Router } from "express";
import db from "../config/db";
import { eq, sql } from "drizzle-orm";
import {
  organizationMembers,
  organizations,
  samlConfigs,
  users,
} from "../config/schema";
import z from "zod";

export interface OrganizationMember {
  email: string;
  role: "owner" | "member";
}

export interface SamlConfig {
  entryPoint: string;
  issuer: string;
  cert: string;
  callbackUrl: string;
}

export interface DecryptedSamlConfig {
  entry_point: string;
  issuer: string;
  cert: string;
  callback_url: string;
}

export const schemas = {
  samlConfig: z.object({
    entryPoint: z.string().url(),
    issuer: z.string().min(1),
    cert: z.string().min(1),
    callbackUrl: z.string().url(),
  }),

  member: z.object({
    email: z.string().email(),
    role: z.enum(["owner", "member"]),
  }),
};

const ops = {
  organizations: {
    getByDomain: async (domain: string) => {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.domain, domain),
        with: { samlConfig: true },
      });

      if (!org) throw new Error("Organization not found");
      return org;
    },

    getUserOrgs: async (userId: string) => {
      return db.query.organizationMembers.findMany({
        where: eq(organizationMembers.userId, userId),
        with: { organization: true },
      });
    },

    update: async (orgId: string, data: any) => {
      const passphrase = process.env.PGCRYPTO_KEY;
      if (!passphrase) throw new Error("Encryption key not configured");

      await db.transaction(async (tx) => {
        if (data.name || data.domain || data.logo) {
          await tx
            .update(organizations)
            .set({
              name: data.name || undefined,
              domain: data.domain || undefined,
              logo: data.logo || undefined,
              updatedAt: new Date(),
            })
            .where(eq(organizations.id, orgId));
        }

        if (data.saml) {
          const encryptedConfig = {
            entryPoint: sql`pgp_sym_encrypt(${data.saml.entryPoint}::text, ${passphrase})`,
            issuer: sql`pgp_sym_encrypt(${data.saml.issuer}::text, ${passphrase})`,
            cert: sql`pgp_sym_encrypt(${data.saml.cert}::text, ${passphrase})`,
            callbackUrl: data.saml.callbackUrl,
            updatedAt: new Date(),
          };

          const existing = await tx.query.samlConfigs.findFirst({
            where: eq(samlConfigs.organizationId, orgId),
          });

          if (existing) {
            await tx
              .update(samlConfigs)
              .set(encryptedConfig)
              .where(eq(samlConfigs.id, existing.id));
          } else {
            await tx.insert(samlConfigs).values({
              organizationId: orgId,
              ...encryptedConfig,
            });
          }
        }
      });

      return ops.organizations.getDecryptedOrg(orgId);
    },

    getDecryptedOrg: async (orgId: string) => {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
        with: { samlConfig: true },
      });

      if (!org?.samlConfig) return org;

      const passphrase = process.env.PGCRYPTO_KEY;
      if (!passphrase) throw new Error("Encryption key not configured");

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

      return {
        ...org,
        samlConfig: {
          ...org.samlConfig,
          entryPoint: decryptedConfig.entry_point as any,
          issuer: decryptedConfig.issuer as any,
          cert: decryptedConfig.cert as any,
        },
      };
    },
  },

  members: {
    add: async (orgId: string, email: string, role: "owner" | "member") => {
      const user = await db.query.users.findFirst({
        where: eq(users.email, email),
      });

      if (!user) throw new Error("User not found");

      await db.insert(organizationMembers).values({
        organizationId: orgId,
        userId: user.id,
        role,
      });

      return { success: true };
    },
  },
};

// organizations/handlers.ts
const handlers = {
  getOrgByDomain: async (req: Request, res: Response) => {
    try {
      const org = await ops.organizations.getByDomain(req.params.domain);
      res.json(org);
    } catch (error) {
      res.status(404).json({ error: "Organization not found" });
    }
  },

  updateOrg: async (req: Request, res: Response) => {
    try {
      if (req.body.saml) {
        schemas.samlConfig.parse(req.body.saml);
      }
      const org = await ops.organizations.update(req.params.orgId, req.body);
      res.json(org);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Failed to update organization" });
    }
  },

  addMember: async (req: Request, res: Response) => {
    try {
      const { email, role } = schemas.member.parse(req.body);
      const result = await ops.members.add(req.params.orgId, email, role);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: "Failed to add member" });
    }
  },

  getUserOrgs: async (req: Request, res: Response) => {
    const memberships = await ops.organizations.getUserOrgs(req.dbUser!.id);
    res.json(
      memberships.map((m) => ({
        ...m.organization,
        role: m.role,
      }))
    );
  },
};

export default Router()
  .get("/domain/:domain", handlers.getOrgByDomain)
  .put("/:orgId", handlers.updateOrg)
  .post("/:orgId/members", handlers.addMember)
  .get("/me", handlers.getUserOrgs);
