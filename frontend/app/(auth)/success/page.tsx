"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import api from "@/lib/api";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const SuccessPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");

  useEffect(() => {
    const syncData = async () => {
      if (session_id) {
        try {
          const response = await api.syncAfterSuccess(session_id);

          if (response.ok) {
            console.log("Data synced successfully");
          } else {
            console.error("Failed to sync data after success");
            // Handle error, maybe show a message to the user
          }
        } catch (error) {
          console.error("Error syncing data:", error);
          // Handle error
        }
      }
    };

    syncData();
  }, [session_id, router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >
            <Check className="w-16 h-16 text-green-500" />
          </motion.div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Thank you!</h1>
            <p className="text-muted-foreground">
              We have received your payment.
            </p>
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
    </div>
  );
};

export default SuccessPage;
