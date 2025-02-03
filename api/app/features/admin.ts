import z from "zod";
import db from "../config/db";
import {
  organizationMembers,
  organizations,
  samlConfigs,
  users,
} from "../config/schema";
import { eq, sql } from "drizzle-orm";
import { Request, Response, Router } from "express";
import s3 from "../config/s3";

export interface Organization {
  id: string;
  name: string;
  slug: string;
  domain?: string;
  logo?: string;
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

export interface PaginationParams {
  page: number;
  limit: number;
}

export const schemas = {
  createOrg: z.object({
    name: z.string().min(1).max(255),
    ownerEmail: z.string().email().optional(),
    ownerName: z.string().min(1).max(255).optional(),
    domain: z.string().optional(),
    logo: z.string().optional(),
  }),

  samlConfig: z.object({
    entryPoint: z.string().url().optional(),
    issuer: z.string().min(1).optional(),
    cert: z.string().min(1).optional(),
    callbackUrl: z.string().url().optional(),
  }),
};

const ops = {
  organizations: {
    list: async ({ page, limit }: PaginationParams) => {
      const offset = (page - 1) * limit;
      const [orgs, totalCount] = await Promise.all([
        db.query.organizations.findMany({
          with: { samlConfig: true },
          orderBy: organizations.createdAt,
          limit,
          offset,
        }),
        db.select({ count: sql`count(*)` }).from(organizations),
      ]);

      const orgsWithLogoUrls = await Promise.all(
        orgs.map(async (org) => {
          let logoUrl = null;
          if (org.logo) {
            logoUrl = s3.file(org.logo).presign({
              expiresIn: 3600, // 1 hour
              method: "GET",
            });
          }

          let decryptedSamlConfig = null;
          if (org.samlConfig) {
            const passphrase = process.env.PGCRYPTO_KEY;
            if (passphrase) {
              decryptedSamlConfig = await db
                .execute(
                  sql`
                  SELECT 
                    pgp_sym_decrypt(${org.samlConfig.entryPoint}, ${passphrase})::text as entry_point,
                    pgp_sym_decrypt(${org.samlConfig.issuer}, ${passphrase})::text as issuer,
                    pgp_sym_decrypt(${org.samlConfig.cert}, ${passphrase})::text as cert,
                    ${org.samlConfig.callbackUrl} as callback_url
                  `
                )
                .then(
                  (result) => result.rows[0] as unknown as DecryptedSamlConfig
                );

              org.samlConfig = {
                ...org.samlConfig,
                entryPoint: decryptedSamlConfig.entry_point as unknown as any,
                issuer: decryptedSamlConfig.issuer as unknown as any,
                cert: decryptedSamlConfig.cert as unknown as any,
              };
            }
          }

          return {
            ...org,
            logoUrl,
          };
        })
      );

      return {
        data: orgsWithLogoUrls,
        pagination: {
          page,
          limit,
          totalItems: Number(totalCount[0].count),
          totalPages: Math.ceil(Number(totalCount[0].count) / limit),
        },
      };
    },

    create: async (data: z.infer<typeof schemas.createOrg>, userId: string) => {
      const slug = data.domain!.split(".")[0].toLowerCase();

      const existingOrg = await db.query.organizations.findFirst({
        where: eq(organizations.slug, slug),
      });

      if (existingOrg) {
        throw new Error("Organization with similar name already exists");
      }

      return db.transaction(async (tx) => {
        const [org] = await tx
          .insert(organizations)
          .values({
            name: data.name,
            slug,
            domain: data.domain || null,
            logo: data.logo || null,
          })
          .returning();

        if (data.ownerEmail) {
          let owner = await tx.query.users.findFirst({
            where: eq(users.email, data.ownerEmail),
          });

          if (!owner) {
            const [newUser] = await tx
              .insert(users)
              .values({
                email: data.ownerEmail,
                name: data.ownerName || data.ownerEmail.split("@")[0],
                identityProvider: "saml",
                createdAt: new Date(),
              })
              .returning();
            owner = newUser;
          }

          await tx.insert(organizationMembers).values({
            organizationId: org.id,
            userId: owner.id,
            role: "owner",
          });
        }

        return org;
      });
    },

    getByDomain: async (domain: string) => {
      const org = await db.query.organizations.findFirst({
        where: eq(organizations.domain, domain),
        with: { samlConfig: true },
      });

      if (!org) throw new Error("Organization not found");

      if (org.samlConfig) {
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

        org.samlConfig = {
          ...org.samlConfig,
          entryPoint: decryptedConfig.entry_point as unknown as any,
          issuer: decryptedConfig.issuer as unknown as any,
          cert: decryptedConfig.cert as unknown as any,
        };
      }

      return org;
    },

    update: async (orgId: string, data: any) => {
      const passphrase = process.env.PGCRYPTO_KEY;
      if (!passphrase) throw new Error("Encryption key not configured");

      // Get organization details first to access the slug
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, orgId),
      });

