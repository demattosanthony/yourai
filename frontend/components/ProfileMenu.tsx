"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Moon, Sun } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useTheme } from "next-themes";
import { useMeQuery } from "@/queries/queries";
import { Button } from "./ui/button";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function ProfileMenu() {
  const { setTheme } = useTheme();
  const { data, isLoading } = useMeQuery();
  const user = data?.user;
  const { logOut } = useAuth();

  if (isLoading) {
    return <Skeleton className="h-6 w-6 rounded-full mx-2" />;
  }

  return (
    <>
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-7 w-7 cursor-pointer ml-2">
              <AvatarImage
                referrerPolicy="no-referrer"
                src={user.profilePicture || ""}
                alt="profilePic"
              />
              <AvatarFallback className="text-xs">
                {user.name
                  ?.split(" ")
                  .map((n: string) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="mr-4">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Sun className="mr-2 h-4 w-4  rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="mr-2 h-4 w-4 absolute  rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span>Theme</span>
              </DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem onClick={() => setTheme("light")}>
                    Light
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("dark")}>
                    Dark
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setTheme("system")}>
                    System
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={logOut}>
              <LogOut className="h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {!user && (
        <Link href={"/login"}>
          <Button className="ml-2">Login</Button>
        </Link>
      )}
    </>
  );
}
