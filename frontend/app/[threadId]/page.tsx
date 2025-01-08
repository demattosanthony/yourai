"use client";

import ChatInputForm from "@/components/chat/ChatInputForm";
import ChatMessagesList from "@/components/chat/MessagesList";
import useChat, { isNewThreadAtom, MessageRole } from "@/hooks/useChat";
import api from "@/lib/api";
import { useAtom } from "jotai";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function ChatPage() {
  const params = useParams<{ threadId: string }>();
  const { threadId } = params;
  const { handleSubmit, handleAbort, setMessages, input } = useChat();
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
            handleSubmit(threadId, [
              {
                type: "text",
                text: input,
              },
            ]);
          }}
          onAbort={handleAbort}
        />
      </div>
    </>
  );
}
