"use client";

import ModelSelector from "./ModelSelector";
import { Button } from "./ui/button";
import { History, Plus } from "lucide-react";
import ChatSettings from "./ChatSettings";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { messagesAtom } from "@/atoms/chat";
import Link from "next/link";
import LoginButton from "./LoginButton";
import { ModeToggle } from "./DarkModeToggle";

export default function Header() {
  const router = useRouter();
  const [, setMessages] = useAtom(messagesAtom);

  // Add useEffect for keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.metaKey && e.key === "h") {
        e.preventDefault();
        router.push("/history");
      } else if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        setMessages([]);
        router.push("/");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return (
    <div className="w-full p-4 h-14 items-center justify-center flex absolute top-0 left-0 right-0 z-10 bg-background md:backdrop-blur-xl md:bg-background/50 transition-all">
      <div className="absolute right-4 md:right-8 bg-opacity-50 z-10">
        <div className="flex items-center ">
          <ModelSelector />

          <Link href="/history" prefetch>
            <Button variant={"ghost"} className="rounded-full" size={"icon"}>
              <History size={16} className="min-h-4 min-w-4" />
            </Button>
          </Link>

          <ChatSettings />

          <Button
            variant={"ghost"}
            onClick={() => {
              setMessages([]);
              router.push("/");
            }}
            size={"icon"}
            className="rounded-full"
          >
            <Plus size={16} className="min-h-4 min-w-4" />
          </Button>

          <ModeToggle />

          <LoginButton />
        </div>
      </div>
    </div>
  );
}
