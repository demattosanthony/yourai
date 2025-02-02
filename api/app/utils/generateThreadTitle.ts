import { generateText } from "ai";
import { MODELS } from "../features/models";

export async function generateThreadTitle(message: string) {
  const { text } = await generateText({
    model: MODELS["claude-3.5-haiku"].model,
    temperature: 0.3,
    prompt: `Generate a title for the following user message. The title should describe what their message is about so they can later find it easily. THe title should be 3 words give or take. Only respond with the title and nothing else.\n\nUser message:\n\n${message}`,
  });

  return text;
}
