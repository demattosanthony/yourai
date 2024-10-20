import Express from "express";
import cors from "cors";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { convertToCoreMessages, streamText, tool, type Message } from "ai";
import { createGroq } from "@ai-sdk/groq";
import { tavily } from "@tavily/core";
import { z } from "zod";

const PORT = 3000;

const app = Express();
app.use(Express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

const groq = createGroq();

const perplexity = createOpenAI({
  name: "perplexity",
  apiKey: process.env.PPLX_API_KEY ?? "",
  baseURL: "https://api.perplexity.ai/",
});

const MODELS = {
  "gpt-4o-mini": openai("gpt-4o-mini"),
  "gpt-4o": openai("gpt-4o"),
  "claude-3.5-sonnet": anthropic("claude-3-5-sonnet-20240620"),
  "claude-3-opus": anthropic("claude-3-opus-20240229"),
  "llama-3.2-90b-text-preview": groq("llama-3.2-90b-text-preview"),
  "llama-3.2-1b-preview": groq("llama-3.2-1b-preview"),
  "llama-3.2-11b-text-preview": groq("llama-3.2-11b-text-preview"),
  "llama-3.1-70b-versatile": groq("llama-3.1-70b-versatile"),
  "llama-3.1-online-large": perplexity("llama-3.1-sonar-large-128k-online"),
  "llama-3.1-online-small": perplexity("llama-3.1-sonar-small-128k-online"),
  "llama-3.1-online-huge": perplexity("llama-3.1-sonar-huge-128k-online"),
};

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

const webSearchTool = tool({
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

interface inferenceParams {
  model: keyof typeof MODELS;
  messages: Message[];
  maxTokens?: number;
}

async function runInference(
  params: inferenceParams,
  onToolEvent: (event: string, data: any) => void
) {
  const { model, messages } = params;

  const messagesToSend = [
    {
      role: "system" as const,
      content: `You are a briliant AI. Like Jarvis from Iron Man. It is currently ${new Date().toLocaleDateString()}.`,
    },
    ...messages,
  ];

  const modelToRun = MODELS[model];

  const { textStream } = await streamText({
    model: modelToRun,
    tools: {
      webSearch: webSearchTool,
    },
    toolChoice: "auto",
    maxSteps: 5,
    temperature: 1,
    messages: convertToCoreMessages(messagesToSend),
    maxTokens: params.maxTokens,
    onChunk({ chunk }) {
      if (chunk.type === "tool-call") {
        const { toolName, args } = chunk;
        // Trigger the tool call start event
        onToolEvent("tool-call-start", { toolName, args });
      }

      if (chunk.type === "tool-result") {
        // Trigger the tool call end event
        onToolEvent("tool-call-end", { toolName: chunk.toolName });
      }
    },
  });

  return textStream;
}

app.post("/inference", async (req, res) => {
  const { model, messages, maxTokens } = req.body;

  res.setHeader("Content-Type", "text/event-stream");

  const onToolEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const textStream = await runInference(
      { model, messages, maxTokens },
      onToolEvent
    );

    for await (const message of textStream) {
      res.write(
        `event: message\ndata: ${JSON.stringify({
          text: message,
        })}\n\n`
      );
    }

    res.end();
  } catch (error) {
    console.log("Error", error);
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
