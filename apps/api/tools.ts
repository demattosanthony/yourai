import { tool } from "ai";
import { z } from "zod";
import { getJson } from "serpapi";

export const webSearchTool = tool({
  description:
    "Searches the web using Google and returns structured data. This tool provides comprehensive search results, including titles, snippets, URLs, and other relevant information from various sources like web pages, images, videos, and news.",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const results = await getJson({
      q: query,
      api_key: process.env.SERP_API_KEY,
      engine: "google",
      location: "United States",
    });

    const limitedResults = JSON.stringify(results).substring(0, 20000);
    return limitedResults;
  },
});

export const getWebPageContentsTool = tool({
  description:
    "Retrieves the content of a specific web page. This tool allows direct access to the underlying code of a given URL. Useful for tasks requiring precise information extraction or analysis of the page structure.	",
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
