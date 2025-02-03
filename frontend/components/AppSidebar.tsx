"use client";

import * as React from "react";
import { History, Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import { useMeQuery, useThreadsQuery } from "@/queries/queries";
import { Button } from "./ui/button";
import { Collapsible } from "./ui/collapsible";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { useParams, usePathname } from "next/navigation";
import AIOrbScene from "./AiOrbScene";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: user, isLoading, isFetched } = useMeQuery();
  const { state } = useSidebar();
  const isMobile = useIsMobile();
  const params = useParams();
  const pathname = usePathname();

  const currentThread = params?.threadId;
  const isThreadsPage = pathname === "/threads";

  const { data, isLoading: threadsLoading } = useThreadsQuery();
  // Take only the first page of results since that's all we need
  const threads = data?.pages[0]?.threads ?? [];

  return (
    <Sidebar collapsible={!user && isFetched ? "offcanvas" : "icon"} {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className="flex aspect-square size-8 items-center justify-center">
                <AIOrbScene width="24px" height="24px" isAnimating={false} />

                {/* <Image
                  src={"/yo-blob.png"}
                  width={24}
                  height={24}
                  alt="YourOrg"
                /> */}
              </div>
            </Link>

            {state === "expanded" && <SidebarTrigger />}
          </div>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                <Link href={"/"}>
                  <Button variant={"outline"} className="w-full">
                    {state === "collapsed" ? <Plus /> : "New Thread"}
                  </Button>
                </Link>

                <Link href={"/threads"} prefetch>
                  <Button
                    variant={"ghost"}
                    className={`w-full px-2 ${
                      state === "collapsed" ? "justify-center" : "justify-start"
                    }
                    ${isThreadsPage ? "bg-accent text-accent-foreground" : ""}
                    `}
                  >
                    {state === "collapsed" && !isMobile ? (
                      <History />
                    ) : (
                      <>
                        <History />
                        Threads
                      </>
                    )}
                  </Button>
                </Link>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {state === "expanded" && (
            <SidebarGroup key={"Recents"}>
              <SidebarGroupLabel>{"Recents"}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {threadsLoading ? (
                    <>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <SidebarMenuItem key={i}>
                          <SidebarMenuButton asChild>
                            <div className="h-6 w-full bg-muted animate-pulse rounded" />
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </>
                  ) : (
                    threads &&
                    threads?.map((thread) => {
                      if (!thread.title) return null;
                      return (
                        <SidebarMenuItem key={thread.id}>
                          <SidebarMenuButton
                            asChild
                            className={`${
                              currentThread === thread.id
                                ? "bg-accent text-accent-foreground"
                                : ""
                            }`}
                          >
                            <Link
                              href={`/threads/${thread.id}`}
                              className="text-ellipsis overflow-hidden whitespace-nowrap"
                            >
                              {thread.title.length > 28
                                ? thread.title.slice(0, 28) + "..."
                                : thread.title}
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })
                  )}

                  {user && (
                    <Link href={"/threads"}>
                      <Button
                        variant={"link"}
                        className="justify-start px-2"
                        size={"sm"}
                      >
                        View All
                      </Button>
                    </Link>
                  )}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}
        </Collapsible>
      </SidebarContent>

      <SidebarFooter>
        {state === "collapsed" && <SidebarTrigger className="w-full" />}

        {!user && state === "expanded" && !isLoading && (
          <SidebarMenu>
            <SidebarMenuItem>
              <Link href={"/login"}>
                <Button className="w-full">Login</Button>
              </Link>
            </SidebarMenuItem>
          </SidebarMenu>
        )}

        {user && <NavUser user={user} />}
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
