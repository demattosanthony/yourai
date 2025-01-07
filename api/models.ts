import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { mistral } from "@ai-sdk/mistral";

const groq = createGroq();

const perplexity = createOpenAI({
  name: "perplexity",
  apiKey: process.env.PPLX_API_KEY ?? "",
  baseURL: "https://api.perplexity.ai/",
});

const xai = createOpenAI({
  name: "xai",
  apiKey: process.env.XAI_API_KEY ?? "",
  baseURL: "https://api.x.ai/v1/",
});

interface ModelConfig {
  model: ReturnType<
    typeof openai | typeof anthropic | typeof groq | typeof perplexity
  >;
  supportsToolUse: boolean;
  supportsStreaming: boolean;
  provider: string;
  supportsSystemMessages?: boolean;
}

export const MODELS: Record<
  | "gpt-4o-mini"
  | "gpt-4o"
  | "o1"
  | "o1-mini"
  | "claude-3.5-sonnet"
  | "claude-3.5-haiku"
  | "gemini-2.0-pro"
  | "gemini-2.0-flash"
  | "grok-beta"
  | "mistral-large"
  | "mistral-small"
  | "codestral"
  | "ministral-8b"
  | "llama-3.3-70b"
  | "llama-3.1-online-large"
  | "llama-3.1-online-small"
  | "llama-3.1-online-huge"
  | "llama-3.1-8b-instruct"
  | "llama-3.1-70b-instruct",
  ModelConfig
> = {
  "gpt-4o-mini": {
    model: openai("gpt-4o-mini"),
    supportsToolUse: true,
    provider: "openai",
    supportsStreaming: true,
  },
  "gpt-4o": {
    model: openai("gpt-4o"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "openai",
  },
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
  "claude-3.5-sonnet": {
    model: anthropic("claude-3-5-sonnet-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "anthropic",
  },
  "claude-3.5-haiku": {
    model: anthropic("claude-3-5-haiku-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "anthropic",
  },
  //   "claude-3-opus": {
  //     model: anthropic("claude-3-opus-20240229"),
  //     supportsToolUse: true,
  //     supportsStreaming: true,
  //     provider: "anthropic",
  //   },
  "gemini-2.0-pro": {
    model: google("gemini-exp-1206"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "google",
  },
  "gemini-2.0-flash": {
    model: google("gemini-2.0-flash-exp"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "google",
  },
  "grok-beta": {
    model: xai("grok-beta"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "xai",
  },
  "mistral-large": {
    model: mistral("mistral-large-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "mistral",
  },
  "mistral-small": {
    model: mistral("mistral-small-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "mistral",
  },
  codestral: {
    model: mistral("codestral-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "mistral",
  },
  "ministral-8b": {
    model: mistral("ministral-8b-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
    provider: "mistral",
  },
  "llama-3.3-70b": {
    model: groq("llama-3.3-70b-versatile"),
    supportsToolUse: false,
    supportsStreaming: true,
    provider: "groq",
  },
  //   "llama-3.2-1b-preview": {
  //     model: groq("llama-3.2-1b-preview"),
  //     supportsToolUse: false,
  //     supportsStreaming: true,
  //     provider: "groq",
  //   },
  //   "llama-3.2-11b-text-preview": {
  //     model: groq("llama-3.2-11b-text-preview"),
  //     supportsToolUse: false,
  //     supportsStreaming: true,
  // //   },
  //   "llama-3.1-70b-versatile": {
  //     model: groq("llama-3.1-70b-versatile"),
  //     supportsToolUse: true,
  //     supportsStreaming: true,
  //   },
  "llama-3.1-online-large": {
    model: perplexity("llama-3.1-sonar-large-128k-online"),
    supportsToolUse: false,
    supportsStreaming: true,
    provider: "perplexity",
  },
  "llama-3.1-online-small": {
    model: perplexity("llama-3.1-sonar-small-128k-online"),
    supportsToolUse: false,
    supportsStreaming: true,
    provider: "perplexity",
  },
  "llama-3.1-online-huge": {
    model: perplexity("llama-3.1-sonar-huge-128k-online"),
    supportsToolUse: false,
    supportsStreaming: true,
    provider: "perplexity",
  },
  "llama-3.1-8b-instruct": {
    model: perplexity("llama-3.1-8b-instruct"),
    supportsToolUse: false,
    supportsStreaming: true,
    supportsSystemMessages: false,
    provider: "perplexity",
  },
  "llama-3.1-70b-instruct": {
    model: perplexity("llama-3.1-70b-instruct"),
    supportsToolUse: false,
    supportsStreaming: true,
    provider: "perplexity",
  },
};
