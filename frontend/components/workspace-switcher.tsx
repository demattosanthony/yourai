"use client";

import * as React from "react";
import { ChevronDown, Plus } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
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

type Team = {
  name: string;
  logo: React.ElementType | null;
  useAiOrb?: boolean;
  plan: string;
};

export function WorkSpaceSwitcher({ teams }: { teams: Team[] }) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);
  const { data: user } = useMeQuery();

  const TeamLogo = ({ team }: { team: Team }) => {
    if (team.useAiOrb) {
      return (
        <div className="flex h-6 w-6 items-center justify-center shrink-0">
          <Avatar className="h-6 w-6 rounded-full">
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

    if (!team.logo) {
      return null;
    }

    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
        {React.createElement(team.logo, { className: "size-3" })}
      </div>
    );
  };

  return (
    <SidebarMenuItem className="flex items-center flex-col">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex w-full group-data-[collapsible=icon]:justify-center justify-start items-center gap-2 px-1">
            <TeamLogo team={activeTeam} />
            <div className="grid text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-semibold">{activeTeam.name}</span>
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
          {teams.map((team, index) => (
            <DropdownMenuItem
              key={team.name}
              onClick={() => setActiveTeam(team)}
              className="gap-2 p-2"
            >
              <TeamLogo team={team} />
              {team.name}
              <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
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
                  onComplete={() => window.location.reload()}
                  showBackButton={false}
                />
              </DialogContent>
            </Dialog>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
