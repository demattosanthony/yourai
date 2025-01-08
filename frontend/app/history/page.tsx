"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const router = useRouter();
  const [threads, setThreads] = useState<
    {
      id: string;
      created_at: number;
      updated_at: number;
      messages: {
        id: string;
        thread_id: string;
        role: string;
        content: { type: "text" | "image"; text?: string; image?: string };
        created_at: number;
      }[];
    }[]
  >([]);

  async function loadThreads() {
    const threads = await api.getThreads();
    setThreads(
      threads.map((thread) => ({
        ...thread,
        messages: thread.messages.map((message) => ({
          ...message,
          content: JSON.parse(message.content),
        })),
      }))
    );
  }

  useEffect(() => {
    loadThreads();
  }, []);

  return (
    <div className="flex-1 w-full h-full relative">
      <div className="absolute inset-0 overflow-y-auto">
        <div className="max-w-2xl mx-auto p-4 pt-20">
          <h1 className="text-2xl font-bold mb-4">Chat History</h1>
          {threads.map((thread) => {
            const lastMessage = thread.messages[thread.messages.length - 1];
            if (!lastMessage) return null;

            const type = lastMessage.content.type;
            const content = lastMessage.content.text;

            return (
              <Card
                key={thread.id}
                className="mb-4 cursor-pointer hover:bg-accent"
                onClick={() => router.push(`/${thread.id}`)}
              >
                <CardHeader className="flex flex-row items-center space-x-4 pb-2">
                  <Avatar>
                    <AvatarImage
                      src={
                        lastMessage.role === "user"
                          ? "/user-avatar.png"
                          : "/ai-avatar.png"
                      }
                    />
                    <AvatarFallback>
                      {lastMessage.role === "user" ? "U" : "AI"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {lastMessage.role === "user" ? "User" : "AI Assistant"}
                    </CardTitle>
                    <p className="text-xs text-gray-500">
                      {new Date(lastMessage.created_at).toLocaleString(
                        undefined,
                        {
                          year: "numeric",
                          month: "numeric",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                          hour12: true,
                        }
                      )}
                    </p>
                  </div>
                </CardHeader>
                <CardContent>
                  {type === "text" && content && (
                    <p className="text-sm">
                      {content.length > 100
                        ? `${content.substring(0, 100)}...`
                        : content}
                    </p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
