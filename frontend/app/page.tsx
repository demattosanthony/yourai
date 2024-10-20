"use client";

// Define the type for response chunks
type ResponseChunk = string;

const sendMessage = async function* (
  messages: ChatMessage[],
  model: string
): AsyncGenerator<ResponseChunk> {
  const url = `http://localhost:3000/inference`;
  const data = {
    messages,
    model,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!response.body) {
      throw new Error("Response body is empty");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Process complete events in the buffer
      let eventEnd = buffer.indexOf("\n\n");
      while (eventEnd > -1) {
        const event = buffer.slice(0, eventEnd);
        buffer = buffer.slice(eventEnd + 2);

        const match = event.match(/data: (.*)/);
        if (match) {
          try {
            const jsonData = JSON.parse(match[1]);
            if (jsonData.text) {
              yield jsonData.text; // Yield the text value
            }
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }

        eventEnd = buffer.indexOf("\n\n");
      }
    }

    // Process any remaining data in the buffer
    if (buffer) {
      const match = buffer.match(/data: (.*)/);
      if (match) {
        try {
          const jsonData = JSON.parse(match[1]);
          if (jsonData.text) {
            yield jsonData.text;
          }
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
    throw error;
  }
};

import ChatInputForm from "@/components/ChatInputForm";
import { ModeToggle } from "@/components/DarkModeToggle";
import MarkdownViewer from "@/components/MarkdownViewer";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Plus } from "lucide-react";
import { use, useState } from "react";

export enum MessageRole {
  system = "system",
  user = "user",
  assistant = "assistant",
}

export type MessageContent = string;

export type ChatMessage = {
  role: MessageRole;
  content: MessageContent | null;
  name?: string;
  // tool_calls?: ToolCall[];
  // tool_call_id?: string;
};

const MODELS = [
  {
    provider: "openai",
    model: "gpt-4o-mini",
  },
  {
    provider: "openai",
    model: "gpt-4o",
  },
  {
    provider: "groq",
    model: "llama-3.2-90b-text-preview",
  },
  {
    provider: "groq",
    model: "llama-3.2-1b-preview",
  },
  {
    provider: "groq",
    model: "llama-3.2-11b-text-preview",
  },
  {
    provider: "groq",
    model: "llama-3.1-70b-versatile",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-large",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-small",
  },
  {
    provider: "perplexity",
    model: "llama-3.1-online-huge",
  },
];

const selectedModelAtom = atomWithStorage("selectedAiModel", "gpt-4o");
const messagesAtom = atomWithStorage<ChatMessage[]>("chatMessages", []);

export default function Home() {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);

  const handleSubmit = async () => {
    // Capture the current input
    const userInput = input;

    // Clear the input field
    setInput("");

    // Add user message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: MessageRole.user, content: userInput },
      { role: MessageRole.assistant, content: "" },
    ]);

    for await (const chunk of sendMessage(
      [...messages, { role: MessageRole.user, content: userInput }],
      selectedModel
    )) {
      // Update the chat with the assistant response
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        const lastMessage = updatedMessages[updatedMessages.length - 1];

        // Ensure the last message is from the assistant
        if (lastMessage.role === MessageRole.assistant) {
          lastMessage.content += chunk;
        }

        return updatedMessages;
      });
    }
  };
  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="w-full p-6 items-center justify-center flex relative">
        <Select
          onValueChange={(value) => {
            setSelectedModel(value);
          }}
          value={selectedModel}
        >
          <SelectTrigger className="w-auto min-w-[225px] text-sm font-semibold">
            <SelectValue placeholder="Select a model" />
          </SelectTrigger>
          <SelectContent>
            {MODELS.map((model) => (
              <SelectItem key={model.model} value={model.model}>
                {model.model}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="absolute  right-8 bg-opacity-50 z-10">
          <div className="flex items-center ">
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

      <div className="flex-1 w-full flex overflow-y-auto">
        <div className="max-w-[1200px] mx-auto p-4 w-full">
          {messages.length === 0 && (
            <div className="flex-1 w-full h-full flex items-center justify-center">
              <div className="w-32 h-32 bg-black rounded-full dark:bg-white"></div>
            </div>
          )}

          {messages.length > 0 && (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${
                    message.role === MessageRole.user
                      ? "justify-end"
                      : "justify-start"
                  } mb-4`}
                >
                  <div
                    className={`max-w-[70%] rounded-xl p-3 ${
                      message.role === MessageRole.user
                        ? "bg-primary text-white self-end dark:text-black"
                        : "bg-secondary self-start"
                    }`}
                  >
                    <MarkdownViewer content={message.content || ""} />
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>

      <div className="w-full flex items-center justify-center mx-auto p-4">
        <ChatInputForm
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
