"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAtom } from "jotai";
import { messagesAtom } from "@/atoms/chat";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";

export default function HeaderActions({
  children,
}: {
  children: React.ReactNode;
}) {
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
    <div className="flex">
      <div>{children}</div>

      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => {
          setMessages([]);
          router.push("/");
        }}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}
