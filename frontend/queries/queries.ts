import { useWorkspace } from "@/components/workspace-context";
import api from "@/lib/api";
import { Thread } from "@/types/chat";
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

export function useMeQuery() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api.me(),
  });
}

export function useThreadsQuery(search?: string, initialThreads?: Thread[]) {
  const { activeWorkspace } = useWorkspace();

  return useInfiniteQuery({
    queryKey: ["threads", activeWorkspace?.id, search],
    queryFn: async ({ pageParam = 1 }) => {
      const threads = await api.getThreads(
        pageParam,
        search,
        activeWorkspace?.type === "organization"
          ? activeWorkspace.id
          : undefined
      );
      return {
        threads,
        nextPage: threads.length === 10 ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}

export function useThreadQuery(threadId: string, isNewThread: boolean) {
  return useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => api.getThread(threadId),
    enabled: !isNewThread, // Only fetch if it's not a new thread
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    refetchOnWindowFocus: false,
  });
}

export function useDeleteThreadMutation() {
  const queryClient = useQueryClient();
  const { activeWorkspace } = useWorkspace();

  return useMutation({
    mutationFn: (threadId: string) =>
      api.deleteThread(
        threadId,
        activeWorkspace?.type === "organization"
          ? activeWorkspace.id
          : undefined
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["threads", activeWorkspace?.id],
      });
    },
  });
}

export function useModelsQuery() {
  return useQuery({
    queryKey: ["models"],
    queryFn: () => api.getAvailableModels(),
  });
}

export function useOrganizationsQuery() {
  return useInfiniteQuery({
    queryKey: ["organizations"],
    queryFn: async ({ pageParam = 1 }) => {
      const response = await api.listOrganizations(pageParam);
      return {
        organizations: response.data,
        pagination: response.pagination,
        nextPage:
          pageParam < response.pagination.pages ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 1,
  });
}

export function useCreateOrganizationMutation() {
  return useMutation({
    mutationFn: (data: {
      name: string;
      domain?: string;
      logo?: string;
      ownerEmail?: string;
      ownerName?: string;
      saml?: {
        entryPoint: string;
        issuer: string;
        cert: string;
        callbackUrl: string;
      };
    }) => api.createOrganization(data),
  });
}

export function useUpdateOrganizationMutation() {
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<{
        name: string;
        domain: string;
        logo: string;
        saml: Partial<{
          entryPoint: string;
          issuer: string;
          cert: string;
          callbackUrl: string;
        }>;
      }>;
    }) => api.updateOrganization(id, data),
  });
}

export function useDeleteOrganizationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.deleteOrganization(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
    },
  });
}

export function useOrganizationMembersQuery(organizationId: string) {
  return useQuery({
    queryKey: ["organization-members", organizationId],
    queryFn: () => api.listOrganizationMembers(organizationId),
  });
}

export function useRemoveOrganizationMemberMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
    }: {
      organizationId: string;
      userId: string;
    }) => api.removeOrganizationMember(organizationId, userId),
    onSuccess: (_, { organizationId }) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-members", organizationId],
      });
    },
  });
}

export function useOrganizationInviteTokenQuery(organizationId: string) {
  return useQuery({
    queryKey: ["organization-invite", organizationId],
    queryFn: () => api.getOrganizationInviteToken(organizationId),
  });
}

export function useResetOrganizationInviteTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (organizationId: string) =>
      api.resetOrganizationInviteToken(organizationId),
    onSuccess: (_, organizationId) => {
      queryClient.invalidateQueries({
        queryKey: ["organization-invite", organizationId],
      });
    },
  });
}

export function useOrgQuery(orgId: string) {
  return useQuery({
    queryKey: ["organization", orgId],
    queryFn: () => api.getOrg(orgId),
  });
}

export function useOrgFromInviteToken(token: string) {
  return useQuery({
    queryKey: ["organization-from-invite", token],
    queryFn: () => api.getOrgFromInviteToken(token),
  });
}
