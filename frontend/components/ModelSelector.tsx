"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useEffect, useState } from "react";
import { Model } from "@/types/model";
import api from "@/lib/api";
import { useAtom } from "jotai";
import { modelAtom } from "@/atoms/chat";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "./ui/hover-card";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { useIsMobile } from "@/hooks/use-mobile";

const ModelSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useAtom(modelAtom);

  const isMobile = useIsMobile();

  useEffect(() => {
    api.getAvailableModels().then((res) => setModels(res));

    // Add keyboard shortcut listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "l") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };

    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="h-[36px] justify-between gap-0 p-1"
        >
          <div className="flex items-center">
            {getModelImage(selectedModel.provider)}
            <div className="hidden md:flex truncate ">
              {selectedModel.name || "Select model..."}
            </div>
          </div>
          <ChevronsUpDown className="md:ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 ">
        <Command>
          {!isMobile && <CommandInput placeholder="Search models..." />}

          <CommandList className="max-h-[450px]">
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
                <HoverCard key={model.name} openDelay={0.5} closeDelay={0}>
                  <HoverCardTrigger>
                    <CommandItem
                      key={model.name}
                      value={model.name}
                      onSelect={() => {
                        setSelectedModel(model);
                        setOpen(false);
                      }}
                    >
                      <div className="flex items-center">
                        {getModelImage(model.provider)}
                        <span>{model.name}</span>
                      </div>
                      <Check
                        className={cn(
                          "ml-auto h-4 w-4",
                          selectedModel.name === model.name
                            ? "opacity-100"
                            : "opacity-0"
                        )}
                      />
                    </CommandItem>
                  </HoverCardTrigger>
                  <HoverCardContent
                    side="left"
                    align="center"
                    className="w-[400px]"
                  >
                    <div className="flex justify-between space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage
                          src={getModelIconPath(model.provider || "") || ""}
                        />
                        <AvatarFallback>
                          {model.provider.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>

                      <div className="space-y-3">
                        <h4 className="text-sm">
                          {model.provider.charAt(0).toUpperCase() +
                            model.provider.slice(1)}{" "}
                          / <span className="font-semibold">{model.name}</span>
                        </h4>

                        <p className="text-xs text-muted-foreground">
                          {model.description}
                        </p>

                        <div className="flex gap-1">
                          {model.supportsImages && <Badge>Image Upload</Badge>}
                          {model.supportsPdfs && <Badge>File Upload</Badge>}
                          {(model.name.includes("online") ||
                            model.name.includes("sonar")) && (
                            <Badge>Web Search </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </HoverCardContent>
                </HoverCard>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default ModelSelector;

export function getModelImage(provider: string) {
  const iconPath = getModelIconPath(provider);
  if (!iconPath) return null;

  const providerName = provider.charAt(0).toUpperCase() + provider.slice(1);

  return (
    <img src={iconPath} alt={providerName} className="w-5 h-5 mr-2 rounded" />
  );
}

export function getModelIconPath(provider: string) {
  switch (provider) {
    case "openai":
      return "https://openai.com/favicon.ico";
    case "anthropic":
      return "https://anthropic.com/favicon.ico";
    case "perplexity":
      return "https://www.perplexity.ai/favicon.ico";
    case "google":
      return "/google.svg";
    case "xai":
      return "https://x.ai/icon.svg";
    case "mistral":
      return "/mistral.svg";
    case "groq":
      return "/meta.svg";
    case "meta":
      return "/meta.svg";
    case "deepseek":
      return "https://www.deepseek.com/favicon.ico";
    default:
      return null;
  }
}
