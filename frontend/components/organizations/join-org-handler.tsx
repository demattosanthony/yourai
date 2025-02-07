"use client";

import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function JoinOrgHandler({ token }: { token: string }) {
  const { handleJoinOrg } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const joinOrg = async () => {
      try {
        const result = await handleJoinOrg(token);
        if (result.requiresAuth) {
          // Redirect to Google login with invite token as state parameter
          window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/auth/google?state=${token}`;
          return;
        }

        // Success - redirect to dashboard
        router.push("/");
      } catch (error) {
        // Error - redirect to home with error message
        router.push("/?error=Failed%20to%20join%20organization");
      }
    };

    joinOrg();
  }, [token, handleJoinOrg, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p className="text-lg">Joining organization...</p>
    </div>
  );
}
