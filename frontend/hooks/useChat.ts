import api from "@/lib/api";
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

export type MessageContent = {
  type: "image" | "text" | "file";
  data?: string;
  image?: string;
  text?: string;
  mimeType?: string;
};

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
export const messagesAtom = atom<ChatMessage[]>([]);
const generatingResponseAtom = atom(false);
const generatingFirstTokenAtom = atom(false);
export const inputAtom = atom("");
export const attachmentsAtom = atom<File[]>([]);
const temperatureAtom = atomWithStorage("chattemp", 0.5);
export const isNewThreadAtom = atom(false);
export const customIntrucionsAtom = atomWithStorage(
  "customInstructions",
  `You are a superintelligent artifical intelligence. Always give your opinion. NEVER say you are a model and don't have opinions. I value and want to hear what you have to say. Act similar to jarvis from iron man.`
);

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
  const [selectedAttachments, setSelectedAttachments] =
    useAtom(attachmentsAtom);
  const [instructions] = useAtom(customIntrucionsAtom);

  const abortGenerationRef = useRef<() => void>(() => {});

  const handleAbort = () => {
    abortGenerationRef.current();
  };

  const sendMessage = async function* (
    threadId: string,
    content: MessageContent[],
    model: string,
    signal: AbortSignal
  ): AsyncGenerator<ResponseChunk> {
    await api.addMessageToThread(threadId, "user", content);

    const url = `${process.env.NEXT_PUBLIC_API_URL}/threads/${threadId}/inference`;
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify({ model, temperature, instructions: instructions }),
      headers: { "Content-Type": "application/json" },
      signal,
    });

    if (!response.body) throw new Error("Response body is empty");

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      let eventEnd = buffer.indexOf("\n\n");
      while (eventEnd > -1) {
        const event = buffer.slice(0, eventEnd);
        buffer = buffer.slice(eventEnd + 2);

        const eventMatch = event.match(/event: (.*)/);
        const dataMatch = event.match(/data: (.*)/);

        if (eventMatch && dataMatch) {
          try {
            const jsonData = JSON.parse(dataMatch[1]);
            yield JSON.stringify({ event: eventMatch[1], data: jsonData });
          } catch (error) {
            console.error("Error parsing JSON:", error);
          }
        }

        eventEnd = buffer.indexOf("\n\n");
      }
    }
  };

  const handleSubmit = async (threadId: string, msgs: MessageContent[]) => {
    const userInput = input.trim();
    if (!userInput) return;

    setInput("");
    setSelectedAttachments([]);

    setMessages((prev) => [
      ...prev,
      ...msgs.map((msg) => ({ role: MessageRole.user, content: msg })),
      { role: MessageRole.assistant, content: { type: "text", text: "" } },
    ]);

    setGeneratingResponse(true);

    const abortController = new AbortController();
    abortGenerationRef.current = () => {
      console.log("Aborting generation...");
      abortController.abort();
      setGeneratingResponse(false);
    };

    try {
      for await (const chunk of sendMessage(
        threadId,
        msgs,
        selectedModel.name,
        abortController.signal
      )) {
        const { event, data } = JSON.parse(chunk);
        if (event === "message") {
          setMessages((prev) =>
            prev.map((message, index) =>
              index === prev.length - 1 &&
              message.role === MessageRole.assistant
                ? {
                    ...message,
                    content: {
                      type: "text",
                      text: (message.content?.text || "") + data.text,
                    },
                  }
                : message
            )
          );
        }
      }
    } catch (error: any) {
      if (error.name !== "AbortError")
        console.error("Error in handleSubmit:", error);
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
    selectedAttachments,
    setSelectedAttachments,
  };
}
