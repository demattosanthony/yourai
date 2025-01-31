import { Request, Response, NextFunction } from "express";
import { checkTokens, DbUser, sendAuthCookies } from "../createAuthToken";

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      dbUser?: DbUser;
      userId?: string;
    }
  }
}

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.cookies.id || !req.cookies.rid) {
      throw new Error("Unauthorized");
    }

    const { id, rid } = req.cookies;
    const { userId, user } = await checkTokens(id, rid);

    req.userId = userId;

    if (user) {
      sendAuthCookies(res, user);
      req.dbUser = user;
    }

    next();
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
  }
};
