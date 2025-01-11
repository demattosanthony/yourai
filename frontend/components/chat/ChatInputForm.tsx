"use client";

import {
  FileText,
  Paperclip,
  SendHorizonal,
  StopCircle,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { useAtom } from "jotai";
import { useFileUpload } from "@/hooks/useFileUpload";
import { useMessageHandler } from "@/hooks/useMessageHandler";
import { inputAtom, modelAtom } from "@/atoms/chat";

interface ChatInputFormProps {
  onSubmit: () => void;
  placeholder?: string;
}

export default function ChatInputForm({
  onSubmit,
  placeholder = "Ask anything...",
}: ChatInputFormProps) {
  const [input, setInput] = useAtom(inputAtom);
  const [selectedModel] = useAtom(modelAtom);
  const [focused, setFocused] = useState(true);
  const {
    uploads,
    handleFiles,
    removeUpload,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useFileUpload(["image/*", "application/pdf"]);
  const { abortMessage, isGenerating } = useMessageHandler();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = async (
    event: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (event.key === "Enter" && event.shiftKey) {
      event.preventDefault();
      const caretPosition = (event.target as HTMLTextAreaElement)
        .selectionStart;
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
    onSubmit();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  useEffect(() => {
    // Add keyboard shortcut listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        textAreaRef.current?.focus();
        setFocused(true);
      }
    };

    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "50px";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    }
  }, [input]);

  return (
    <form
      className={`relative h-auto min-h-[24px] max-h-[450px] w-full mx-auto rounded-2xl border max-w-[750px] bg-background ${
        focused && "md:border-primary"
      }`}
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* File Upload Preview */}
      {uploads.length > 0 && (
        <div className="flex gap-3 p-3 flex-wrap h-26 overflow-auto">
          {uploads.map((upload, index) => (
            <div
              key={index}
              className="relative h-24 w-24 rounded-lg overflow-hidden border border-border shadow-sm group"
            >
              {upload.type === "image" ? (
                <img
                  src={upload.preview}
                  alt={`Upload ${index + 1}`}
                  className="h-full w-full object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-2 gap-1">
                  <div className="bg-background rounded-lg p-2 shadow-sm">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-xs font-medium text-foreground">
                      PDF
                    </span>
                    <span className="text-[10px] text-muted-foreground max-w-[80px] truncate">
                      {upload.file.name}
                    </span>
                  </div>
                </div>
              )}

              <button
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                onClick={(e) => {
                  e.preventDefault();
                  removeUpload(index);
                }}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex h-full w-full items-end">
        <Textarea
          placeholder={placeholder}
          onChange={handleInputChange}
          ref={textAreaRef}
          onKeyDown={handleKeyDown}
          value={input}
          onBlur={() => setFocused(false)}
          onFocus={() => setFocused(true)}
          autoFocus
          className={`resize-none min-h-[50px] h-[50px]  w-full pt-[14px] text-md rounded-xl border-none focus:ring-0 shadow-none focus-visible:ring-0 flex-1 focus-visible:ring-offset-0 bg-transparent ${
            uploads.length ? "max-h-[300px]" : "max-h-[400px]"
          }`}
        />

        <div className="h-full pr-1 flex pb-[9px]">
          {(selectedModel.supportsImages || selectedModel.supportsPdfs) && (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={`${selectedModel.supportsImages ? "image/*," : ""}${
                  selectedModel.supportsPdfs ? "application/pdf" : ""
                }`}
                multiple
                onChange={handleFiles}
              />
              <Button
                className="h-8 w-8"
                variant="ghost"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
              >
                <Paperclip />
              </Button>
            </>
          )}

          <Button
            ref={buttonRef}
            className="h-8 w-8"
            variant="ghost"
            onClick={(e) => {
              e.preventDefault();
              if (isGenerating) {
                abortMessage(); // Call abortMessage when generating
              } else {
                handleSubmit(e);
              }
            }}
          >
            {isGenerating ? <StopCircle /> : <SendHorizonal />}
          </Button>
        </div>
      </div>
    </form>
  );
}
