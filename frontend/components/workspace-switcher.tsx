"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useMeQuery } from "@/queries/queries";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { CreateOrgForm } from "./organizations/create-org-form";

type Workspace = {
  id: string;
  name: string;
  type: "personal" | "organization";
  logo?: string;
  subscriptionPlan?: string;
};

export function WorkSpaceSwitcher() {
  const { isMobile } = useSidebar();
  const { data: user } = useMeQuery();

  // Create personal workspace from user data
  const personalWorkspace: Workspace = {
    id: user?.id || "",
    name: user?.name || "Personal",
    type: "personal",
    subscriptionPlan: user?.subscriptionPlan || "free",
  };

  // Create organization workspaces from user data
  const organizationWorkspaces: Workspace[] =
    user?.organizationMembers?.map((member) => ({
      id: member.organization.id,
      name: member.organization.name,
      type: "organization" as const,
      logo: member.organization.logo,
    })) || [];

  // Combine personal and organization workspaces
  const workspaces = [personalWorkspace, ...organizationWorkspaces];
  const [activeWorkspace, setActiveWorkspace] = React.useState(workspaces[0]);

  const handleCreateOrgComplete = () => {
    window.location.reload();
  };

  const WorkspaceLogo = ({ workspace }: { workspace: Workspace }) => {
    if (workspace.type === "personal" || !workspace.logo) {
      return (
        <div className="flex h-6 w-6 items-center justify-center shrink-0">
          <Avatar className="h-6 w-6 rounded-full bg-transparent">
            <AvatarImage src={user?.profilePicture} alt={user?.name} />
            <AvatarFallback className="rounded-full">
              {user?.name
                ?.split(" ")
                .map((n: string) => n[0])
                .join("")}
            </AvatarFallback>
          </Avatar>
        </div>
      );
    }

    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full  shrink-0">
        <img
          src={workspace.logo}
          alt={workspace.name}
          className="h-6 w-6 rounded-full"
        />
      </div>
    );
  };

  return (
    <SidebarMenuItem className="flex items-center flex-col">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex w-full group-data-[collapsible=icon]:justify-center justify-start items-center gap-2 px-1">
            <WorkspaceLogo workspace={activeWorkspace} />
            <div className="grid text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">
                {activeWorkspace.name}
              </span>
            </div>
            <ChevronDown className="opacity-50 group-data-[collapsible=icon]:hidden" />
          </SidebarMenuButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
          align="start"
          side={isMobile ? "bottom" : "right"}
          sideOffset={4}
        >
          <DropdownMenuLabel className="text-xs text-muted-foreground">
            Switch workspace
          </DropdownMenuLabel>
          {workspaces.map((workspace, index) => (
            <DropdownMenuItem
              key={workspace.id}
              onClick={() => setActiveWorkspace(workspace)}
              className="gap-2 p-2"
            >
              <WorkspaceLogo workspace={workspace} />
              <div className="flex flex-col">
                <span>{workspace.name}</span>
              </div>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="gap-2 p-2"
          >
            <div className="flex size-6 items-center justify-center rounded-md border bg-background">
              <Plus className="size-4" />
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  className="font-medium text-muted-foreground"
                  onClick={(e) => e.stopPropagation()}
                >
                  Create organization
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-none w-fit pt-2 pb-8">
                <DialogTitle className="h-0 p-0" />
                <CreateOrgForm
                  onComplete={handleCreateOrgComplete}
                  showBackButton={false}
                  includeSamlSetup={false}
                />
              </DialogContent>
            </Dialog>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
