"use client";

import api from "@/lib/api";

// Hooks
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { useAtom } from "jotai";
import { useMeQuery } from "@/queries/queries";
import { useRouter } from "next/navigation";
import { useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";

// Components
import AIOrbScene from "@/components/AiOrbScene";
import ConversationStarters from "@/components/ConversationStarters";
import {
  PricingDialog,
  pricingPlanDialogOpenAtom,
} from "@/components/PricingDialog";
import { AnimatedGreeting } from "@/components/AnimatedGreeting";
import InstallPrompt from "@/components/InstallPrompt";
import { toast } from "sonner";
import ChatInputForm, {
  ChatInputFormRef,
} from "@/components/chat/ChatInputForm";

export default function Home() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { sendMessage } = useMessageHandler();
  const [showPricingDialog, setShowPricingDialog] = useAtom(
    pricingPlanDialogOpenAtom
  );

  const { data: user } = useMeQuery();

  const chatInputRef = useRef<ChatInputFormRef>(null);

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
      router.prefetch(`/threads/new?threadId=${threadId}?new=true`);
      router.push(`/threads/${threadId}?new=true`);
      await sendMessage(threadId);
      queryClient.invalidateQueries({ queryKey: ["threads"] }); // Needed so the app sidebar shows the new thread
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
        <div className="flex flex-col h-[70%] md:h-[65%] items-center w-full ">
          <div className="mb-6 w-[400px] flex items-center justify-center">
            <AIOrbScene />
          </div>

          <div className="flex flex-col gap-8">
            <AnimatedGreeting name={user?.name.split(" ")[0] ?? ""} />

            <ConversationStarters
              triggerFileInput={() => chatInputRef.current?.triggerFileInput()}
              triggerTextAreaFocus={() => chatInputRef.current?.focusTextArea()}
            />
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-center mx-auto p-6 pb-8 md:pb-4 md:p-2 absolute bottom-0 left-0 right-0">
        <ChatInputForm ref={chatInputRef} onSubmit={handleSubmit} />
      </div>
    </>
  );
}
