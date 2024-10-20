import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ModelSelectorProps {
  selectedModel: string;
  setSelectedModel: (model: string) => void;
  isSelectOpen: boolean;
  setIsSelectOpen: (isOpen: boolean) => void;
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
    provider: "anthropic",
    model: "claude-3.5-sonnet",
    name: "Anthropic Claude 3.5 Sonnet",
  },
  {
    provider: "anthropic",
    model: "claude-3-opus",
    name: "Anthropic Claude 3 Opus",
  },
  {
    provider: "groq",
    model: "llama-3.2-90b-text-preview",
    name: "Groq Llama 3.2 90b",
  },
  {
    provider: "groq",
    model: "llama-3.1-70b-versatile",
    name: "Groq Llama 3.1 70b",
  },
  {
    provider: "groq",
    model: "llama-3.2-11b-text-preview",
    name: "Groq Llama 3.2 11b",
  },
  {
    provider: "groq",
    model: "llama-3.2-1b-preview",
    name: "Groq Llama 3.2 1b",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-huge",
    name: "Perplexity Llama 3.1 Online Huge",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-large",
    name: "Perplexity Llama 3.1 Online Large",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-small",
    name: "Perplexity Llama 3.1 Online Small",
  },
];

export default function ModelSelector({
  selectedModel,
  setSelectedModel,
  isSelectOpen,
  setIsSelectOpen,
}: ModelSelectorProps) {
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
      case "groq":
        return <img src="/groq.svg" alt="Groq" className="w-5 h-5 mr-2" />;

      default:
        return null;
    }
  }

  console.log("selectedModel", selectedModel);

  return (
    <Select
      onValueChange={(value) => {
        setSelectedModel(value);
      }}
      value={selectedModel}
      open={isSelectOpen}
      onOpenChange={setIsSelectOpen}
    >
      <SelectTrigger className="w-auto text-sm font-semibold border-none shadow-none focus-visible:ring-0 focus:ring-0">
        <SelectValue>
          <div className="flex flex-row items-center mr-2">
            {getModelImage(selectedModel)}

            {MODELS.find((model) => model.model === selectedModel)?.name}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {MODELS.map((model) => (
          <SelectItem
            key={model.model}
            value={model.model}
            className="flex flex-row items-center"
          >
            <div className="flex flex-row items-center">
              {getModelImage(model.model)}
              <span>{model.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
