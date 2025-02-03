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
import Link from "next/link";
import { useMeQuery } from "@/queries/queries";

export default function Header() {
  const router = useRouter();
  const [, setMessages] = useAtom(messagesAtom);
  const isMobile = useIsMobile();
  const { data: user, isFetched } = useMeQuery();

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
    <header className="absolute inset-x-0 top-0 z-0 flex h-14 items-center bg-background/50 px-4 backdrop-blur-xl transition-all">
      <div className="flex w-full items-center justify-between">
        <div className="flex items-center gap-2">
          {isMobile && <SidebarTrigger />}

          <div className="hidden md:flex items-center">
            <Suspense>
              <ModelSelector />
            </Suspense>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex md:hidden items-center">
            <Suspense>
              <ModelSelector />
            </Suspense>

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

          {!user && isFetched && (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <Button>Login</Button>
              </Link>
              <Link href="/login">
                <Button variant="secondary">Sign up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
