"use client";

import { motion } from "framer-motion";
import { Button } from "./ui/button";
import { useAtom } from "jotai";
import {
  CLAUDE_3_5_CONFIG,
  inputAtom,
  modelAtom,
  SONAR_PRO_CONFIG,
} from "@/atoms/chat";
import { NotebookPen, Plug, Search, LucideIcon, Globe } from "lucide-react";

interface ConversationStartersProps {
  triggerFileInput: () => void;
  triggerTextAreaFocus: () => void;
}

interface StarterButtonProps {
  icon: LucideIcon;
  iconColor: string;
  label: string;
  inputText: string;
  requiresFile?: boolean;
  requiresWebSearch?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void; // Updated type
}

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
    inputText: "Help me write a report about ",
    requiresFile: false,
  },
  {
    icon: Globe,
    iconColor: "text-green-500",
    label: "Search the web",
    inputText: "Search the web for ",
    requiresFile: false,
    requiresWebSearch: true,
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
  triggerFileInput,
  triggerTextAreaFocus,
}: ConversationStartersProps) {
  const [, setInput] = useAtom(inputAtom);
  const [selectedModel, setModel] = useAtom(modelAtom);

  const handleButtonClick = async (starter: StarterButtonProps) => {
    const { requiresFile, inputText, requiresWebSearch } = starter;

    if (requiresFile) {
      if (
        selectedModel.name !== CLAUDE_3_5_CONFIG.name &&
        !selectedModel.name.includes("gemini")
      ) {
        setModel(CLAUDE_3_5_CONFIG);
      }

      await new Promise((r) => setTimeout(r, 100));
      triggerFileInput();
    } else if (requiresWebSearch) {
      setModel(SONAR_PRO_CONFIG);
    }

    setInput(inputText);
    triggerTextAreaFocus();
  };

  return (
    <motion.div
      className="flex flex-wrap gap-2 justify-center items-center max-w-[750px]"
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
