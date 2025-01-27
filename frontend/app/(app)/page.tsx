"use client";

import ChatInputForm from "@/components/chat/ChatInputForm";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import AIOrbScene from "@/components/AiOrbScene";
import InstallPrompt from "@/components/InstallPrompt";
import { useMeQuery } from "@/queries/queries";
import { toast } from "sonner";
import { AnimatedGreeting } from "@/components/AnimatedGreeting";
import {
  PricingDialog,
  pricingPlanDialogOpenAtom,
} from "@/components/PricingDialog";
import { useRef } from "react";
import ConversationStarters from "@/components/ConversationStarters";

export default function Home() {
  const { sendMessage } = useMessageHandler();
  const router = useRouter();
  const [showPricingDialog, setShowPricingDialog] = useAtom(
    pricingPlanDialogOpenAtom
  );

  // Putting these here so the conversation starters can trigger chat input form
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const { data: user } = useMeQuery();

  const handleSubmit = async () => {
    // Require login
    if (!user) {
      toast.error("You must be logged in to create a thread.", {
        action: {
          label: "Close",
          onClick: () => {},
        },
      });
      return;
    }

    try {
      // Create thread in background
      const { id: threadId } = await api.createThread();
      router.prefetch(`/threads/${threadId}`);
      // Replace URL without adding to history
      router.replace(`/threads/${threadId}?new=true`);
      sendMessage(threadId);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "subscription_required") {
        setShowPricingDialog(true);
        toast.error("Pro plan required to create a new thread.");
      } else {
        toast.error("Failed to create thread. Please try again.", {
          action: {
            label: "Retry",
            onClick: () => handleSubmit(),
          },
        });
      }
    }
  };

  return (
    <>
      <InstallPrompt />

      {user && user?.subscriptionStatus !== "active" && showPricingDialog && (
        <PricingDialog />
      )}

      <div className="w-full flex flex-1 items-center justify-center">
        <div className="flex flex-col h-[60%] items-center w-full ">
          <div className="mb-6 w-[400px] flex items-center justify-center">
            <AIOrbScene />
          </div>

          <div className="flex flex-col gap-6">
            <AnimatedGreeting name={user?.name.split(" ")[0] ?? ""} />

            <ConversationStarters
              fileInputRef={fileInputRef}
              textAreaRef={textAreaRef}
            />
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-center mx-auto p-6 pb-8 md:pb-4 md:p-2 absolute bottom-0 left-0 right-0">
        <ChatInputForm
          onSubmit={handleSubmit}
          fileInputRef={fileInputRef}
          textAreaRef={textAreaRef}
        />
      </div>
    </>
  );
}
