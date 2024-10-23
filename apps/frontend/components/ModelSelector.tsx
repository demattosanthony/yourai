"use client";

import * as React from "react";
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

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: React.Dispatch<React.SetStateAction<string>>;
}

const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModel,
  setSelectedModel,
}) => {
  const [open, setOpen] = React.useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild className="p-2">
        <Button
          variant="ghost"
          role="combobox"
          aria-expanded={open}
          className="w-auto justify-between"
        >
          <div className="flex items-center">
            {getModelImage(selectedModel)}
            {MODELS.find((model) => model.model === selectedModel)?.name ||
              "Select model..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 ">
        <Command>
          <CommandInput placeholder="Search model..." />
          <CommandList className="max-h-[400px]">
            <CommandEmpty>No model found.</CommandEmpty>
            <CommandGroup>
              {MODELS.map((model) => (
                <CommandItem
                  key={model.model}
                  value={model.model}
                  onSelect={(currentValue) => {
                    setSelectedModel(currentValue);
                    setOpen(false);
                  }}
                >
                  <div className="flex items-center">
                    {getModelImage(model.model)}
                    <span>{model.name}</span>
                  </div>
                  <Check
                    className={cn(
                      "ml-auto h-4 w-4",
                      selectedModel === model.model
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

function getModelImage(model: string) {
  const modelInfo = MODELS.find((m) => m.model === model);
  if (!modelInfo) return null;

  switch (modelInfo.provider) {
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
          src="https://www.perplexity.ai/favicon.svg"
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
      return <img src="/groq.svg" alt="Groq" className="w-5 h-5 mr-2" />;

    default:
      return null;
  }
}

const MODELS = [
  {
    provider: "openai",
    model: "gpt-4o",
    name: "OpenAI GPT-4o",
  },
  {
    provider: "openai",
    model: "gpt-4o-mini",
    name: "OpenAI GPT-4o Mini",
  },
  {
    provider: "openai",
    model: "o1-preview",
    name: "OpenAI o1 Preview",
  },
  {
    provider: "openai",
    model: "o1-mini",
    name: "OpenAI o1 Mini",
  },
  {
    provider: "anthropic",
    model: "claude-3.5-sonnet",
    name: "Anthropic Claude 3.5 Sonnet",
  },
  // {
  //   provider: "anthropic",
  //   model: "claude-3.5-haiku",
  //   name: "Anthropic Claude 3.5 Haiku",
  // },
  {
    provider: "anthropic",
    model: "claude-3-opus",
    name: "Anthropic Claude 3 Opus",
  },
  {
    provider: "xai",
    model: "grok-beta",
    name: "xAI Grok Beta",
  },
  {
    provider: "google",
    model: "gemini-1.5-pro",
    name: "Google Gemini 1.5 Pro",
  },
  {
    provider: "google",
    model: "gemini-1.5-flash",
    name: "Google Gemini 1.5 Flash",
  },
  {
    provider: "mistral",
    model: "mistral-large",
    name: "Mistral Large",
  },
  {
    provider: "mistral",
    model: "mistral-small",
    name: "Mistral Small",
  },
  {
    provider: "mistral",
    model: "codestral",
    name: "Mistral Codestral",
  },
  {
    provider: "groq",
    model: "llama-3.1-70b-versatile",
    name: "Groq Llama 3.1 70b",
  },
  {
    provider: "groq",
    model: "llama-3.2-1b-preview",
    name: "Groq Llama 3.2 1b",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-huge",
    name: "Perplexity Llama 3.1 Online 405B",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-large",
    name: "Perplexity Llama 3.1 Online 70B",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-small",
    name: "Perplexity Llama 3.1 Online 8B",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-8b-instruct",
    name: "Perplexity Llama 3.1 8b Instruct",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-70b-instruct",
    name: "Perplexity Llama 3.1 70b Instruct",
  },
];
