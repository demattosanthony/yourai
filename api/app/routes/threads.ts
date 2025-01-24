import { Router } from "express";
import { authMiddleware } from "../middleware/auth";
import { createMessage, createThread, getThread, getThreads } from "../threads";
import { handleError } from "..";
import { CoreMessage } from "ai";
import { s3 } from "bun";
import { eq } from "drizzle-orm";
import db from "../config/db";
import { messages, ContentPart } from "../config/schema";
import { runInference } from "../inference";
import { MODELS } from "../models";

const router = Router();

router.post("", authMiddleware, async (req, res) => {
  try {
    const result = await createThread(req.userId!);
    res.json(result);
  } catch (error: any) {
    handleError(res, error);
  }
});

router.get("", authMiddleware, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const search = (req.query.search as string)?.trim() || "";
    const threads = await getThreads(req.userId!, page, search);
    res.json(threads);
  } catch (error: any) {
    handleError(res, error);
  }
});

router.get("/:threadId", authMiddleware, async (req, res) => {
  try {
    const { threadId } = req.params;
    const thread = await getThread(threadId);
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }
    res.json(thread);
  } catch (error: any) {
    handleError(res, error);
  }
});

router.post("/:threadId/messages", authMiddleware, async (req, res) => {
  try {
    const { threadId } = req.params;
    const { role, content } = req.body;
    if (!["system", "user", "assistant"].includes(role)) {
      res.status(400).json({ error: "Invalid role" });
      return;
    }
    const thread = await getThread(threadId);
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }
    const result = await createMessage(req.userId!, threadId, role, content);
    res.status(201).json(result);
  } catch (error: any) {
    handleError(res, error);
  }
});

router.post("/:threadId/inference", authMiddleware, async (req, res) => {
  const { threadId } = req.params;
  const { model, maxTokens, temperature, instructions } = req.body;

  res.setHeader("Content-Type", "text/event-stream");

  try {
    const thread = await getThread(threadId);
    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
      return;
    }
    let threadMessages = await db.query.messages.findMany({
      where: eq(messages.threadId, threadId),
      orderBy: messages.createdAt,
    });

    const modelToRun = MODELS[model];

    // If model doesn't support images or files than remove them from the messages
    if (!modelToRun.supportsImages) {
      threadMessages = threadMessages.filter(
        (msg) => (msg.content as ContentPart).type !== "image"
      );
    }
    if (!modelToRun.supportsPdfs) {
      threadMessages = threadMessages.filter(
        (msg) => (msg.content as ContentPart).type !== "file"
      );
    }

    const inferenceMessages = await Promise.all(
      threadMessages.map(async (msg) => ({
        role: msg.role,
        content: await (async (content: ContentPart) => {
          if (content.type === "text") {
            return [
              {
                type: content.type,
                text: content.text,
              },
            ];
          } else {
            const metadata = s3.file(content.file_metadata.file_key);
            const data = await metadata.arrayBuffer();
            const buffer = Buffer.from(new Uint8Array(data));
            const base64 = `data:${
              content.file_metadata.mime_type
            };base64,${buffer.toString("base64")}`;

            return [
              {
                type: content.type,
                mimeType: content.file_metadata.mime_type,
                [content.type === "image" ? "image" : "data"]: base64,
              },
            ];
          }
        })(msg.content as ContentPart),
      }))
    );

    const onToolEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    const textStream = await runInference(
      {
        model: modelToRun.model,
        messages: inferenceMessages as CoreMessage[],
        maxTokens,
        temperature,
        system: instructions,
      },
      onToolEvent,
      modelToRun.supportsStreaming
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

    await db.insert(messages).values({
      userId: req.userId!,
      id: crypto.randomUUID(),
      threadId: threadId,
      role: "assistant",
      content: JSON.stringify({ type: "text", text: aiResponse }),
      createdAt: new Date(),
      model: model,
      provider: modelToRun.provider,
    });

    res.write("event: done\ndata: true\n\n");
    res.end();
  } catch (error) {
    console.log("Error", error);
    res.status(500).send(error);
  }
});

export default router;
