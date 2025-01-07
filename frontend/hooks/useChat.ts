import { Model } from "@/types/model";
import { atom, useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { useRef } from "react";

// Types
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

type ResponseChunk = string;

// States
const selectedModelAtom = atomWithStorage<Model>("selectedAiModel", {
  name: "gpt-4o",
  provider: "openai",
});
const messagesAtom = atom<ChatMessage[]>([]);
const generatingResponseAtom = atom(false);
const generatingFirstTokenAtom = atom(false);
const inputAtom = atom("");
const temperatureAtom = atomWithStorage("chattemp", 0.5);

export default function useChat() {
  const [selectedModel, setSelectedModel] = useAtom(selectedModelAtom);
  const [messages, setMessages] = useAtom(messagesAtom);
  const [generatingResponse, setGeneratingResponse] = useAtom(
    generatingResponseAtom
  );
  const [generatingFirstToken, setGeneratingFirstToken] = useAtom(
    generatingFirstTokenAtom
  );
  const [input, setInput] = useAtom(inputAtom);
  const [temperature, setTemperature] = useAtom(temperatureAtom);

  const abortGenerationRef = useRef<() => void>(() => {});

  const handleAbort = () => {
    abortGenerationRef.current();
  };

  const sendMessage = async function* (
    messages: ChatMessage[],
    model: string,
    signal: AbortSignal
  ): AsyncGenerator<ResponseChunk> {
    const url = `${process.env.NEXT_PUBLIC_API_URL}/inference`;
    const data = {
      messages,
      model,
      temperature,
    };

    try {
      const response = await fetch(url, {
        method: "POST",
        body: JSON.stringify(data),
        headers: {
          "Content-Type": "application/json",
        },
        signal,
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

  const handleSubmit = async () => {
    // Capture the current input
    const userInput = input.trim();

    if (!userInput) return;

    // Clear the input field
    setInput("");

    // Add user message to the chat
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: MessageRole.user, content: input },
      { role: MessageRole.assistant, content: "" },
    ]);

    setGeneratingResponse(true);
    setGeneratingFirstToken(true);

    const abortController = new AbortController();
    const { signal } = abortController;

    // Update the abort function
    abortGenerationRef.current = () => {
      console.log("Aborting generation...");
      abortController.abort();
      setGeneratingResponse(false);
    };

    try {
      for await (const chunk of sendMessage(
        [...messages, { role: MessageRole.user, content: userInput }],
        selectedModel.name,
        signal
      )) {
        const { event, data } = JSON.parse(chunk);

        if (generatingFirstToken) setGeneratingFirstToken(false);

        if (event === "message") {
          const { text } = data;
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((message, index) => {
              if (
                index === prevMessages.length - 1 &&
                message.role === MessageRole.assistant
              ) {
                return { ...message, content: message.content + text };
              }
              return message;
            });
            return updatedMessages;
          });
        } else if (event === "tool-call-start") {
          const { toolName, args } = data;
          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((message, index) => {
              if (index === prevMessages.length - 1) {
                return {
                  ...message,
                  tool_calls: [
                    ...(message.tool_calls || []),
                    {
                      id: "",
                      type: "function",
                      function: { name: toolName, arguments: args },
                      status: "pending",
                    } as ToolCall,
                  ],
                };
              }
              return message;
            });
            return updatedMessages;
          });
        } else if (event === "tool-call-end") {
          const { toolName } = data;

          setMessages((prevMessages) => {
            const updatedMessages = prevMessages.map((message, index) => {
              if (index === prevMessages.length - 1) {
                const lastToolCall = message.tool_calls?.pop();
                if (lastToolCall) {
                  lastToolCall.status = "completed";
                  lastToolCall.result = data;
                  return {
                    ...message,
                    tool_calls: [...(message.tool_calls || []), lastToolCall],
                  };
                }
              }
              return message;
            });
            return updatedMessages;
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
      setGeneratingResponse(false);
    }
  };

  return {
    selectedModel,
    setSelectedModel,
    messages,
    setMessages,
    generatingResponse,
    setGeneratingResponse,
    sendMessage,
    input,
    setInput,
    handleAbort,
    handleSubmit,
    generatingFirstToken,
    temperature,
    setTemperature,
  };
}
