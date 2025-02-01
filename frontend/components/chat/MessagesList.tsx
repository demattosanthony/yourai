"use client";

import React, { useEffect } from "react";
import { Message } from "ai/react";
import { Check, Copy } from "lucide-react";
import MarkdownViewer from "../MarkdownViewer";
import { MessageRole } from "@/types/chat";
import { ThinkingDropdown } from "./ThinkingDropdown";
import ChatAttachment from "./ChatAttachment";
import AIOrbScene from "../AiOrbScene";

interface MessageBubbleProps {
  content: string;
  isUser: boolean;
  onCopy?: () => void;
  copied?: boolean;
}

const MessageBubble = React.memo(
  ({ content, isUser, onCopy, copied }: MessageBubbleProps) => (
    <div
      className={`relative group ${
        isUser ? "justify-self-end" : "justify-self-start"
      }`}
      style={{ maxWidth: isUser ? "85%" : "100%" }}
    >
      <div
        className={`px-3 py-2 rounded-lg ${
          isUser ? "bg-primary text-white dark:text-black" : "bg-background"
        }`}
        style={{
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {content}
      </div>
      {isUser && onCopy && (
        <div className="absolute -bottom-6 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
  )
);
MessageBubble.displayName = "MessageBubble";

const AssistantMessage = React.memo(({ message }: { message: Message }) => (
  <div className="flex gap-2 items-start mb-4">
    <div className="flex-shrink-0 mt-1">
      <AIOrbScene width="24px" height="24px" isAnimating={true} />
    </div>
    <div className="flex flex-col gap-2 max-w-[750px]">
      {message.reasoning && (
        <ThinkingDropdown>
          <MarkdownViewer content={message.reasoning} />
        </ThinkingDropdown>
      )}
      <div className="overflow-hidden">
        <MarkdownViewer content={message.content || ""} />
      </div>
    </div>
  </div>
));
AssistantMessage.displayName = "AssistantMessage";

const UserMessage = React.memo(({ message }: { message: Message }) => {
  const [copied, setCopied] = React.useState(false);

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
      {message.experimental_attachments?.map((attachment, index) => (
        <ChatAttachment key={index} attachment={attachment} />
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

// Add this new component for the loading state
const LoadingMessage = React.memo(() => (
  <div className="flex gap-2 items-start mb-4">
    <div className="flex-shrink-0 mt-1">
      <AIOrbScene width="24px" height="24px" isAnimating={true} />
    </div>
    <div className="flex items-center gap-1 text-muted-foreground mt-4">
      <span className="animate-bounce">•</span>
      <span className="animate-bounce delay-100">•</span>
      <span className="animate-bounce delay-200">•</span>
    </div>
  </div>
));
LoadingMessage.displayName = "LoadingMessage";

// Modify the ChatMessagesList component to accept an isLoading prop
const ChatMessagesList = React.memo(
  ({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) => {
    useEffect(() => {
      const messageContainer = document.querySelector(".overflow-y-auto");
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }, [messages.length]);

    const lastMessage = messages[messages.length - 1];
    const showLoadingState =
      isLoading && lastMessage?.role === MessageRole.user;

    return (
      <div className="flex-1 w-full h-full relative">
        <div className="absolute inset-0 overflow-y-auto">
          <div className="max-w-[840px] mx-auto pt-20 px-4 pb-4">
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
