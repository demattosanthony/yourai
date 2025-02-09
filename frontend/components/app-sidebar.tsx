"use client";

import * as React from "react";
import { History, MoreHorizontal, Plus, Trash } from "lucide-react";
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
import { useDeleteThreadMutation, useThreadsQuery } from "@/queries/queries";
import { Button } from "./ui/button";
import { Collapsible } from "./ui/collapsible";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";
import { useParams, usePathname } from "next/navigation";
import { User } from "@/types/user";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./ui/alert-dialog";
import { WorkSpaceSwitcher } from "./workspace-switcher";

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & { user: User }) {
  const { state, toggleSidebar } = useSidebar();
  const isMobile = useIsMobile();
  const params = useParams();
  const pathname = usePathname();

  const currentThread = params?.threadId;
  const isThreadsPage = pathname === "/threads";

  const { data, isLoading: threadsLoading } = useThreadsQuery();
  const deleteThread = useDeleteThreadMutation();

  // Take only the first page of results since that's all we need
  const threads = data?.pages[0]?.threads ?? [];

  return (
    <Sidebar collapsible={"icon"} {...props}>
      <SidebarHeader>
        <SidebarMenu className="flex flex-row items-center group-data-[collapsible=icon]:justify-center justify-between">
          <WorkSpaceSwitcher />

          {state === "expanded" && <SidebarTrigger />}
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <Collapsible defaultOpen className="group/collapsible">
          <SidebarGroup>
            <SidebarGroupContent className="px-1.5 md:px-0">
              <SidebarMenu>
                <SidebarMenuItem>
                  <Link
                    href={"/"}
                    onMouseDown={() => isMobile && toggleSidebar()}
                  >
                    <Button
                      variant={"outline"}
                      className="w-full"
                      size={
                        state === "collapsed" && !isMobile ? "sm" : "default"
                      }
                    >
                      {state === "collapsed" && !isMobile ? (
                        <Plus />
                      ) : (
                        "New Thread"
                      )}
                    </Button>
                  </Link>
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <Link
                    href={"/threads"}
                    prefetch
                    onMouseDown={() => isMobile && toggleSidebar()}
                  >
                    <Button
                      variant={"ghost"}
                      className={`w-full px-2 ${
                        state === "collapsed" && !isMobile
                          ? "justify-center"
                          : "justify-start"
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
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {(state === "expanded" || isMobile) &&
            threads &&
            threads.length > 0 && (
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
                              className={`group/thread flex justify-between items-center ${
                                currentThread === thread.id
                                  ? "bg-accent text-accent-foreground"
                                  : ""
                              }`}
                            >
                              <div className="w-full flex justify-between items-center">
                                <Link
                                  href={`/threads/${thread.id}`}
                                  onMouseDown={() =>
                                    isMobile && toggleSidebar()
                                  }
                                  className="text-ellipsis overflow-hidden whitespace-nowrap flex-1"
                                >
                                  {thread.title.length > 28
                                    ? thread.title.slice(0, 28) + "..."
                                    : thread.title}
                                </Link>

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      className="h-8 w-8 p-0 opacity-0 group-hover/thread:opacity-100 border-none ring-0 focus-visible:ring-0 focus:ring-0 text-muted-foreground"
                                      onClick={(e) => e.preventDefault()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" side="right">
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <DropdownMenuItem
                                          className="text-destructive"
                                          onSelect={(e) => e.preventDefault()}
                                        >
                                          <Trash className="h-2 w-2" />
                                          Delete
                                        </DropdownMenuItem>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>
                                            Delete Thread
                                          </AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Are you sure you want to delete this
                                            thread and all its messages? This
                                            action cannot be undone.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>
                                            Cancel
                                          </AlertDialogCancel>
                                          <AlertDialogAction
                                            onClick={() =>
                                              deleteThread.mutate(thread.id)
                                            }
                                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                          >
                                            Delete
                                          </AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })
                    )}

                    {user && (
                      <Link
                        href={"/threads"}
                        onMouseDown={() => isMobile && toggleSidebar()}
                      >
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

      <SidebarFooter className="mb-4 md:mb-0">
        {state === "collapsed" && !isMobile && (
          <SidebarTrigger className="w-full" />
        )}

        <NavUser user={user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
