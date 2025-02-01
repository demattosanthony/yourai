"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AIOrbScene from "@/components/AiOrbScene";

export default function LoginPage() {
  const router = useRouter();
  const { handleGoogleLogin } = useAuth();

  return (
    <div className="min-h-screen flex flex-col items-center px-4 py-12 h-full">
      <div className="absolute top-1 left-1">
        <Button
          onClick={() => {
            router.back();
          }}
          size={"icon"}
          variant={"ghost"}
        >
          <ArrowLeft size={24} />
        </Button>
      </div>

      <main className="flex flex-col gap-8 items-center w-full justify-center h-[75%]">
        {/* <Image src="/yo-blob.png" alt="logo" height={75} width={75} /> */}
        <AIOrbScene height="85px" width="85px" isAnimating={true} />

        {/** Title and description */}
        <div className="flex flex-col items-center w-[400px] gap-2">
          <h3 className="scroll-m-20 text-3xl font-semibold tracking-tight">
            Yo! Let&apos;s get started
          </h3>
          {/* <p className="text-base text-muted-foreground text-center">
            What's up?
          </p> */}
        </div>

        {/** Oauth buttons */}

        <div className="flex flex-col gap-4">
          <Button
            className="font-semibold w-[320px] flex justify-start h-[50px]"
            onClick={handleGoogleLogin}
            variant={"outline"}
          >
            <img src="/google.svg" alt="google" className="h-5 w-5 mr-1" />
            Continue with Google
          </Button>
        </div>
      </main>

      <div className="absolute bottom-2">
        <Link href={"https://syyclops.com"} target="_blank">
          <Button variant={"link"}>By Syyclops</Button>
        </Link>
      </div>
    </div>
  );
}
