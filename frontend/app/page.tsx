"use client";

// Define the type for response chunks
type ResponseChunk = string;

const sendMessage = async function* (
  messages: ChatMessage[],
  model: string,
  signal: AbortSignal
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
      signal, // Pass the abort signal here
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

        const eventMatch = event.match(/event: (.*)/);
        const dataMatch = event.match(/data: (.*)/);

        if (eventMatch && dataMatch) {
          const eventType = eventMatch[1];
          const data = dataMatch[1];

          try {
            const jsonData = JSON.parse(data);

            // Yield the entire event object as JSON
            yield JSON.stringify({
              event: eventType,
              data: jsonData,
            });
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }

        eventEnd = buffer.indexOf("\n\n");
      }
    }

    // Process any remaining data in the buffer
    if (buffer) {
      const eventMatch = buffer.match(/event: (.*)/);
      const dataMatch = buffer.match(/data: (.*)/);

      if (eventMatch && dataMatch) {
        const eventType = eventMatch[1];
        const data = dataMatch[1];

        try {
          const jsonData = JSON.parse(data);

          // Yield the entire event object as JSON
          yield JSON.stringify({
            event: eventType,
            data: jsonData,
          });
        } catch (error) {
          console.error("Error parsing JSON:", error);
        }
      }
    }
  } catch (error) {
    console.error("Error in sendMessage:", error);
    // throw error;
  }
};

import ChatInputForm from "@/components/ChatInputForm";
import { ModeToggle } from "@/components/DarkModeToggle";
import MarkdownViewer from "@/components/MarkdownViewer";
import ModelSelector from "@/components/ModelSelector";
import ToolCallResultComponent from "@/components/ToolCallResult";
import { Button } from "@/components/ui/button";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Plus } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type WebSearchResult = string;

type FunctionResultMap = {
  webSearch: WebSearchResult;
};

export enum MessageRole {
  system = "system",
  user = "user",
  assistant = "assistant",
  tool = "tool",
}

export type ToolCall = {
  [K in keyof FunctionResultMap]: {
    id: string;
    type: "function";
    function: { name: K; arguments: string };
    status: "pending" | "completed" | "failed";
    result?: FunctionResultMap[K];
  };
}[keyof FunctionResultMap];

export type MessageContent = string;

export type ChatMessage = {
  role: MessageRole;
  content: MessageContent | null;
  name?: string;
  tool_calls?: ToolCall[];
  tool_call_id?: string;
};

const selectedModelAtom = atomWithStorage("selectedAiModel", "gpt-4o");
const messagesAtom = atomWithStorage<ChatMessage[]>("chatMessages", []);
const generatingResponseAtom = atom(false);

export default function Home() {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [input, setInput] = useState("");
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [generating, setGenerating] = useAtom(generatingResponseAtom);

  const abortGenerationRef = useRef<() => void>(() => {});

  const handleSubmit = async () => {
    // Capture the current input
    const userInput = input.trim();

    // Clear the input field
    setInput("");

    // Add user message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: MessageRole.user, content: userInput },
      { role: MessageRole.assistant, content: "" },
    ]);

    setGenerating(true);

    const abortController = new AbortController();
    const { signal } = abortController;

    // Update the abort function
    abortGenerationRef.current = () => {
      console.log("Aborting generation...");
      abortController.abort();
      setGenerating(false);
    };

    try {
      for await (const chunk of sendMessage(
        [...messages, { role: MessageRole.user, content: userInput }],
        selectedModel,
        signal
      )) {
        const { event, data } = JSON.parse(chunk);

        if (event === "message") {
          const { text } = data;
          setMessages((prevMessages) => {
            const updatedMessages = [...prevMessages];
            const lastMessage = updatedMessages[updatedMessages.length - 1];

            if (lastMessage.role === MessageRole.assistant) {
              lastMessage.content += text;
            }

            return updatedMessages;
          });
        } else if (event === "tool-call-start") {
          const { toolName, args } = data;
          setMessages((prevMessages) => {
            let updatesMessages = [...prevMessages];
            updatesMessages[updatesMessages.length - 1].tool_calls = [
              ...(updatesMessages[updatesMessages.length - 1].tool_calls || []),
              {
                id: "",
                type: "function",
                function: { name: toolName, arguments: args },
                status: "pending",
              },
            ];

            return updatesMessages;
          });
        } else if (event === "tool-call-end") {
          const { toolName } = data;
          console.log("Tool result:", toolName);
          setMessages((prevMessages) => {
            let updatesMessages = [...prevMessages];
            const lastMessage = updatesMessages[updatesMessages.length - 1];

            if (lastMessage.tool_calls) {
              lastMessage.tool_calls.forEach((call) => {
                if (call.function.name === toolName) {
                  call.status = "completed";
                }
              });
            }

            return updatesMessages;
          });
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("Fetch request was aborted.");
      } else {
        console.error("Error in handleSubmit:", error);
      }
    } finally {
      setGenerating(false);
    }
  };

  const [isSelectOpen, setIsSelectOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.key === "k") {
        setIsSelectOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col">
      <div className="w-full p-4 h-16 items-center justify-center flex absolute top-0 left-0 right-0 z-10 backdrop-blur-md bg-background/80 transition-all">
        <div className="absolute right-2 md:right-8 bg-opacity-50 z-10">
          <div className="flex items-center ">
            <ModelSelector
              isSelectOpen={isSelectOpen}
              setIsSelectOpen={setIsSelectOpen}
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
            />

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

      <div className="flex-1 w-full flex overflow-y-auto pt-20">
        <div className="max-w-[1200px] mx-auto p-4 w-full">
          {messages.length === 0 && (
            <div className="flex-1 w-full h-full flex items-center justify-center">
              <div
                className={`w-32 h-32 bg-black rounded-full dark:bg-white 
                  `}
              ></div>
            </div>
          )}

          {messages.length > 0 && (
            <>
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${
                    message.role === MessageRole.user
                      ? "justify-end"
                      : "justify-start"
                  } 
                  mb-4`}
                >
                  <>
                    {message.tool_calls?.map((toolCall, id) => (
                      <ToolCallResultComponent toolCall={toolCall} key={id} />
                    ))}
                  </>

                  <div
                    className={`max-w-full md:max-w-[70%] rounded-xl p-3 ${
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
          onAbort={abortGenerationRef}
          generating={generating}
        />
      </div>
    </div>
  );
}
