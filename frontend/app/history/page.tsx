"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import useDebounce from "@/hooks/useDebounce";
import { useThreadsQuery } from "@/queries/queries";
import Link from "next/link";
import { useState } from "react";

export default function HistoryPage() {
  const [search, setSearch] = useState("");

  const debouncedSearch = useDebounce(search, 300);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    refetch,
  } = useThreadsQuery(debouncedSearch);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (
      target.scrollHeight - target.scrollTop <= target.clientHeight + 100 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  };

  const allThreads = data?.pages.flatMap((page) => page.threads) ?? [];

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
            onScrollCapture={handleScroll}
          >
            {allThreads.map((thread, i) => {
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

            {(isLoading || isFetchingNextPage) && (
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
