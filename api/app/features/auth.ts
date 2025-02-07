import { Router, Request, Response } from "express";
import { checkTokens, DbUser, sendAuthCookies } from "../createAuthToken";
import db from "../config/db";
import { and, eq } from "drizzle-orm";
import myPassport, { authenticateSaml } from "../config/passport";
import {
  organizationInvites,
  organizationMembers,
  organizations,
  users,
} from "../config/schema";
import s3 from "../config/s3";

// Pure business logic operations
const ops = {
  getUser: async (userId: string) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
      with: {
        organizationMembers: {
          with: {
            organization: true,
          },
        },
      },
    });

    // Transform the response to include logo URLs
    if (user?.organizationMembers) {
      user.organizationMembers = user.organizationMembers.map((member) => ({
        ...member,
        organization: member.organization && {
          ...member.organization,
          logo: member.organization.logo
            ? s3.presign(member.organization.logo, {
                expiresIn: 60 * 60, // 1 hour
              })
            : null,
        },
      }));
    }

    return user;
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

  verifyInvite: async (token: string) => {
    const invite = await db.query.organizationInvites.findFirst({
      where: eq(organizationInvites.token, token),
      with: {
        organization: true,
      },
    });

    if (!invite || !invite.organizationId) {
      throw new Error("Invalid or expired invite link");
    }

    return invite;
  },

  joinOrganization: async (organizationId: string, userId: string) => {
    // Check if user is already a member
    const existingMember = await db.query.organizationMembers.findFirst({
      where: and(
        eq(organizationMembers.organizationId, organizationId),
        eq(organizationMembers.userId, userId)
      ),
    });

    if (existingMember) {
      return existingMember;
    }

    // Add user as member
    const [member] = await db
      .insert(organizationMembers)
      .values({
        organizationId,
        userId,
        role: "member",
      })
      .returning();

    return member;
  },
};

// Request handlers that use ops
const handlers = {
  googleCallback: async (req: Request, res: Response) => {
    const user = req.user as DbUser;
    const state = req.query.state as string | undefined;

    sendAuthCookies(res, user);

    // If there's a state parameter containing invite token, process it
    if (state) {
      try {
        // Verify and process invite
        const invite = await ops.verifyInvite(state);
        await ops.joinOrganization(invite.organizationId as string, user.id);
        res.redirect(`${process.env.FRONTEND_URL}?invite_success=true`);
        return;
      } catch (error: any) {
        res.redirect(`${process.env.FRONTEND_URL}?error=${error.message}`);
        return;
      }
    }

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

  joinWithInvite: async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      const { user } = req.body;

      // Verify invite token
      const invite = await ops.verifyInvite(token);

      let userId: string;

      // If user is already logged in, use their ID
      if (req.dbUser) {
        userId = req.dbUser.id;
      } else if (user) {
        // Create new user if not logged in
        const [newUser] = await db
          .insert(users)
          .values({
            email: user.email,
            name: user.name,
          })
          .returning();
        userId = newUser.id;

        // Send auth cookies for the new user
        sendAuthCookies(res, newUser as DbUser);
      } else {
        throw new Error("User information required");
      }

      // Join the organization
      await ops.joinOrganization(invite.organizationId as string, userId!);

      res.json({ success: true });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },
};

// Auth configs
const googleAuthConfig = {
  session: false,
  failureRedirect: `${process.env.FRONTEND_URL}?error=unauthorized`,
};

const optionalAuth = async (req: any, res: any, next: any) => {
  try {
    const { id, rid } = req.cookies;
    if (id && rid) {
      const { user } = await checkTokens(id, rid);
      if (user) {
        sendAuthCookies(res, user);
        req.dbUser = user;
      }
    }
    next();
  } catch {
    // Continue even if auth fails
    next();
  }
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
  .post("/invite/:token", optionalAuth, handlers.joinWithInvite)
  .get("/me", handlers.me);
