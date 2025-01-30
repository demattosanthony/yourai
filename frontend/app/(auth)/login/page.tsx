"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

export default function LoginPage() {
  const { handleGoogleLogin, handleMicrosoftLogin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 h-full">
      <main className="flex flex-col gap-8 items-center w-full justify-center h-[75%]">
        <Image src="/yo-blob.png" alt="logo" height={75} width={75} />

        {/** Title and description */}
        <div className="flex flex-col items-center w-[400px] gap-2">
          <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Yo! Let's get started
          </h3>
          {/* <p className="text-base text-muted-foreground text-center">
            What's up?
          </p> */}
        </div>

        {/** Oauth buttons */}
        <div className="mt-2 flex flex-col gap-4">
          <Button
            className="font-semibold w-[280px] flex justify-start h-[50px]"
            onClick={handleGoogleLogin}
            variant={"outline"}
          >
            <img src="/google.svg" alt="google" className="h-7 w-7 mr-1" />
            Continue with Google
          </Button>
          <Button
            className="font-semibold w-[280px] flex justify-start h-[50px]"
            onClick={handleMicrosoftLogin}
            variant={"outline"}
          >
            <img src="/msft.svg" alt="google" className="h-6 w-6 mr-2" />
            Continue with Microsoft
          </Button>
        </div>
      </main>
    </div>
  );
}
