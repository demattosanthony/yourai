import { threads, messages, ContentPart, FileContent } from "./config/schema";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import db from "./config/db";
import s3 from "./config/s3";

const LIMIT = 10;

// Database Queries
async function getThread(threadId: string) {
  return db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      messages: {
        orderBy: messages.createdAt,
      },
    },
  });
}

async function createThread(userId: string) {
  const threadId = crypto.randomUUID();
  const now = new Date();
  await db.insert(threads).values({
    id: threadId,
    userId,
    createdAt: now,
    updatedAt: now,
  });
  return { id: threadId };
}

async function createMessage(
  userId: string,
  threadId: string,
  role: string,
  content: ContentPart[]
) {
  for (const item of content) {
    const messageId = crypto.randomUUID();
    await db.insert(messages).values({
      userId,
      id: messageId,
      threadId: threadId,
      role: role as "system" | "user" | "assistant" | "tool", // Type assertion for role
      content: item,
      createdAt: new Date(),
    });
  }
  return { message: "Messages created successfully" };
}

async function getThreads(userId: string, page: number, search: string) {
  const offset = (page - 1) * LIMIT;
  const limit = 10;
  let query;
  try {
    query = db
      .select({
        id: threads.id,
        created_at: threads.createdAt,
        updated_at: threads.updatedAt,
      })
      .from(threads)
      .leftJoin(messages, eq(threads.id, messages.threadId))
      .where(
        search && search.length > 0
          ? and(
              eq(threads.userId, userId),
              sql`json_extract(${messages.content}, '$.text') LIKE ${
                "%" + search + "%"
              }`
            )
          : eq(threads.userId, userId)
      )
      .orderBy(desc(threads.createdAt));

    // Get distinct threads that match search
    const matchingThreads = await query
      .groupBy(threads.id, threads.createdAt, threads.updatedAt)
      .limit(limit)
      .offset(offset);

    // Rest of the code remains the same...
    const threadIds = matchingThreads.map((t) => t.id);

    let completeThreads = await db.query.threads.findMany({
      where: inArray(threads.id, threadIds),
      orderBy: [desc(threads.createdAt)],
      with: {
        messages: {
          orderBy: messages.createdAt,
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

    return completeThreads;
  } catch (error) {
    console.error("Error fetching threads", error);
    return [];
  }
}

export { getThread, createThread, createMessage, getThreads };
