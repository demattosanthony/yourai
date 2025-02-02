import { ApiResponse } from "../config/schema";
import { Request, Response } from "express";

export const handle =
  <T>(fn: (req: Request) => Promise<T>) =>
  async (req: Request, res: Response) => {
    try {
      const data = await fn(req);
      res.json(data as ApiResponse<T>);
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error",
      } as ApiResponse<T>);
    }
  };
