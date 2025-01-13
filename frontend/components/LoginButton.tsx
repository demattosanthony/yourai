"use client";

import { Button } from "@/components/ui/button";
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
import api from "@/lib/api";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription } from "./ui/alert";

const useLogout = () => {
  async function logOut() {
    await api.logout();

    // queryClient.clear();
    // queryClient.invalidateQueries({ queryKey: ["me"] });

    window.location.reload();
  }

  return { logOut };
};

export function LoginOverlay() {
  const router = useRouter();
  const handleGoogleLogin = () => {
    router.push(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      }/auth/google`
    );
  };

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUser() {
    const response = await api.me();
    setUser(response.user);
    setIsLoading(false);
  }

  useEffect(() => {
    fetchUser();
  }, []);

  if (isLoading) {
    return <></>;
  }

  if (user) {
    return <></>;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="text-center">
          <img
            src={"/YO_192.png"}
            alt="logo"
            width={60}
            height={60}
            className="mx-auto mb-2"
          />
          <CardTitle className="text-xl font-bold">Yo..our AI</CardTitle>
          <CardDescription className="text-sm">
            Chat with any of the top AI models.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={handleGoogleLogin} size="sm">
            <img src="/google.svg" alt="google" className="h-4 w-4 mr-2" />
            Continue with Google
          </Button>
          <Alert variant="default" className="mt-2">
            <AlertDescription className="text-xs text-gray-500">
              By logging in, you agree to our{" "}
              <a href="/legal/terms" className="text-blue-500 underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="/legal/privacy" className="text-blue-500 underline">
                Privacy Policy
              </a>
              .
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginButton() {
  const { setTheme } = useTheme();

  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchUser() {
    const response = await api.me();
    setUser(response.user);
    setIsLoading(false);
  }

  const logout = useLogout();

  const handleLogout = () => {
    logout.logOut();
  };

  useEffect(() => {
    fetchUser();
  }, []);

  if (isLoading) {
    return <Skeleton className="h-6 w-6 rounded-full mx-2" />;
  }

  return (
    <>
      {user && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-6 w-6 cursor-pointer mx-2">
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

            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </>
  );
}
