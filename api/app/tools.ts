import { tool } from "ai";
import { z } from "zod";

export const getWebPageContentsTool = tool({
  description:
    "Retrieves the content of a specific web page. This tool allows direct access to the underlying code of a given URL. Useful for tasks requiring precise information extraction or analysis of the page structure.	Use this tool when you need to extract specific information from a web page.",
  parameters: z.object({
    url: z.string(),
  }),
  execute: async ({ url }) => {
    const response = await fetch(`https://r.jina.ai/${url}`, {
      headers: {
        Authorization: `Bearer ${process.env.JINA_API_KEY}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ${url}`);
    }

    return await response.text();
  },
});
