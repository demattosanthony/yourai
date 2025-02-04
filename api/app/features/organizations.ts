import { Request, Response, Router } from "express";
import { eq, sql } from "drizzle-orm";
import z from "zod";
import db from "../config/db";
import {
  organizationMembers,
  organizations,
  samlConfigs,
  users,
} from "../config/schema";
import s3 from "../config/s3";

// Core Types
type Role = "owner" | "member";
interface SamlConfig {
  entryPoint?: string;
  issuer?: string;
  cert?: string;
  callbackUrl?: string;
}

// Validation Schemas
const schemas = {
  org: z.object({
    name: z.string().min(1),
    domain: z.string().optional(),
    logo: z.string().optional(),
    ownerEmail: z.string().email().optional(),
    ownerName: z.string().optional(),
    saml: z
      .object({
        entryPoint: z.string().url().optional(),
        issuer: z.string().optional(),
        cert: z.string().optional(),
        callbackUrl: z.string().url().optional(),
      })
      .optional(),
  }),
  member: z.object({
    email: z.string().email(),
    role: z.enum(["owner", "member"]),
  }),
};

// Utility Functions
const crypto = {
  encrypt: (value: string) => {
    const key = process.env.PGCRYPTO_KEY;
    return sql`pgp_sym_encrypt(${value}::text, ${key})`;
  },
  decrypt: (field: string) => {
    const key = process.env.PGCRYPTO_KEY;
    return sql`pgp_sym_decrypt(${field}, ${key})::text`;
  },
};

// Core Operations
const ops = {
  async list(page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const [orgs, count] = await Promise.all([
      db.query.organizations.findMany({
        with: { samlConfig: true },
        limit,
        offset,
      }),
      db.select({ count: sql`count(*)` }).from(organizations),
    ]);

    const data = await Promise.all(
      orgs.map(async (org) => ({
        ...org,
        logoUrl: org.logo
          ? s3.file(org.logo).presign({ expiresIn: 3600 })
          : null,
        samlConfig: org.samlConfig
          ? await ops.decryptSaml(org.samlConfig)
          : null,
      }))
    );

    return {
      data,
      pagination: {
        page,
        limit,
        total: Number(count[0].count),
        pages: Math.ceil(Number(count[0].count) / limit),
      },
    };
  },

  async create(data: z.infer<typeof schemas.org>) {
    const slug = data.domain?.split(".")[0].toLowerCase();
    if (
      await db.query.organizations.findFirst({
        where: eq(organizations.slug, slug!),
      })
    ) {
      throw new Error("Organization already exists");
    }

    return db.transaction(async (tx) => {
      const [org] = await tx
        .insert(organizations)
        .values({
          name: data.name,
          slug: slug!,
          domain: data.domain,
          logo: data.logo,
        })
        .returning();

      if (data.ownerEmail) {
        const owner =
          (await tx.query.users.findFirst({
            where: eq(users.email, data.ownerEmail),
          })) ||
          (await tx
            .insert(users)
            .values({
              email: data.ownerEmail,
              name: data.ownerName || data.ownerEmail.split("@")[0],
              identityProvider: "saml",
            })
            .returning()
            .then(([user]) => user));

        if (!owner) throw new Error("Failed to create or find owner");

        await tx.insert(organizationMembers).values({
          organizationId: org.id,
          userId: owner.id,
          role: "owner" as Role,
        });
      }

      if (data.saml) {
        await ops.updateSaml(org.id, data.saml);
      }

      return org;
    });
  },

  async update(orgId: string, data: Partial<z.infer<typeof schemas.org>>) {
    return db.transaction(async (tx) => {
      if (data.name || data.domain || data.logo) {
        await tx
          .update(organizations)
          .set({
            name: data.name,
            domain: data.domain,
            logo: data.logo,
            updatedAt: new Date(),
          })
          .where(eq(organizations.id, orgId));
      }

      if (data.saml) {
        await ops.updateSaml(orgId, data.saml);
      }

      return ops.getById(orgId);
    });
  },

  async updateSaml(orgId: string, config: SamlConfig) {
    const existing = await db.query.samlConfigs.findFirst({
      where: eq(samlConfigs.organizationId, orgId),
    });

    const values = {
      organizationId: orgId,
      entryPoint: crypto.encrypt(config.entryPoint || ""),
      issuer: crypto.encrypt(config.issuer || ""),
      cert: crypto.encrypt(config.cert || ""),
      callbackUrl:
        config.callbackUrl || `${process.env.BASE_URL}/auth/saml/callback`,
      updatedAt: new Date(),
    };

    return existing
      ? db
          .update(samlConfigs)
          .set(values)
          .where(eq(samlConfigs.id, existing.id))
      : db.insert(samlConfigs).values(values);
  },

  async decryptSaml(config: any) {
    const decrypted = await db
      .execute(
        sql`
      SELECT 
        ${crypto.decrypt(config.entryPoint)} as entry_point,
        ${crypto.decrypt(config.issuer)} as issuer,
        ${crypto.decrypt(config.cert)} as cert,
        ${config.callbackUrl} as callback_url
    `
      )
      .then((r) => r.rows[0]);

    return {
      entryPoint: decrypted.entry_point,
      issuer: decrypted.issuer,
      cert: decrypted.cert,
      callbackUrl: config.callbackUrl,
    };
  },

  async getById(id: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.id, id),
      with: { samlConfig: true },
    });
    if (!org) throw new Error("Organization not found");
    return {
      ...org,
      samlConfig: org.samlConfig ? await ops.decryptSaml(org.samlConfig) : null,
    };
  },

  async delete(id: string) {
    return db.transaction(async (tx) => {
      await tx
        .delete(organizationMembers)
        .where(eq(organizationMembers.organizationId, id));
      await tx.delete(organizations).where(eq(organizations.id, id));
    });
  },
};

// Request Handlers
const handle = {
  async list(req: Request, res: Response) {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    res.json(await ops.list(page, limit));
  },

  async create(req: Request, res: Response) {
    const data = schemas.org.parse(req.body);
    res.json(await ops.create(data));
  },

  async update(req: Request, res: Response) {
    const data = schemas.org.partial().parse(req.body);
    res.json(await ops.update(req.params.id, data));
  },

  async delete(req: Request, res: Response) {
    await ops.delete(req.params.id);
    res.json({ success: true });
  },
};

// Router
export default Router()
  .get("", handle.list)
  .post("", handle.create)
  .put("/:id", handle.update)
  .delete("/:id", handle.delete);
