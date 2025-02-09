import { Router, Request, Response, NextFunction } from "express";
import { CONFIG } from "./config/constants";
import { checkTokens, DbUser, sendAuthCookies } from "./createAuthToken";
import { organizationMembers } from "./config/schema";
import db from "./config/db";
import { and, eq } from "drizzle-orm";

// Routes
import authRoutes from "./features/auth";
import modelRoutes from "./features/models";
import threadRoutes from "./features/threads";
import paymentRoutes, { webhook } from "./features/payments";
import organizationRoutes from "./features/organizations";
import s3 from "./config/s3";
import { handle } from "./utils";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      dbUser?: DbUser;
      userId?: string;
    }
  }
}

// Auth middleware
export const auth = async (req: any, res: any, next: any) => {
  try {
    const { id, rid } = req.cookies;
    if (!id || !rid) throw new Error();

    const { user } = await checkTokens(id, rid);

    if (user) {
      sendAuthCookies(res, user);
      req.dbUser = user;
    }

    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
};

// Subscription check
export const checkSub = async (req: any, res: any, next: any) => {
  if (!CONFIG.__prod__ || CONFIG.EMAIL_WHITELIST.includes(req.dbUser.email))
    return next();

  if (!["trialing", "active"].includes(req.dbUser?.subscriptionStatus)) {
    return res.status(402).json({ error: "Subscription required" });
  }
  next();
};

// Super admin check
export const superAdminMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (req.dbUser?.systemRole !== "super_admin") {
    res.status(403).json({ error: "Unauthorized" });
    return;
  }
  next();
};

// Organization owner check
export const isOrgOwner = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const member = await db.query.organizationMembers.findFirst({
    where: and(
      eq(organizationMembers.organizationId, req.params.orgId),
      eq(organizationMembers.userId, req.dbUser!.id)
    ),
  });

  if (!member || member.role !== "owner") {
    res.status(403).json({ error: "Not authorized" });
    return;
  }

  next();
};

export default Router()
  .use("/auth", authRoutes)
  .use("/models", modelRoutes)
  .use("/threads", auth, checkSub, threadRoutes)
  .post("/payments/webhook", webhook)
  .use("/payments", auth, paymentRoutes)
  .use("/organizations", auth, superAdminMiddleware, organizationRoutes)
  .post(
    "/presigned-url",
    auth,
    handle(async (req) => {
      const { filename, mime_type, size } = req.body;
      const file_key = `uploads/${Date.now()}-${filename}`;
      const url = s3.presign(file_key, {
        expiresIn: 3600, // 1 hour
        type: mime_type,
        method: "PUT",
      });
      const viewUrl = s3.file(file_key).presign({
        expiresIn: 3600,
        method: "GET",
      });

      return {
        url,
        viewUrl,
        file_metadata: {
          filename,
          mime_type,
          file_key,
          size,
        },
      };
    })
  );
