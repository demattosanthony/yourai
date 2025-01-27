"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useAtom } from "jotai";
import { inputAtom, modelAtom } from "@/atoms/chat";
import { NotebookPen, Plug, Search, LucideIcon } from "lucide-react";

interface ConversationStartersProps {
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  textAreaRef: React.RefObject<HTMLTextAreaElement | null>;
}

interface StarterButtonProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  inputText: string;
  requiresFile?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Updated type
}

const CLAUDE_3_5_CONFIG = {
  name: "claude-3.5-sonnet",
  provider: "anthropic",
  maxPdfSize: 32 * 1024 * 1024,
  supportsImages: true,
  supportsPdfs: true,
  supportsStreaming: true,
};

const CONVERSATION_STARTERS: StarterButtonProps[] = [
  {
    icon: Search,
    iconColor: "text-red-500",
    label: "Analyze PDF",
    inputText: "Help me ",
    requiresFile: true,
  },
  {
    icon: Plug,
    iconColor: "text-teal-500",
    label: "Extract Energy Usage",
    inputText:
      "Extract my energy usage from this bill and return it in a table format",
    requiresFile: true,
  },
  {
    icon: NotebookPen,
    iconColor: "text-blue-500",
    label: "Write a Report",
    inputText: "Help me write a report about",
    requiresFile: false,
  },
];

function StarterButton({
  icon: Icon,
  iconColor,
  label,
  onClick,
}: StarterButtonProps) {
  return (
    <Button variant="outline" onClick={onClick}>
      <Icon className={iconColor} size={16} />
      {label}
    </Button>
  );
}

export default function ConversationStarters({
  fileInputRef,
  textAreaRef,
}: ConversationStartersProps) {
  const [, setInput] = useAtom(inputAtom);
  const [, setModel] = useAtom(modelAtom);

  const handleButtonClick = async (starter: StarterButtonProps) => {
    const { requiresFile, inputText } = starter;

    if (requiresFile) {
      setModel(CLAUDE_3_5_CONFIG);
      await new Promise((r) => setTimeout(r, 100));
      fileInputRef.current?.click();
    }

    setInput(inputText);
    textAreaRef.current?.focus();
  };

  return (
    <motion.div
      className="flex flex-wrap gap-2 justify-center items-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1, duration: 1 }}
    >
      {CONVERSATION_STARTERS.map((starter, index) => (
        <StarterButton
          key={index}
          {...starter}
          onClick={(e) => {
            e?.preventDefault();
            e?.stopPropagation();
            handleButtonClick(starter);
          }}
        />
      ))}
    </motion.div>
  );
}
