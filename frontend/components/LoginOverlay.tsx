"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useMeQuery } from "@/queries/queries";

export function LoginOverlay() {
  const router = useRouter();
  const handleGoogleLogin = () => {
    router.push(
      `${
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
      }/auth/google`
    );
  };

  const { data, isLoading } = useMeQuery();
  const user = data?.user;

  if (isLoading || user) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4  z-50">
      <Card className="w-full max-w-[400px] shadow-2xl border-0 bg-white/90 backdrop-blur">
        <CardHeader className="text-center pb-2">
          <div className="relative mx-auto w-20 h-20">
            <img
              src="/YO_192.png"
              alt="logo"
              className="w-full h-full object-contain"
            />
          </div>

          <div>
            <CardTitle className="text-3xl font-bold">Yo..our AI</CardTitle>
            <CardDescription className="text-base mt-2 text-gray-600">
              Sign in or create an account to continue
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="py-2 flex flex-col items-center">
          <Button
            className="font-semibold w-full"
            onClick={handleGoogleLogin}
            // size="lg"
          >
            <img src="/google.svg" alt="google" className="h-5 w-5 mr-1" />
            Continue with Google
          </Button>

          <p className="text-xs text-center mt-4 text-gray-500 max-w-[300px]">
            By logging in, you agree to our{" "}
            <a href="/legal/terms" className="text-blue-500 underline">
              Terms of Service
            </a>{" "}
            and{" "}
            <a href="/legal/privacy" className="text-blue-500 underline">
              Privacy Policy
            </a>
            .{" "}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
