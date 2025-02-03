import { Router, Request } from "express";
import { checkTokens, DbUser, sendAuthCookies } from "../createAuthToken";
import db from "../config/db";
import { eq } from "drizzle-orm";
import myPassport, { authenticateSaml } from "../config/passport";
import { users } from "../config/schema";
import { handle } from "../utils/handlers";

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

  me: async (req: Request) => {
    const { id, rid } = req.cookies;
    if (!id || !rid) return null;
    const { userId } = await checkTokens(id, rid);
    const user = await ops.getUser(userId);
    return user || null;
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
  .post("/logout", handlers.logout)
  .get("/me", handle(handlers.me));
