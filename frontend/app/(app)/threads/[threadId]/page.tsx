"use server";

import { getThread } from "@/app/actions";
import ChatThread from "@/components/chat/ChatThread";
import { MessageRole } from "@/types/chat";

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
        role: message.role as MessageRole,
        content: message.content,
        createdAt: message.createdAt,
        provider: message.provider,
        model: message.model,
        id: message.id,
        reasoning: message.reasoning,
      }));

  return <ChatThread initalMessages={initalMessages} />;
}
