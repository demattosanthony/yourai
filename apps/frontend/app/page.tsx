"use client";

import ChatInputForm from "@/components/chat/ChatInputForm";
import ChatMessagesList from "@/components/chat/MessagesList";
import Header from "@/components/Header";
import useChat from "@/hooks/useChat";

export default function Home() {
  const { generatingResponse, input, setInput, handleAbort, handleSubmit } =
    useChat();

  return (
    <div className="h-screen w-screen flex flex-col">
      <Header />

      <ChatMessagesList />

      <div className="w-full flex items-center justify-center mx-auto p-4">
        <ChatInputForm
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          onAbort={handleAbort}
          generating={generatingResponse}
        />
      </div>
    </div>
  );
}
