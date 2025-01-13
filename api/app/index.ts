import Express from "express";
import cors from "cors";
import path from "path";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { desc, eq, inArray, sql } from "drizzle-orm";

import db from "./config/db";
import { MODELS } from "./models";
import { threads, messages, ContentPart, FileContent } from "./config/schema";
import { runInference } from "./inference";
import s3 from "./config/s3";
import { CoreMessage } from "ai";

const PORT = process.env.PORT || 4000;

async function main() {
  try {
    migrate(db, {
      migrationsFolder: path.join(__dirname, "../drizzle"),
    });
  } catch (error) {
    console.error("Error occurred during database migration", error);
    process.exit(1);
  }

  const app = Express();
  app.use(Express.json({ limit: "50mb" }));
  app.use(cors());

  app.post("/presigned-url", async (req, res) => {
    try {
      const { filename, mime_type, size } = req.body;
      const file_key = `uploads/${Date.now()}-${filename}`;
      const url = s3.presign(file_key, {
        expiresIn: 3600, // 1 hour
        type: mime_type,
        method: "PUT",
      });
      const viewUrl = s3.file(file_key).presign({
        expiresIn: 3600,
        method: "GET",
      });

      res.json({
        url,
        viewUrl,
        file_metadata: {
          filename,
          mime_type,
          file_key,
          size,
        },
      });
    } catch (error) {
      console.error("Error creating presigned URL:", error);
      res.status(500).json({ error: "Failed to create presigned URL" });
    }
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
    const page = parseInt(req.query.page as string) || 1;
    const search = (req.query.search as string)?.trim() || "";
    const limit = 10;
    const offset = (page - 1) * limit;
    let query;
    try {
      // Modified query to select only the necessary columns for grouping
      query = db
        .select({
          id: threads.id,
          created_at: threads.created_at,
          updated_at: threads.updated_at,
        })
        .from(threads)
        .leftJoin(messages, eq(threads.id, messages.thread_id))
        .orderBy(desc(threads.created_at));

      if (search && search.length > 0) {
        query = query.where(
          sql`json_extract(${messages.content}, '$.text') LIKE ${
            "%" + search + "%"
          }`
        );
      }

      // Get distinct threads that match search
      const matchingThreads = await query
        .groupBy(threads.id, threads.created_at, threads.updated_at)
        .limit(limit)
        .offset(offset);

      // Rest of the code remains the same...
      const threadIds = matchingThreads.map((t) => t.id);

      let completeThreads = await db.query.threads.findMany({
        where: inArray(threads.id, threadIds),
        orderBy: [desc(threads.created_at)],
        with: {
          messages: {
            orderBy: messages.created_at,
          },
        },
      });

      // For the file content, we need to generate a temporary URL
      for (const thread of completeThreads) {
        for (const message of thread.messages) {
          try {
            const content = message.content as { type: string };

            if (content.type === "file" || content.type === "image") {
              const fileContent = message.content as FileContent;
              if (!fileContent?.file_metadata?.file_key) {
                console.warn(
                  "Skipping message - missing file metadata:",
                  message.id
                );
                continue;
              }

              const metadata = s3.file(fileContent.file_metadata.file_key);
              const url = metadata.presign({
                acl: "public-read",
                expiresIn: 3600,
              });
              fileContent.data = url;
            }
          } catch (error) {
            console.error("Error processing message:", message.id, error);
            // Continue with other messages even if one fails
            continue;
          }
        }
      }

      res.json(completeThreads);
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
      for (const message of thread.messages) {
        try {
          const content = message.content as { type: string };

          if (content.type === "file" || content.type === "image") {
            const fileContent = message.content as FileContent;
            if (!fileContent?.file_metadata?.file_key) {
              console.warn(
                "Skipping message - missing file metadata:",
                message.id
              );
              continue;
            }

            const metadata = s3.file(fileContent.file_metadata.file_key);
            const url = metadata.presign({
              acl: "public-read",
              expiresIn: 3600,
            });
            fileContent.data = url;
          }
        } catch (error) {
          console.error("Error processing message:", message.id, error);
          // Continue with other messages even if one fails
          continue;
        }
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
        return;
      }

      // Validate thread exists
      const thread = await db.query.threads.findFirst({
        where: eq(threads.id, threadId),
      });

      if (!thread) {
        res.status(404).json({ error: "Thread not found" });
        return;
      }

      // Create a message for each content item
      for (const item of content) {
        const messageId = crypto.randomUUID();

        await db.insert(messages).values({
          id: messageId,
          thread_id: threadId,
          role,
          content: item,
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

    // Format messages for inference
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
            // Generate temporary URL for file
            const metadata = s3.file(content.file_metadata.file_key);
            // const url = metadata.presign({
            //   acl: "public-read",
            //   expiresIn: 3600,
            // });
            // Convert to base64 content
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

    try {
      const textStream = await runInference(
        {
          model,
          messages: inferenceMessages as CoreMessage[],
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
