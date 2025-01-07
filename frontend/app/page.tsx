"use client";

import ChatInputForm from "@/components/chat/ChatInputForm";
import ChatMessagesList from "@/components/chat/MessagesList";
import Header from "@/components/Header";
import useChat from "@/hooks/useChat";

export default function Home() {
  const { handleSubmit, handleAbort } = useChat();

  return (
    <div className="h-screen w-screen flex flex-col">
      <Header />

      <ChatMessagesList />

      <div className="w-full flex items-center justify-center mx-auto p-1 pb-2">
        <ChatInputForm onSubmit={handleSubmit} onAbort={handleAbort} />
      </div>
    </div>
  );
}
