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

export default function LoginPage() {
  const { handleGoogleLogin } = useAuth();

  return (
    <div className="min-h-screen w-full flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="relative mx-auto w-20 h-20 mb-2">
            <img
              src="/yo-blob.png"
              alt="logo"
              className="w-full h-full object-contain"
            />
          </div>

          <CardTitle className="text-3xl font-bold">Yo..ur AI</CardTitle>
          <CardDescription className="text-base">
            Chat with multiple AI models in one seamless experience
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button className="font-semibold w-full" onClick={handleGoogleLogin}>
            <img src="/google.svg" alt="google" className="h-5 w-5 mr-1" />
            Continue with Google
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
