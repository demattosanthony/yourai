"use client";

import { messagesAtom } from "@/atoms/chat";
import ChatInputForm from "@/components/chat/ChatInputForm";
import ChatMessagesList from "@/components/chat/MessagesList";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { useThreadQuery } from "@/queries/queries";
import { MessageRole } from "@/types/chat";
import { useQueryClient } from "@tanstack/react-query";
import { useAtom } from "jotai";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export default function ThreadPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const params = useParams<{ threadId: string }>();
  const { threadId } = params;
  const { sendMessage } = useMessageHandler();
  const [, setMessages] = useAtom(messagesAtom);
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "true";

  const { data: thread, isError } = useThreadQuery(threadId, isNew);

  // Update messages atom when thread data changes
  useEffect(() => {
    if (thread) {
      const formattedMessages = thread.messages.map((message) => ({
        role: message.role as MessageRole,
        content: message.content,
        createdAt: message.createdAt,
        provider: message.provider,
        model: message.model,
      }));
      setMessages(formattedMessages);
    }
  }, [thread, setMessages]);

  // Cleanup effect
  useEffect(() => {
    return () => {
      setMessages([]);
    };
  }, [threadId, setMessages]);

  // Handle message sending
  const handleSubmit = async () => {
    // Remove the new query param
    router.replace(`/threads/${threadId}`);

    await sendMessage(threadId);
    // Invalidate the thread query to trigger a refetch
    queryClient.invalidateQueries({ queryKey: ["thread", threadId] });
  };

  if (isError) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-500">Error loading messages</p>
      </div>
    );
  }

  return (
    <>
      <ChatMessagesList />

      <div className="w-full flex items-center justify-center mx-auto px-6 pb-8 md:pb-4 md:p-2">
        <ChatInputForm onSubmit={handleSubmit} />
      </div>
    </>
  );
}
