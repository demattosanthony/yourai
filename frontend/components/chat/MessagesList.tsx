"use client";

import React from "react";
import { Check, Copy } from "lucide-react";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

const MessageBubble = React.memo(
  ({ content, isUser, onCopy, copied }: MessageBubbleProps) => (
    <div
      className={`group mb-4 flex w-full ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          relative flex flex-col rounded-lg p-2
          ${
            isUser
              ? "bg-primary text-white dark:text-black max-w-[85%]"
              : "bg-background max-w-full"
          }
        `}
        style={{
          // For user messages, preserve whitespace but allow wrapping
          whiteSpace: isUser ? "pre-wrap" : "normal",
        }}
      >
        {/* The inner wrapper ensures text breaks properly */}
        <div
          className="
            break-words 
            break-all 
            whitespace-pre-wrap 
            w-full 
            overflow-hidden
          "
        >
          {content}
        </div>

        {/* Copy to clipboard button for user messages */}
        {isUser && onCopy && (
          <div className="absolute -bottom-6 right-0 group-hover:opacity-100 opacity-0 transition-all duration-200">
            {copied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy
                className="w-4 h-4 cursor-pointer text-primary"
                onClick={onCopy}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
);

MessageBubble.displayName = "MessageBubble";

import { Message } from "ai/react";
import MarkdownViewer from "../MarkdownViewer";
import { ThinkingDropdown } from "./ThinkingDropdown";
import AIOrbScene from "../AiOrbScene";

const AssistantMessage = React.memo(({ message }: { message: Message }) => (
  <div className="mb-4 flex flex-col justify-start">
    <div className="flex gap-2">
      <div className="flex-shrink-0 mt-1">
        <AIOrbScene width="24px" height="24px" isAnimating={true} />
      </div>

      {/* Constrain the assistant bubble */}
      <div
        className="
          max-w-full
          md:max-w-[750px]
          overflow-hidden
          rounded-lg
          bg-background
          p-2
          break-words
        "
      >
        {/* Optional reasoning dropdown */}
        {message.reasoning && (
          <ThinkingDropdown>
            <MarkdownViewer content={message.reasoning || ""} />
          </ThinkingDropdown>
        )}

        {/* Main assistant response content */}
        <MarkdownViewer content={message.content || ""} />
      </div>
    </div>
  </div>
));

AssistantMessage.displayName = "AssistantMessage";

import ChatAttachment from "./ChatAttachment";

const UserMessage = React.memo(({ message }: { message: Message }) => {
  const [copied, setCopied] = React.useState<boolean>(false);

  const handleCopy = () => {
    if (message.content) {
      navigator.clipboard.writeText(message.content).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="mb-4">
      {message.experimental_attachments?.map((attachment, idx) => (
        <ChatAttachment key={idx} attachment={attachment} />
      ))}
      <MessageBubble
        content={message.content || ""}
        isUser={true}
        onCopy={handleCopy}
        copied={copied}
      />
    </div>
  );
});

UserMessage.displayName = "UserMessage";

import { useEffect } from "react";
import { MessageRole } from "@/types/chat";

// Optional loading state
const LoadingMessage = React.memo(() => (
  <div className="flex gap-2 items-start mb-4">
    <div className="flex-shrink-0 mt-1">{/* your animation or orb */}</div>
    <div className="flex items-center gap-1 text-muted-foreground mt-4">
      <span className="animate-bounce">•</span>
      <span className="animate-bounce delay-100">•</span>
      <span className="animate-bounce delay-200">•</span>
    </div>
  </div>
));
LoadingMessage.displayName = "LoadingMessage";

const ChatMessagesList = React.memo(
  ({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) => {
    useEffect(() => {
      const container = document.querySelector(".overflow-y-auto");
      if (container) {
        container.scrollTop = container.scrollHeight;
      }
    }, [messages.length]);

    // Example: show loading after the user's last message
    const lastMessage = messages[messages.length - 1];
    const showLoadingState =
      isLoading && lastMessage?.role === MessageRole.user;

    return (
      <div className="flex-1 w-full h-full relative">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="max-w-[840px] mx-auto pt-20 p-4">
            {messages.map((message, index) =>
              message.role === MessageRole.user ? (
                <UserMessage key={index} message={message} />
              ) : (
                <AssistantMessage key={index} message={message} />
              )
            )}
            {showLoadingState && <LoadingMessage />}
          </div>
        </div>
      </div>
    );
  }
);

ChatMessagesList.displayName = "ChatMessagesList";

export default ChatMessagesList;
