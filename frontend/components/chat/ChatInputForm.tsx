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
import { modelAtom } from "@/atoms/chat";
import React from "react";
import { PdfThumbnail } from "../pdf-thumbnail";

interface ChatInputFormProps {
  onSubmit: (e: React.FormEvent) => void;
  input: string;
  setInput: (input: string) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  isGenerating?: boolean;
  stop?: () => void;
}

export interface ChatInputFormRef {
  triggerFileInput: () => void;
  focusTextArea: () => void;
}

function ChatInputForm(
  {
    onSubmit,
    input,
    handleInputChange,
    placeholder = "Ask anything...",
    isGenerating,
    stop,
    setInput,
  }: ChatInputFormProps,
  ref: React.ForwardedRef<ChatInputFormRef>
) {
  const [isMounted, setIsMounted] = useState(false);
  const [selectedModel] = useAtom(modelAtom);
  const [focused, setFocused] = useState(true);
  const {
    uploads,
    handleFiles,
    removeUpload,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  } = useFileUpload(selectedModel.supportedMimeTypes || []);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Expose methods to parent component
  React.useImperativeHandle(
    ref,
    (): ChatInputFormRef => ({
      triggerFileInput: () => fileInputRef.current?.click(),
      focusTextArea: () => textAreaRef.current?.focus(),
    })
  );

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
          if (textAreaRef?.current) {
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

  useEffect(() => {
    // Add keyboard shortcut listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        textAreaRef?.current?.focus();
        setFocused(true);
      }
    };

    if (typeof window === "undefined") return;

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (textAreaRef?.current) {
      textAreaRef.current.style.height = "50px";
      textAreaRef.current.style.height =
        textAreaRef.current.scrollHeight + "px";
    }
  }, [input]);

  // Refocus on textarea when generating is done
  useEffect(() => {
    if (!isGenerating) {
      textAreaRef?.current?.focus();
    }
  }, [isGenerating]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <form
      className={`relative h-auto min-h-[24px] max-h-[450px] w-full mx-auto rounded-2xl border max-w-[750px] bg-background ${
        focused && "md:drop-shadow-md"
      }`}
      onSubmit={onSubmit}
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
                <PdfThumbnail url={upload.preview} width={96} />
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
          disabled={isGenerating}
          className={`resize-none min-h-[50px] h-[50px] w-full pt-[14px] text-md rounded-xl border-none focus:ring-0 shadow-none focus-visible:ring-0 flex-1 focus-visible:ring-offset-0 bg-transparent ${
            uploads.length ? "max-h-[300px]" : "max-h-[400px]"
          }`}
        />

        <div className="h-full pr-1 flex pb-[9px]">
          {isMounted &&
            selectedModel.supportedMimeTypes &&
            selectedModel.supportedMimeTypes.length > 0 && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept={selectedModel.supportedMimeTypes?.join(",")}
                  multiple
                  onChange={handleFiles}
                />
                <Button
                  className="h-8 w-8"
                  variant="ghost"
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    fileInputRef?.current?.click();
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
              if (isGenerating && stop) {
                stop(); // Call abortMessage when generating
              } else {
                onSubmit(e);
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

export default React.forwardRef<ChatInputFormRef, ChatInputFormProps>(
  ChatInputForm
);
