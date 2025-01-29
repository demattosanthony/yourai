import { ChevronDown } from "lucide-react";
import React from "react";

interface ThinkingDropdownProps {
  children: React.ReactNode;
}

export function ThinkingDropdown({ children }: ThinkingDropdownProps) {
  const [isOpen, setIsOpen] = React.useState(true);

  return (
    <div className="w-full rounded-lg mb-2">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-accent"
      >
        <div className="flex items-center gap-2">
          <span>Internal Monologue</span>
        </div>
        <ChevronDown
          className={`h-4 w-4 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && <div className="text-muted-foreground">{children}</div>}
    </div>
  );
}
