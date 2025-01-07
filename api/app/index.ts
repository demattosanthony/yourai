import Express from "express";
import cors from "cors";
import {
  convertToCoreMessages,
  generateText,
  streamText,
  type Message,
} from "ai";
import { MODELS } from "../models";
import { getWebPageContentsTool, webSearchTool } from "../tools";
import multer from "multer";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import path from "path";
import { profile } from "../profile";
import db from "./config/db";

interface inferenceParams {
  model: keyof typeof MODELS;
  messages: Message[];
  maxTokens?: number;
  temperature?: number;
}

async function runInference(
  params: inferenceParams,
  onToolEvent: (event: string, data: any) => void
) {
  const { model, messages, temperature, maxTokens } = params;

  let messagesToSend = [...messages];

  const modelToRun = MODELS[model];

  //   if (modelToRun.supportsSystemMessages !== false) {
  //     messagesToSend.unshift({
  //       id: "sysMessage",
  //       role: "system" as const,
  //       content: profile.system,
  //     });
  //   }

  let generationParams: any = {
    model: modelToRun.model,
    temperature: temperature || 0.5,
    messages: convertToCoreMessages(messagesToSend),
    maxTokens: maxTokens || undefined,
  };

  if (modelToRun.supportsToolUse) {
    generationParams = {
      ...generationParams,
      tools: {
        webSearch: webSearchTool,
        getWebPageContents: getWebPageContentsTool,
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

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "files"));
    },
    filename: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
  limits: {
    fileSize: 1000 * 1024 * 1024, // Limit file size to 10MB
  },
  // fileFilter: (req, file, cb) => {
  //   if (file.mimetype === "application/pdf") {
  //     cb(null, true);
  //   } else {
  //     cb(new Error("Only PDF files are allowed"));
  //   }
  // },
});

const PORT = process.env.PORT || 4000;

async function main() {
  try {
    await migrate(db, {
      migrationsFolder: path.join(__dirname, "../drizzle"),
    });
  } catch (error) {
    console.error("Error occurred during database migration", error);
    process.exit(1);
  }

  const app = Express();
  app.use(Express.json());
  app.use(cors());

  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  app.post("/inference", async (req, res) => {
    const { model, messages, maxTokens, temperature } = req.body;

    res.setHeader("Content-Type", "text/event-stream");

    const onToolEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const textStream = await runInference(
        { model, messages, maxTokens, temperature },
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
