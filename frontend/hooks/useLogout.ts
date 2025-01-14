import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const queryClient = useQueryClient();
  const router = useRouter();

  async function logOut() {
    await api.logout();

    queryClient.invalidateQueries({ queryKey: ["me"] });

    router.push("/");
  }

  return { logOut };
};
