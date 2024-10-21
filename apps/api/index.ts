import Express from "express";
import cors from "cors";
import {
  convertToCoreMessages,
  generateText,
  streamText,
  type Message,
} from "ai";
import { MODELS } from "./models";
import { webSearchTool } from "./tools";
import { SYSTEM_MESSAGE } from "./prompts";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import db from "@anyagent/db";
import path from "path";

const PORT = 3000;

async function main() {
  await migrate(db, {
    migrationsFolder: path.join(__dirname, "../../packages/db/drizzle"),
  });

  const app = Express();
  app.use(Express.json());
  app.use(cors());

  app.get("/", (req, res) => {
    res.send("Hello World");
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

    let messagesToSend = [...messages];

    const modelToRun = MODELS[model];

    if (modelToRun.supportsSystemMessages !== false) {
      messagesToSend.unshift({
        id: "sysMessage",
        role: "system" as const,
        content: SYSTEM_MESSAGE,
      });
    }

    let generationParams: any = {
      model: modelToRun.model,
      temperature: 1,
      messages: convertToCoreMessages(messagesToSend),
      maxTokens: params.maxTokens,
    };

    if (modelToRun.supportsToolUse) {
      generationParams = {
        ...generationParams,
        tools: {
          webSearch: webSearchTool,
        },
        toolChoice: "auto",
        maxSteps: 5,
        onChunk({
          chunk,
        }: {
          chunk: { type: string; toolName: string; args: any };
        }) {
          if (chunk.type === "tool-call") {
            const { toolName, args } = chunk;
            onToolEvent("tool-call-start", { toolName, args });
          }

          if (chunk.type === "tool-result") {
            onToolEvent("tool-call-end", { toolName: chunk.toolName });
          }
        },
      };
    }

    if (modelToRun.supportsStreaming) {
      const { textStream } = await streamText(generationParams);
      return textStream;
    } else {
      const { text } = await generateText(generationParams);
      return [text]; // Wrap text in an array to make it iterable
    }
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
}

main();
