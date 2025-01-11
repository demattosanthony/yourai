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
          <CommandInput placeholder="Search model..." />
          <CommandList className="max-h-[400px]">
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

function getModelImage(provider: string) {
  switch (provider) {
    case "openai":
      return (
        <img
          src="https://openai.com/favicon.ico"
          alt="OpenAI"
          className="w-5 h-5 mr-2"
        />
      );
    case "anthropic":
      return (
        <img
          src="https://anthropic.com/favicon.ico"
          alt="Anthropic"
          className="w-5 h-5 mr-2"
        />
      );
    case "perplexity":
      return (
        <img
          src="https://www.perplexity.ai/favicon.ico"
          alt="Perplexity"
          className="w-5 h-5 mr-2"
        />
      );
    case "google":
      return (
        <img
          src="https://www.google.com/favicon.ico"
          alt="Google"
          className="w-5 h-5 mr-2"
        />
      );
    case "xai":
      return (
        <img
          src="https://x.ai/favicon.ico"
          alt="xAI"
          className="w-5 h-5 mr-2"
        />
      );
    case "mistral":
      return <img src="/mistral.svg" alt="Mistral" className="w-5 h-5 mr-2" />;
    case "groq":
      return <img src="/groq.webp" alt="Groq" className="w-5 h-5 mr-2" />;

    default:
      return null;
  }
}
