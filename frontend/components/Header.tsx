"use client";

import ModelSelector from "./ModelSelector";
import { useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useAtom } from "jotai";
import { messagesAtom } from "@/atoms/chat";
import { SidebarTrigger } from "./ui/sidebar";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

export default function Header() {
  const router = useRouter();
  const [, setMessages] = useAtom(messagesAtom);
  const isMobile = useIsMobile();

  // Add useEffect for keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "h") {
        e.preventDefault();
        router.push("/threads");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "m") {
        e.preventDefault();
        setMessages([]);
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="w-full p-4 h-14 items-center justify-center flex absolute top-0 left-0 right-0 z-10 bg-background md:backdrop-blur-xl md:bg-background/50 transition-all ml-2">
      {isMobile && (
        <div className="absolute left-2">
          <SidebarTrigger />
        </div>
      )}

      <div className="absolute right-6 md:left-4 md:right-none bg-opacity-50 z-10">
        <div className="flex items-center ">
          <Suspense>
            <ModelSelector />
          </Suspense>

          <Button
            variant={"ghost"}
            onClick={() => {
              setMessages([]);
              router.push("/");
            }}
            size={"icon"}
            className="rounded-full md:hidden"
          >
            <Plus size={16} className="min-h-4 min-w-4" />
          </Button>

          {/* <ProfileMenu /> */}
        </div>
      </div>
    </div>
  );
}
