"use client";

import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";

export const useAuth = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  async function logOut() {
    await api.logout();

    queryClient.invalidateQueries({ queryKey: ["me"] });

    router.push("/");
    window.location.reload();
  }

  const handleGoogleLogin = () => {
    router.push(`${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    }/auth/google 
    `);
  };

  const handleSSOLogin = (slug: string) => {
    router.push(`${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
    }/auth/saml/${slug}
    `);
  };

  const handleJoinOrg = async (token: string) => {
    try {
      const result = await api.joinWithInvite(token);

      if (result.requiresAuth) {
        return { requiresAuth: true };
      }

      // Success case
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      return { success: true };
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const error = params.get("error");

    if (error === "unauthorized") {
      toast("You do not have access", {
        description: "This app is whitelist only for now.",
      });

      // Optionally clear the URL parameter
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  return { logOut, handleGoogleLogin, handleSSOLogin, handleJoinOrg };
};
