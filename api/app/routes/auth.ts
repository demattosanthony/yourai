import { Router } from "express";
import { checkTokens, DbUser, sendAuthCookies } from "../createAuthToken";
import db from "../config/db";
import { eq } from "drizzle-orm";
import myPassport from "../config/passport";
import { users } from "../config/schema";

const router = Router();

router.get("/google", myPassport.authenticate("google", { session: false }));

router.get(
  "/google/callback",
  myPassport.authenticate("google", {
    session: false,
    failureRedirect: process.env.FRONTEND_URL + "?error=unauthorized", // Add error parameter
  }),
  (req, res) => {
    sendAuthCookies(res, req.user as DbUser);
    if ((req.user as DbUser).subscriptionStatus === "active") {
      res.redirect(process.env.FRONTEND_URL!);
    } else {
      res.redirect(process.env.FRONTEND_URL!);
    }
  }
);

router.get(
  "/microsoft",
  myPassport.authenticate("microsoft", {
    session: false,
    prompt: "select_account",
  })
);

router.get(
  "/microsoft/callback",
  myPassport.authenticate("microsoft", {
    session: false,
    failureRedirect: process.env.FRONTEND_URL + "?error=unauthorized",
    failWithError: true, // Add this
  }),
  (req, res) => {
    sendAuthCookies(res, req.user as DbUser);
    if ((req.user as DbUser).subscriptionStatus === "active") {
      res.redirect(process.env.FRONTEND_URL!);
    } else {
      res.redirect(process.env.FRONTEND_URL!);
    }
  }
);

router.post("/logout", (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    domain: process.env.NODE_ENV === "production" ? ".syyclops.com" : "",
    path: "/", // Make sure this matches the path used when setting the cookies
  };

  res.clearCookie("id", cookieOptions);
  res.clearCookie("rid", cookieOptions);
  res.status(200).send("Logged out");
});

router.get("/me", async (req, res) => {
  const { id, rid } = req.cookies;
  let user: DbUser | null | undefined = null;

  try {
    const { userId, user: maybeUser } = await checkTokens(id, rid);
    if (maybeUser) {
      user = maybeUser;
    } else {
      user = await db.query.users.findFirst({
        where: eq(users.id, userId),
      });
    }

    res.json(user);
  } catch (e) {
    res.json(user);
  }
});

export default router;
