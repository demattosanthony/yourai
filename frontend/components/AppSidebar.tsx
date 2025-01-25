"use client";

import * as React from "react";
import { History, Plus } from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import { useMeQuery } from "@/queries/queries";
import Image from "next/image";
import { Button } from "./ui/button";
import { Collapsible } from "./ui/collapsible";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: userData, isLoading } = useMeQuery();
  const user = userData?.user;
  const { state } = useSidebar();
  const isMobile = useIsMobile();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <div className="w-full flex justify-between items-center">
            <Link href="/">
              <div className="flex aspect-square size-8 items-center justify-center">
                <Image
                  src={"/yo-blob.png"}
                  width={24}
                  height={24}
                  alt="YourOrg"
                />
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

                <Link href={"/threads"}>
                  <Button
                    variant={"ghost"}
                    className={`w-full ${
                      state === "collapsed" ? "justify-center" : "justify-start"
                    }`}
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
