"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import useDebounce from "@/hooks/useDebounce";
import api from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function HistoryPage() {
  const [search, setSearch] = useState("");
  const [threads, setThreads] = useState<
    {
      id: string;
      created_at: number;
      updated_at: number;
      messages: {
        id: string;
        thread_id: string;
        role: string;
        content: {
          type: "text" | "image" | "file";
          text?: string;
          image?: string;
        };
        created_at: number;
      }[];
    }[]
  >([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const debouncedSearch = useDebounce(search, 300);

  // Reset page when search changes
  useEffect(() => {
    setThreads([]);
    setPage(1);
    setHasMore(true);
    loadMoreThreads(1, debouncedSearch);
  }, [debouncedSearch]);

  async function loadMoreThreads(pageNum = page, searchTerm = debouncedSearch) {
    if (loading || (!hasMore && pageNum !== 1)) return;

    setLoading(true);
    try {
      const newThreads = await api.getThreads(pageNum, searchTerm);
      setHasMore(newThreads.length === 10);

      if (pageNum === 1) {
        setThreads(
          newThreads.map((thread) => ({
            ...thread,
            messages: thread.messages.map((message) => ({
              ...message,
              content: message.content,
            })),
          }))
        );
      } else {
        setThreads((prev) => [
          ...prev,
          ...newThreads.map((thread) => ({
            ...thread,
            messages: thread.messages.map((message) => ({
              ...message,
              content: message.content,
            })),
          })),
        ]);
      }
      setPage(pageNum === 1 ? 2 : (prev) => prev + 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    loadMoreThreads();
  }, []);

  return (
    <div className="flex-1 w-full h-full relative">
      <div className="absolute inset-0">
        <div className="max-w-2xl mx-auto p-4 pt-14">
          <h1 className="text-2xl font-bold mb-4">Chat History</h1>
          <Input
            type="search"
            placeholder="Search..."
            className="w-full p-2 border mb-4"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ScrollArea
            className="max-h-[calc(100vh-175px)] overflow-y-auto"
            onScrollCapture={(e) => {
              const target = e.currentTarget;
              if (
                target.scrollHeight - target.scrollTop <=
                target.clientHeight + 100
              ) {
                loadMoreThreads();
              }
            }}
          >
            {threads.map((thread, i) => {
              const lastMessage = thread.messages[thread.messages.length - 1];
              if (!lastMessage) return null;

              const type = lastMessage.content.type;
              const content = lastMessage.content.text;

              return (
                <Link key={i} href={`/${thread.id}`} prefetch>
                  <Card key={i} className="mb-4 cursor-pointer hover:bg-accent">
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
                          {lastMessage.role === "user"
                            ? "User"
                            : "AI Assistant"}
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
                </Link>
              );
            })}

            {loading && (
              <>
                <Skeleton className="h-[120px] mb-4 bg-accent" />
                <Skeleton className="h-[120px] mb-4 bg-accent" />
                <Skeleton className="h-[120px] bg-accent" />
              </>
            )}
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
