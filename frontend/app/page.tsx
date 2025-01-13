"use client";

import ChatInputForm from "@/components/chat/ChatInputForm";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { isNewThreadAtom } from "@/atoms/chat";
import AIOrbScene from "@/components/AiOrbScene";
import InstallPrompt from "@/components/InstallPrompt";

export default function Home() {
  const { sendMessage } = useMessageHandler();
  const router = useRouter();
  const [, setIsNewThread] = useAtom(isNewThreadAtom);

  return (
    <>
      <InstallPrompt />
      <div className="h-[90%] w-full flex items-center justify-center">
        <AIOrbScene />
      </div>

      <div className="w-full flex items-center justify-center mx-auto p-6 pb-8 md:pb-4 md:p-2 absolute bottom-0 left-0 right-0">
        <ChatInputForm
          onSubmit={async () => {
            try {
              // Create a new thread and navigate to it
              const { id: threadId } = await api.createThread();
              setIsNewThread(true);
              router.push(`/${threadId}`);

              sendMessage(threadId);
            } catch (error) {
              console.error("Error creating thread:", error);
            }
          }}
        />
      </div>
    </>
  );
}
