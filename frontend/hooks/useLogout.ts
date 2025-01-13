import api from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";

export const useLogout = () => {
  const queryClient = useQueryClient();

  async function logOut() {
    await api.logout();

    queryClient.invalidateQueries({ queryKey: ["me"] });

    window.location.reload();
  }

  return { logOut };
};