      if (!organization) throw new Error("Organization not found");

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

        // Update SAML config
        if (data.saml) {
          const encryptedConfig: any = {
            updatedAt: new Date(),
          };

          const existing = await tx.query.samlConfigs.findFirst({
            where: eq(samlConfigs.organizationId, orgId),
          });

          // Only encrypt and include fields that are provided, keeping existing values if not provided
          encryptedConfig.entryPoint = data.saml.entryPoint
            ? sql`pgp_sym_encrypt(${data.saml.entryPoint}::text, ${passphrase})`
            : existing?.entryPoint;

          encryptedConfig.issuer = data.saml.issuer
            ? sql`pgp_sym_encrypt(${data.saml.issuer}::text, ${passphrase})`
            : existing?.issuer;

          encryptedConfig.cert = data.saml.cert
            ? sql`pgp_sym_encrypt(${data.saml.cert}::text, ${passphrase})`
            : existing?.cert;

          encryptedConfig.callbackUrl =
            data.saml.callbackUrl ?? existing?.callbackUrl;

          if (existing) {
            // For existing configs, just update with whatever was provided
            await tx
              .update(samlConfigs)
              .set(encryptedConfig)
              .where(eq(samlConfigs.id, existing.id));
          } else {
            // For new configs, only insert if we have at least one field
            if (
              !data.saml.entryPoint &&
              !data.saml.issuer &&
              !data.saml.cert &&
              !data.saml.callbackUrl
            ) {
              throw new Error(
                "At least one SAML configuration field is required"
              );
            }

            // Set default empty values for required fields if not provided
            if (!encryptedConfig.entryPoint) {
              encryptedConfig.entryPoint = sql`pgp_sym_encrypt(''::text, ${passphrase})`;
            }
            if (!encryptedConfig.issuer) {
              encryptedConfig.issuer = sql`pgp_sym_encrypt(''::text, ${passphrase})`;
            }
            if (!encryptedConfig.cert) {
              encryptedConfig.cert = sql`pgp_sym_encrypt(''::text, ${passphrase})`;
            }
            if (!encryptedConfig.callbackUrl) {
              encryptedConfig.callbackUrl =
                process.env.BASE_URL +
                "/auth/saml/" +
                organization.slug +
                "/callback";
            }

            await tx.insert(samlConfigs).values({
              organizationId: orgId,
              ...encryptedConfig,
            });
          }
        }
      });

      return "Organization updated successfully";
    },

    delete: async (orgId: string) => {
      await db.transaction(async (tx) => {
        await tx
          .delete(organizationMembers)
          .where(eq(organizationMembers.organizationId, orgId));
        await tx.delete(organizations).where(eq(organizations.id, orgId));
      });
    },
  },
};

const handlers = {
  listOrganizations: async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await ops.organizations.list({ page, limit });
    res.json(result);
  },

  createOrganization: async (req: Request, res: Response) => {
    try {
      const data = schemas.createOrg.parse(req.body);
      const org = await ops.organizations.create(data, req.dbUser!.id);
      res.json(org);
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Failed to create organization" });
    }
  },

  getOrganizationByDomain: async (req: Request, res: Response) => {
    try {
      const org = await ops.organizations.getByDomain(req.params.domain);
      res.json(org);
    } catch (error) {
      res.status(404).json({ error: "Organization not found" });
    }
  },

  updateOrganization: async (req: Request, res: Response) => {
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

  deleteOrganization: async (req: Request, res: Response) => {
    try {
      await ops.organizations.delete(req.params.orgId);
      res.json({ message: "Organization deleted successfully" });
    } catch (error) {
      console.error(error);
      res.status(400).json({ error: "Failed to delete organization" });
    }
  },
};

export default Router()
  .get("/organizations", handlers.listOrganizations)
  .post("/organizations", handlers.createOrganization)
  .get("/organizations/domain/:domain", handlers.getOrganizationByDomain)
  .put("/organizations/:orgId", handlers.updateOrganization)
  .delete("/organizations/:orgId", handlers.deleteOrganization);
