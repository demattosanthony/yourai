import { Router, Request, Response } from "express";
import { checkTokens, DbUser, sendAuthCookies } from "../createAuthToken";
import db from "../config/db";
import { eq } from "drizzle-orm";
import myPassport, { authenticateSaml } from "../config/passport";
import { organizations, users } from "../config/schema";

// Pure business logic operations
const ops = {
  getUser: async (userId: string) => {
    return db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        organizationMembers: {
          limit: 1,
          with: {
            organization: true,
          },
        },
      },
    });
  },

  logout: () => {
    return {
      cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax" as const,
        domain: process.env.NODE_ENV === "production" ? ".syyclops.com" : "",
        path: "/",
      },
    };
  },
};

// Request handlers that use ops
const handlers = {
  googleCallback: (req: Request, res: any) => {
    sendAuthCookies(res, req.user as DbUser);
    res.redirect(process.env.FRONTEND_URL!);
  },

  samlCallback: (req: Request, res: any) => {
    sendAuthCookies(res, req.user as DbUser);
    res.redirect(process.env.FRONTEND_URL!);
  },

  logout: (req: Request, res: any) => {
    const { cookieOptions } = ops.logout();
    res.clearCookie("id", cookieOptions);
    res.clearCookie("rid", cookieOptions);
    res.status(200).send("Logged out");
  },

  me: async (req: Request, res: any) => {
    try {
      const { id, rid } = req.cookies;
      if (!id || !rid) {
        res.status(200).json(null);
        return;
      }
      const { userId } = await checkTokens(id, rid);
      const user = (await ops.getUser(userId)) || null;
      res.status(200).json(user);
    } catch (error) {
      res.status(200).json(null);
    }
  },
};

// Auth configs
const googleAuthConfig = {
  session: false,
  failureRedirect: `${process.env.FRONTEND_URL}?error=unauthorized`,
};

// Router
export default Router()
  .get("/google", myPassport.authenticate("google", { session: false }))
  .get(
    "/google/callback",
    myPassport.authenticate("google", googleAuthConfig),
    handlers.googleCallback
  )
  .get("/saml/:slug", authenticateSaml)
  .post("/saml/:slug/callback", authenticateSaml, handlers.samlCallback)
  .get("/saml/check/:slug", async (req: Request, res: Response) => {
    const { slug } = req.params;

    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
      with: {
        samlConfig: true,
      },
    });

    if (!org || !org.samlConfig) {
      res.status(404).json({
        error: "Organization not found.",
      });
      return;
    }

    res.status(200).json({ valid: true });
    return;
  })
  .post("/logout", handlers.logout)
  .get("/me", handlers.me);
