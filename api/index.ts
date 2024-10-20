import Express from "express";
import cors from "cors";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { convertToCoreMessages, streamText, type Message } from "ai";
import { createGroq } from "@ai-sdk/groq";

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
  "llama-3.2-90b-text-preview": groq("llama-3.2-90b-text-preview"),
  "llama-3.2-1b-preview": groq("llama-3.2-1b-preview"),
  "llama-3.2-11b-text-preview": groq("llama-3.2-11b-text-preview"),
  "llama-3.1-70b-versatile": groq("llama-3.1-70b-versatile"),
  "llama-3.1-online-large": perplexity("llama-3.1-sonar-large-128k-online"),
  "llama-3.1-online-small": perplexity("llama-3.1-sonar-small-128k-online"),
  "llama-3.1-online-huge": perplexity("llama-3.1-sonar-huge-128k-online"),
};

interface inferenceParams {
  model: keyof typeof MODELS;
  messages: Message[];
  maxTokens?: number;
}

async function runInference(params: inferenceParams) {
  const { model, messages } = params;

  const modelToRun = MODELS[model];

  const { textStream } = await streamText({
    model: modelToRun,
    messages: convertToCoreMessages(messages),
    maxTokens: params.maxTokens,
  });

  return textStream;
}

app.post("/inference", async (req, res) => {
  const { model, messages, maxTokens } = req.body;

  res.setHeader("Content-Type", "text/event-stream");

  try {
    const textStream = await runInference({ model, messages, maxTokens });

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
