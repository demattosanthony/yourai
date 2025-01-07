import useChat from "@/hooks/useChat";
import ModelSelector from "./ModelSelector";
import { Button } from "./ui/button";
import { Plus } from "lucide-react";
import { ModeToggle } from "./DarkModeToggle";
import ChatSettings from "./ChatSettings";

export default function Header() {
  const { selectedModel, setSelectedModel, setMessages } = useChat();

  return (
    <div className="w-full p-4 h-14 items-center justify-center flex absolute top-0 left-0 right-0 z-10 backdrop-blur-xl bg-background/50 transition-all">
      <div className="absolute right-2 md:right-8 bg-opacity-50 z-10">
        <div className="flex items-center ">
          <ModelSelector
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
          />

          <ChatSettings />

          <Button
            variant={"ghost"}
            onClick={() => {
              setMessages([]);
            }}
            size={"lg"}
            className=" p-3 rounded-full"
          >
            <Plus size={32} />
          </Button>

          <ModeToggle />
        </div>
      </div>
    </div>
  );
}
