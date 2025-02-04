"use server";

import { getThread } from "@/app/actions";
import ChatThread from "@/components/chat/ChatThread";

export default async function ThreadsPage({
  params,
  searchParams,
}: {
  params: Promise<{ threadId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const isNew = (await searchParams).new === "true";
  const threadId = (await params).threadId;

  const initalMessages = isNew
    ? []
    : (await getThread(threadId)).messages.map((message) => ({
        content: message.content?.text || "",
        role: message.role as "user" | "assistant",
        id: message.id,
        createdAt: message.createdAt ? new Date(message.createdAt) : undefined,
        reasoning: message.reasoning,
        experimental_attachments:
          message.content?.type === "image" || message.content?.type === "file"
            ? [
                {
                  name: message.content.file_metadata?.filename,
                  url: message.content?.data || "",
                  file_key: message.content.file_metadata?.file_key,
                  contentType: message.content.file_metadata?.mime_type,
                },
              ]
            : [],
      })) ?? [];

  return <ChatThread initalMessages={initalMessages} />;
}
