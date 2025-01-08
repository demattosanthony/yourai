import Express from "express";
import cors from "cors";
import { generateText, streamText, type CoreMessage } from "ai";
import path from "path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { eq } from "drizzle-orm";

import { db } from "./config/db";
import { MODELS } from "./models";
import { threads, messages } from "./config/schema";

interface inferenceParams {
  model: keyof typeof MODELS;
  messages: CoreMessage[];
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}

async function runInference(
  params: inferenceParams,
  onToolEvent: (event: string, data: any) => void
) {
  const { model, messages, temperature, maxTokens } = params;

  let messagesToSend = [...messages];

  const modelToRun = MODELS[model];

  if (modelToRun.supportsSystemMessages !== false && params.systemMessage) {
    messagesToSend.unshift({
      role: "system" as const,
      content: params.systemMessage,
    });
  }

  let generationParams: any = {
    model: modelToRun.model,
    temperature: temperature || 0.5,
    messages: messagesToSend,
    maxTokens: maxTokens || undefined,
  };

  if (modelToRun.supportsToolUse) {
    generationParams = {
      ...generationParams,
      //   tools: {
      //     webSearch: webSearchTool,
      //     getWebPageContents: getWebPageContentsTool,
      //   },
      //   toolChoice: "auto",
      //   maxSteps: 5,
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
  app.use(Express.json({ limit: "100gb" }));
  app.use(cors());

  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  app.get("/models", async (req, res) => {
    res.json(
      Object.entries(MODELS).map(([modelName, config]) => ({
        name: modelName,
        supportsToolUse: config.supportsToolUse,
        supportsStreaming: config.supportsStreaming,
        provider: config.provider,
        supportsImages: config.supportsImages,
        supportsPdfs: config.supportsPdfs,
      }))
    );
  });

  app.post("/threads", async (req, res) => {
    try {
      const threadId = crypto.randomUUID();
      const now = new Date();

      await db.insert(threads).values({
        id: threadId,
        created_at: now,
        updated_at: now,
      });

      res.json({ id: threadId });
    } catch (error) {
      console.error("Error creating thread:", error);
      res.status(500).json({ error: "Failed to create thread" });
    }
  });

  app.get("/threads", async (req, res) => {
    try {
      const allThreads = await db.query.threads.findMany({
        orderBy: (threads, { desc }) => [desc(threads.created_at)],
        with: {
          messages: {
            orderBy: messages.created_at,
          },
        },
      });

      res.json(allThreads);
    } catch (error) {
      console.error("Error fetching threads:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/threads/:threadId", async (req, res) => {
    try {
      const { threadId } = req.params;

      // Get the thread with messages in a single query
      const thread = await db.query.threads.findFirst({
        where: eq(threads.id, threadId),
        with: {
          messages: {
            orderBy: messages.created_at,
          },
        },
      });

      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }

      res.json(thread);
    } catch (error) {
      console.error("Error fetching thread:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.post("/threads/:threadId/messages", async (req, res) => {
    try {
      const { threadId } = req.params;
      const { role, content } = req.body;

      // Make sure role is valid
      if (!["system", "user", "assistant"].includes(role)) {
        res.status(400).json({ error: "Invalid role" });
      }

      // Validate thread exists
      const thread = await db.query.threads.findFirst({
        where: eq(threads.id, threadId),
      });

      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
      }

      // Create a message for each content item
      for (const item of content) {
        const messageId = crypto.randomUUID();

        await db.insert(messages).values({
          id: messageId,
          thread_id: threadId,
          role,
          content: JSON.stringify(item),
          created_at: new Date(),
        });

        await db.query.messages.findFirst({
          where: eq(messages.id, messageId),
        });
      }

      res.status(201).json({
        message: "Messages created successfully",
      });
    } catch (error) {
      console.error("Error creating message:", error);
      res.status(500).json({ error: "Failed to create message" });
    }
  });

  app.post("/threads/:threadId/inference", async (req, res) => {
    const { threadId } = req.params;
    const { model, maxTokens, temperature, instructions } = req.body;

    res.setHeader("Content-Type", "text/event-stream");

    // Validate thread exists and get its messages
    const thread = await db.query.threads.findFirst({
      where: eq(threads.id, threadId),
    });
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
    }
    const threadMessages = await db.query.messages.findMany({
      where: eq(messages.thread_id, threadId),
      orderBy: messages.created_at,
    });

    const onToolEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const textStream = await runInference(
        {
          model,
          messages: threadMessages.map((msg) => ({
            role: msg.role as "system" | "user" | "assistant",
            content: [JSON.parse(msg.content)] as any,
          })),
          maxTokens,
          temperature,
          systemMessage: instructions,
        },
        onToolEvent
      );

      let aiResponse = "";
      for await (const message of textStream) {
        res.write(
          `event: message\ndata: ${JSON.stringify({
            text: message,
          })}\n\n`
        );
        aiResponse += message;
      }

      // Update thread to have the assistant's messages
      await db.insert(messages).values({
        id: crypto.randomUUID(),
        thread_id: threadId,
        role: "assistant",
        content: JSON.stringify({ type: "text", text: aiResponse }),
        created_at: new Date(),
      });

      res.write("event: done\ndata: true\n\n");
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
