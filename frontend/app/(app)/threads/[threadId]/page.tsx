"use client";

import { messagesAtom } from "@/atoms/chat";
import ChatInputForm from "@/components/chat/ChatInputForm";
import ChatMessagesList from "@/components/chat/MessagesList";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import api from "@/lib/api";
import { MessageRole } from "@/types/chat";
import { useAtom } from "jotai";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ThreadPage() {
  const router = useRouter();
  const params = useParams<{ threadId: string }>();
  const { threadId } = params;
  const { sendMessage } = useMessageHandler();
  const [, setMessages] = useAtom(messagesAtom);
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  // Handle message sending
  const handleSubmit = async () => {
    await sendMessage(threadId);
  };

  // Load and format thread messages
  async function loadThreadMessages() {
    try {
      const thread = await api.getThread(threadId);
      const formattedMessages = thread.messages.map((message) => ({
        role: message.role as MessageRole,
        content: message.content,
        createdAt: message.createdAt,
        provider: message.provider,
        model: message.model,
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error("Failed to load thread messages:", error);
    }
  }
  useEffect(() => {
    if (isNew) {
      // Don't update messages if this is a new thread
      router.replace(`/threads/${threadId}`);
      return;
    }

    loadThreadMessages();
  }, []);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setMessages([]);
    };
  }, [threadId, setMessages]);

  return (
    <>
      <ChatMessagesList />

      <div className="w-full flex items-center justify-center mx-auto px-6 pb-8 md:pb-4 md:p-2">
        <ChatInputForm onSubmit={handleSubmit} />
      </div>
    </>
  );
}
