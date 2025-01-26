"use client";

import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowRight, Check, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// Animation variants for Framer Motion
const checkmarkAnimation = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { duration: 0.5 },
};

// Loading component
const LoadingState = () => (
  <Card className="w-full max-w-md">
    <CardHeader className="text-center space-y-4">
      <div className="h-16 w-16 mx-auto animate-pulse bg-gray-200 rounded-full" />
      <div className="space-y-2">
        <div className="h-6 bg-gray-200 rounded animate-pulse" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mx-auto" />
      </div>
    </CardHeader>
  </Card>
);

// Error component
const ErrorState = () => (
  <Card className="w-full max-w-md">
    <CardHeader className="text-center space-y-4">
      <motion.div {...checkmarkAnimation} className="flex justify-center">
        <AlertCircle className="w-16 h-16 text-red-500" />
      </motion.div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Oops!</h1>
        <p className="text-muted-foreground">
          Something went wrong while processing your payment.
        </p>
      </div>
    </CardHeader>
    <CardContent className="flex justify-center pb-6">
      <Button asChild>
        <Link href="/support">
          Contact Support <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

// Success component
const SuccessState = () => (
  <Card className="w-full max-w-md">
    <CardHeader className="text-center space-y-4">
      <motion.div {...checkmarkAnimation} className="flex justify-center">
        <Check className="w-16 h-16 text-green-500" />
      </motion.div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Thank you!</h1>
        <p className="text-muted-foreground">We have received your payment.</p>
      </div>
    </CardHeader>
    <CardContent className="flex justify-center pb-6">
      <Button asChild>
        <Link href="/">
          Return to App <ArrowRight className="ml-2 w-4 h-4" />
        </Link>
      </Button>
    </CardContent>
  </Card>
);

const SuccessPageContent = () => {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  );

  useEffect(() => {
    const syncData = async () => {
      if (!session_id) {
        setStatus("error");
        return;
      }

      try {
        const response = await api.syncAfterSuccess(session_id);
        if (response.ok) {
          setStatus("success");
        } else {
          setStatus("error");
        }
      } catch (error) {
        console.error("Error syncing data:", error);
        setStatus("error");
      }
    };

    syncData();
  }, [session_id]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      {status === "loading" && <LoadingState />}
      {status === "success" && <SuccessState />}
      {status === "error" && <ErrorState />}
    </div>
  );
};

const SuccessPage = () => {
  return (
    <Suspense fallback={<LoadingState />}>
      <SuccessPageContent />
    </Suspense>
  );
};

export default SuccessPage;
