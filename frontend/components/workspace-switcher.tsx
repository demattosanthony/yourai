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
import AIOrbScene from "./AiOrbScene";

type Team = {
  name: string;
  logo: React.ElementType | null;
  useAiOrb?: boolean;
  plan: string;
};

export function WorkSpaceSwitcher({ teams }: { teams: Team[] }) {
  const { isMobile } = useSidebar();
  const [activeTeam, setActiveTeam] = React.useState(teams[0]);

  const TeamLogo = ({ team }: { team: Team }) => {
    if (team.useAiOrb) {
      return (
        <div className="flex h-6 w-6 items-center justify-center shrink-0">
          <AIOrbScene width="20px" height="20px" autoRotateSpeed={0.5} />
        </div>
      );
    }

    if (!team.logo) {
      return null;
    }

    return (
      <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shrink-0">
        {React.createElement(team.logo, { className: "size-3" })}
      </div>
    );
  };

  return (
    <SidebarMenuItem className="flex items-center flex-col">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <SidebarMenuButton className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground flex w-full group-data-[collapsible=icon]:justify-center justify-start items-center gap-1 px-1">
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
          <DropdownMenuItem className="gap-2 p-2">
            <div className="flex size-6 items-center justify-center rounded-md border bg-background">
              <Plus className="size-4" />
            </div>
            <div className="font-medium text-muted-foreground">Add team</div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </SidebarMenuItem>
  );
}
