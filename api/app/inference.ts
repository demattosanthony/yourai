import { generateText, streamText, type CoreMessage } from "ai";
import { MODELS } from "./models";

interface inferenceParams {
  model: keyof typeof MODELS;
  messages: CoreMessage[];
  maxTokens?: number;
  temperature?: number;
  systemMessage?: string;
}

export async function runInference(
  params: inferenceParams,
  onToolEvent: (event: string, data: any) => void
) {
  const { model, messages, temperature, maxTokens } = params;

  let messagesToSend = [...messages];

  const modelToRun = MODELS[model];

  let generationParams: any = {
    model: modelToRun.model,
    temperature: temperature || 0.5,
    messages: messagesToSend,
    maxTokens: maxTokens || undefined,
    system: modelToRun.supportsSystemMessages
      ? params.systemMessage || undefined
      : undefined,
  };

  if (modelToRun.supportsToolUse) {
    generationParams = {
      ...generationParams,
      //   tools: {
      //     webSearch: webSearchTool,
      //     getWebPageContents: getWebPageContentsTool,
      //   },
      //   toolChoice: "auto",
      //   maxSteps: 5,
      onChunk({
        chunk,
      }: {
        chunk: { type: string; toolName: string; args: any };
      }) {
        if (chunk.type === "tool-call") {
          const { toolName, args } = chunk;
          onToolEvent("tool-call-start", { toolName, args });
        }

        if (chunk.type === "tool-result") {
          onToolEvent("tool-call-end", { toolName: chunk.toolName });
        }
      },
    };
  }

  if (modelToRun.supportsStreaming) {
    const { textStream } = await streamText(generationParams);
    return textStream;
  } else {
    const { text } = await generateText(generationParams);
    return [text]; // Wrap text in an array to make it iterable
  }
}
