import { threads, messages, ContentPart, FileContent } from "./config/schema";
import { desc, eq, inArray, sql } from "drizzle-orm";
import db from "./config/db";
import s3 from "./config/s3";

const LIMIT = 10;

// Database Queries
async function getThread(threadId: string) {
  return db.query.threads.findFirst({
    where: eq(threads.id, threadId),
    with: {
      messages: {
        orderBy: messages.created_at,
      },
    },
  });
}

async function createThread() {
  const threadId = crypto.randomUUID();
  const now = new Date();
  await db.insert(threads).values({
    id: threadId,
    created_at: now,
    updated_at: now,
  });
  return { id: threadId };
}

async function createMessage(
  threadId: string,
  role: string,
  content: ContentPart[]
) {
  for (const item of content) {
    const messageId = crypto.randomUUID();
    await db.insert(messages).values({
      id: messageId,
      thread_id: threadId,
      role,
      content: item,
      created_at: new Date(),
    });
  }
  return { message: "Messages created successfully" };
}

async function getThreads(page: number, search: string) {
  const offset = (page - 1) * LIMIT;
  const limit = 10;
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

    return completeThreads;
  } catch (error) {
    console.error("Error fetching threads", error);
    return [];
  }
}

export { getThread, createThread, createMessage, getThreads };
