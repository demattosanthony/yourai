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

    window.location.reload();
  }

  const handleGoogleLogin = () => {
    router.push(`${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    }/auth/google 
    `);
  };

  const handleMicrosoftLogin = () => {
    router.push(`${
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"
    }/auth/microsoft 
    `);
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

  return { logOut, handleGoogleLogin, handleMicrosoftLogin };
};
