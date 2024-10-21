import { tavily } from "@tavily/core";
import { tool } from "ai";
import { z } from "zod";

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

export const webSearchTool = tool({
  description:
    "Search the web for information. This tool is useful when you need to retrieve information from the web or access to real-time data. Only use this tool when you need to access the web.",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const context = await tvly.search(query, {
      days: 7,
    });

    return JSON.stringify(context);
  },
});
