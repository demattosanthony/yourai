import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";
import { xai } from "@ai-sdk/xai";

const groq = createGroq();

const perplexity = createOpenAI({
  name: "perplexity",
  apiKey: process.env.PPLX_API_KEY ?? "",
  baseURL: "https://api.perplexity.ai/",
});

interface ModelConfig {
  model: ReturnType<
    typeof openai | typeof anthropic | typeof groq | typeof perplexity
  >;
  supportsToolUse: boolean;
  supportsStreaming: boolean;
  provider: string;
  supportsSystemMessages?: boolean;
  supportsImages?: boolean;
  supportsPdfs?: boolean;
}

export const MODELS: Record<string, ModelConfig> = {
  ...(process.env.ANTHROPIC_API_KEY
    ? {
        "claude-3.5-sonnet": {
          model: anthropic("claude-3-5-sonnet-20241022"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "anthropic",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
        },
        "claude-3.5-haiku": {
          model: anthropic("claude-3-5-haiku-latest"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "anthropic",
          supportsImages: true,
          supportsPdfs: false,
          supportsSystemMessages: false,
        },
      }
    : {}),
  ...(process.env.OPENAI_API_KEY
    ? {
        o1: {
          model: openai("o1-preview"),
          supportsToolUse: false,
          supportsStreaming: false,
          supportsSystemMessages: false,
          provider: "openai",
        },
        "o1-mini": {
          model: openai("o1-mini"),
          supportsToolUse: false,
          supportsStreaming: false,
          supportsSystemMessages: false,
          provider: "openai",
        },
        "gpt-4o": {
          model: openai("gpt-4o"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "openai",
          supportsImages: true,
          supportsSystemMessages: true,
        },
        "gpt-4o-mini": {
          model: openai("gpt-4o-mini"),
          supportsToolUse: true,
          provider: "openai",
          supportsStreaming: true,
          supportsImages: true,
          supportsSystemMessages: true,
        },
      }
    : {}),
  ...(process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ? {
        "gemini-2.0-flash-thinking": {
          model: google("gemini-2.0-flash-thinking-exp-1219"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
        },
        "gemini-2.0-pro": {
          model: google("gemini-exp-1206"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
        },
        "gemini-2.0-flash": {
          model: google("gemini-2.0-flash-exp"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
        },
        "gemini-2.0-flash-online": {
          model: google("gemini-2.0-flash-exp", {
            useSearchGrounding: true,
          }),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
        },
      }
    : {}),
  ...(process.env.XAI_API_KEY
    ? {
        "grok-2": {
          model: xai("grok-2-1212"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "xai",
          supportsSystemMessages: false,
        },
        "grok-2-vision": {
          model: xai("grok-2-vision-1212"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "xai",
          supportsImages: true,
          supportsSystemMessages: false,
        },
      }
    : {}),
  //   ...(process.env.MISTRAL_API_KEY
  //     ? {
  //         "mistral-large": {
  //           model: mistral("mistral-large-latest"),
  //           supportsToolUse: true,
  //           supportsStreaming: true,
  //           provider: "mistral",
  //         },
  //         "mistral-small": {
  //           model: mistral("mistral-small-latest"),
  //           supportsToolUse: true,
  //           supportsStreaming: true,
  //           provider: "mistral",
  //         },
  //       }
  //     : {}),
  ...(process.env.GROQ_API_KEY
    ? {
        "llama-3.3-70b": {
          model: groq("llama-3.3-70b-versatile"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "groq",
          supportsSystemMessages: false,
        },
      }
    : {}),
  ...(process.env.PPLX_API_KEY
    ? {
        "llama-3.1-sonar-huge-online": {
          model: perplexity("llama-3.1-sonar-huge-128k-online"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "perplexity",
          supportsSystemMessages: false,
        },
        "llama-3.1-sonar-large-online": {
          model: perplexity("llama-3.1-sonar-large-128k-online"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "perplexity",
          supportsSystemMessages: false,
        },
        "llama-3.1-sonar-small-online": {
          model: perplexity("llama-3.1-sonar-small-128k-online"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "perplexity",
          supportsSystemMessages: false,
        },
      }
    : {}),
};
