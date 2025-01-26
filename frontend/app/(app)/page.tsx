"use client";

import ChatInputForm from "@/components/chat/ChatInputForm";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAtom } from "jotai";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { isNewThreadAtom } from "@/atoms/chat";
import AIOrbScene from "@/components/AiOrbScene";
import InstallPrompt from "@/components/InstallPrompt";
import { useMeQuery } from "@/queries/queries";
import { toast } from "sonner";
import { AnimatedGreeting } from "@/components/AnimatedGreeting";
import {
  PricingDialog,
  pricingPlanDialogOpenAtom,
} from "@/components/PricingDialog";

export default function Home() {
  const { sendMessage } = useMessageHandler();
  const router = useRouter();
  const [, setIsNewThread] = useAtom(isNewThreadAtom);
  const [, showPricingDialog] = useAtom(pricingPlanDialogOpenAtom);

  const { data } = useMeQuery();
  const user = data?.user;

  const handleSubmit = async () => {
    if (!user) {
      toast.error("You must be logged in to create a thread.", {
        action: {
          label: "Close",
          onClick: () => {},
        },
      });
      return;
    }

    setIsNewThread(true);

    try {
      // Create thread in background
      const { id: threadId } = await api.createThread();
      // Replace URL without adding to history
      router.replace(`/threads/${threadId}`);
      sendMessage(threadId);
    } catch (error: unknown) {
      if (error instanceof Error && error.message === "subscription_required") {
        showPricingDialog(true);
        toast.error("Pro plan required to create a new thread.");
      } else {
        toast.error("Failed to create thread. Please try again.", {
          action: {
            label: "Retry",
            onClick: () => handleSubmit(),
          },
        });
      }
      setIsNewThread(false);
    }
  };

  return (
    <>
      <InstallPrompt />

      {user && user?.subscriptionStatus !== "active" && <PricingDialog />}

      <div className="w-full flex flex-1 items-center justify-center">
        <div className="flex flex-col h-[60%] items-center w-full">
          <div className="mb-6 w-[400px] flex items-center justify-center">
            <AIOrbScene />
          </div>

          <div>
            <AnimatedGreeting name={user?.name.split(" ")[0] ?? ""} />
          </div>
        </div>
      </div>

      <div className="w-full flex items-center justify-center mx-auto p-6 pb-8 md:pb-4 md:p-2 absolute bottom-0 left-0 right-0">
        <ChatInputForm onSubmit={handleSubmit} />
      </div>
    </>
  );
}
