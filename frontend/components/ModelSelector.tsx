"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
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

const ModelSelector: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useAtom(modelAtom);

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
          {/* <CommandInput placeholder="Search model..." /> */}
          <CommandList className="max-h-[450px]">
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {models.map((model) => (
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

  return <img src={iconPath} alt={providerName} className="w-5 h-5 mr-2" />;
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

    default:
      return null;
  }
}
