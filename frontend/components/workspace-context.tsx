"use client";

import * as React from "react";
import { type Workspace } from "@/types/workspace";
import { useMeQuery } from "@/queries/queries";

type WorkspaceContextType = {
  activeWorkspace: Workspace | null;
  setActiveWorkspace: (workspace: Workspace) => void;
  workspaces: Workspace[];
};

const WorkspaceContext = React.createContext<WorkspaceContextType | undefined>(
  undefined
);

export const WorkspaceProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [activeWorkspace, setActiveWorkspaceState] =
    React.useState<Workspace | null>(null);
  const { data: user } = useMeQuery();
  const [workspaces, setWorkspaces] = React.useState<Workspace[]>([]);

  console.log(`workspace: `, activeWorkspace);

  // Determine initial workspace (personal or stored)
  React.useEffect(() => {
    if (user) {
      // Wait for user data
      const personalWorkspace: Workspace = {
        id: user.id,
        name: "Personal",
        logo: user.profilePicture,
        type: "personal",
      };

      const organizationWorkspaces: Workspace[] = (
        user?.organizationMembers || []
      ).map((member) => ({
        id: member.organization.id,
        name: member.organization.name,
        type: "organization" as const,
        logo: member.organization.logo,
        subscriptionStatus: member.organization.subscriptionStatus,
      }));

      const allWorkspaces = [personalWorkspace, ...organizationWorkspaces];
      setWorkspaces(allWorkspaces); // Update the workspaces state

      const storedWorkspaceId = localStorage.getItem("activeWorkspaceId");
      let initialWorkspace: Workspace | null = personalWorkspace; // Default to personal

      if (storedWorkspaceId) {
        const storedWorkspace = allWorkspaces.find(
          (w) => w.id === storedWorkspaceId
        );
        if (storedWorkspace) {
          initialWorkspace = storedWorkspace;
        }
      }

      setActiveWorkspaceState(initialWorkspace);
    }
  }, [user]); // Depend on user data

  const setActiveWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceState(workspace);
    localStorage.setItem("activeWorkspaceId", workspace.id);
  };

  const contextValue = {
    activeWorkspace,
    setActiveWorkspace,
    workspaces,
  };

  return (
    <WorkspaceContext.Provider value={contextValue}>
      {children}
    </WorkspaceContext.Provider>
  );
};

export const useWorkspace = () => {
  const context = React.useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
};
