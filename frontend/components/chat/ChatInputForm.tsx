"use client";

import { Paperclip, SendHorizonal, StopCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import useChat from "@/hooks/useChat";

interface ChatInputFormProps {
  placeholder?: string;
  onSubmit?: (input: string) => void;
  onAbort?: () => void;
}

export default function ChatInputForm({
  placeholder = "Ask anything...",
  onSubmit,
  onAbort,
}: ChatInputFormProps) {
  const [focused, setFocused] = useState(true);

  const { generatingResponse, input, setInput } = useChat();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleKeyDown = async (event: any) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      const caretPosition = event.target.selectionStart;
      const textBeforeCaret = input.substring(0, caretPosition);
      const textAfterCaret = input.substring(caretPosition);
      if (setInput) {
        setInput(textBeforeCaret + "\n" + textAfterCaret);
        // Set cursor position after state update
        setTimeout(() => {
          if (textAreaRef.current) {
            textAreaRef.current.selectionStart = caretPosition + 1;
            textAreaRef.current.selectionEnd = caretPosition + 1;
          }
        }, 0);
      }
    } else if (event.key === "Enter") {
      event.preventDefault();
      if (buttonRef.current) buttonRef.current.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!input.trim()) return;
    if (onSubmit) onSubmit(input);
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "50px";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    }
  }, [input]);

  return (
    <form
      className={`relative h-auto min-h-[24px] max-h-[450px] w-full mx-auto rounded-2xl border max-w-[750px] ${
        focused && "border-primary"
      }`}
      onSubmit={handleSubmit}
    >
      <div className="flex h-full w-full items-end">
        <Textarea
          placeholder={placeholder}
          onChange={(e) => setInput(e.target.value)}
          ref={textAreaRef}
          onKeyDown={handleKeyDown}
          value={input}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          autoFocus
          className="resize-none min-h-[24px] h-[50px] max-h-[400px] w-full pt-[14px] text-md rounded-xl border-none focus:ring-0 shadow-none focus-visible:ring-0 flex-1 focus-visible:ring-offset-0 bg-transparent"
        />

        <div className="h-full pr-1 flex pb-[9px]">
          <Button
            ref={buttonRef}
            className="h-8 w-8"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Paperclip />
          </Button>

          <Button
            ref={buttonRef}
            className="h-8 w-8"
            variant="ghost"
            onClick={(e) => {
              if (generatingResponse) {
                // If currently generating, abort the ongoing request
                if (onAbort) onAbort();
              } else {
                handleSubmit(e);
              }
            }}
          >
            {generatingResponse ? <StopCircle /> : <SendHorizonal />}
          </Button>
        </div>
      </div>
    </form>
  );
}
