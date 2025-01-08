"use client";

import {
  FileText,
  Paperclip,
  SendHorizonal,
  StopCircle,
  Upload,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import useChat, { attachmentsAtom, inputAtom } from "@/hooks/useChat";
import { useAtom } from "jotai";

interface ChatInputFormProps {
  placeholder?: string;
  onSubmit?: () => void;
  onAbort?: () => void;
}

export default function ChatInputForm({
  placeholder = "Ask anything...",
  onSubmit,
  onAbort,
}: ChatInputFormProps) {
  const [focused, setFocused] = useState(true);
  const [input, setInput] = useAtom(inputAtom);
  const [attachments, setAttachments] = useAtom(attachmentsAtom);
  const [isDragging, setIsDragging] = useState(false);

  const { generatingResponse, selectedModel } = useChat();

  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (onSubmit) onSubmit();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(
      (file) =>
        file.type.startsWith("image/") ||
        (selectedModel.supportsPdfs && file.type === "application/pdf")
    );
    setAttachments((prev) => [...prev, ...validFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter(
      (file) =>
        file.type.startsWith("image/") ||
        (selectedModel.supportsPdfs && file.type === "application/pdf")
    );
    setAttachments((prev) => [...prev, ...files]);
  };

  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = "50px";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    }
  }, [input]);

  useEffect(() => {
    // Add keyboard shortcut listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        textAreaRef.current?.focus();
        setFocused(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <form
      className={`relative h-auto min-h-[24px] max-h-[450px] w-full mx-auto rounded-2xl border max-w-[750px] bg-background ${
        focused && "border-primary"
      }`}
      onSubmit={handleSubmit}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Add overlay when dragging */}
      {isDragging && selectedModel.supportsImages && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-xl z-50 flex items-center justify-center" />
      )}

      {/* Display selected images */}
      {attachments.length > 0 && (
        <div className="flex gap-3 p-3 flex-wrap">
          {attachments.map((file, index) => (
            <div
              key={index}
              className="relative h-24 w-24 rounded-lg overflow-hidden border border-border shadow-sm group"
            >
              {file.type.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(file)}
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
                      {file.name}
                    </span>
                  </div>
                </div>
              )}

              {/* Remove button */}
              <button
                className="absolute top-1 right-1 p-1 rounded-full bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                onClick={(e) => {
                  e.preventDefault();
                  setAttachments(attachments.filter((_, i) => i !== index));
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
                onChange={handleImageUpload}
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
