"use client";

import { isNewThreadAtom, messagesAtom } from "@/atoms/chat";
import ChatInputForm from "@/components/chat/ChatInputForm";
import ChatMessagesList from "@/components/chat/MessagesList";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import api from "@/lib/api";
import { MessageRole } from "@/types/chat";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const params = useParams<{ threadId: string }>();
  const { threadId } = params;
  const { sendMessage } = useMessageHandler();
  const [, setMessages] = useAtom(messagesAtom);
  const [isNewThread, setIsNewThread] = useAtom(isNewThreadAtom);

  async function loadMessages() {
    try {
      const thread = await api.getThread(threadId);
      const messages = thread.messages.map((message) => ({
        role: message.role as MessageRole,
        content: JSON.parse(message.content),
      }));
      setMessages(messages);
    } catch (error) {
      console.error("Failed to load messages:", error);
    }
  }

  useEffect(() => {
    if (!isNewThread) {
      loadMessages();
    }

    return () => {
      setIsNewThread(false);
      setMessages([]);
    };
  }, [threadId, isNewThread]);

  return (
    <>
      <ChatMessagesList />

      <div className="w-full flex items-center justify-center mx-auto p-1 pb-2">
        <ChatInputForm
          onSubmit={() => {
            sendMessage(threadId);
          }}
        />
      </div>
    </>
  );
}
