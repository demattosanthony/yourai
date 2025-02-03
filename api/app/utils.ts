import { generateText } from "ai";
import { MODELS } from "./features/models";
import { ApiResponse } from "./config/schema";
import { Request, Response } from "express";

export async function generateThreadTitle(message: string) {
  const { text } = await generateText({
    model: MODELS["claude-3.5-haiku"].model,
    temperature: 0.3,
    prompt: `Generate a title for the following user message. The title should describe what their message is about so they can later find it easily. THe title should be 3 words give or take. Only respond with the title and nothing else.\n\nUser message:\n\n${message}`,
  });

  return text;
}

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
