import { Request, Response, NextFunction } from "express";
import { CONFIG } from "../config/constants";

export const subscriptionCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Assuming your authMiddleware has already run and populated req.dbUser
    if (!req.dbUser) {
      throw new Error("User not authenticated.");
    }

    // Only check if we are in production
    if (!CONFIG.__prod__) {
      return next();
    }

    // Check if user is on whitelist - if so, skip subscription check
    if (CONFIG.EMAIL_WHITELIST.includes(req.dbUser.email)) {
      return next();
    }

    // Check if the user has an active subscription
    const validSubscriptionStatuses = ["trialing", "active"];
    if (
      !req.dbUser.subscriptionStatus ||
      !validSubscriptionStatuses.includes(req.dbUser.subscriptionStatus)
    ) {
      res.status(402).json({
        error: "Payment Required",
        message: "User does not have an active subscription.",
      });
      return;
    }

    next(); // User has an active subscription, proceed to the next middleware/route handler
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
