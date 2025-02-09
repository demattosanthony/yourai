"use client";

import ChatThread from "@/components/chat/ChatThread";
import { useWorkspace } from "@/components/workspace-context";
import api from "@/lib/api";
import { Message } from "ai/react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function ThreadsPage() {
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const searchParams = useSearchParams();
  const params = useParams<{ threadId: string }>();
  const isNew = searchParams.get("new") === "true";
  const threadId = params.threadId;

  const { activeWorkspace } = useWorkspace();

  useEffect(() => {
    async function loadMessages() {
      if (!isNew) {
        const thread = await api.getThread(
          threadId,
          activeWorkspace?.type === "organization"
            ? activeWorkspace.id
            : undefined
        );
        const messages =
          thread?.messages.map((message) => ({
            content: message.content?.text || "",
            role: message.role as "user" | "assistant",
            id: message.id,
            createdAt: message.createdAt
              ? new Date(message.createdAt)
              : undefined,
            reasoning: message.reasoning,
            experimental_attachments:
              message.content?.type === "image" ||
              message.content?.type === "file"
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
        setInitialMessages(messages);
      }
    }
    loadMessages();
  }, [isNew, threadId]);

  return <ChatThread initalMessages={initialMessages} />;
}
