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

interface ModelConfig {
  model: ReturnType<
    typeof openai | typeof anthropic | typeof groq | typeof perplexity
  >;
  supportsToolUse: boolean;
  supportsStreaming: boolean;
  supportsSystemMessages?: boolean;
}

export const MODELS: Record<string, ModelConfig> = {
  "gpt-4o-mini": {
    model: openai("gpt-4o-mini"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "gpt-4o": {
    model: openai("gpt-4o"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "o1-preview": {
    model: openai("o1-preview"),
    supportsToolUse: false,
    supportsStreaming: false,
    supportsSystemMessages: false,
  },
  "o1-mini": {
    model: openai("o1-mini"),
    supportsToolUse: false,
    supportsStreaming: false,
    supportsSystemMessages: false,
  },
  "claude-3.5-sonnet": {
    model: anthropic("claude-3-5-sonnet-20240620"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "claude-3-opus": {
    model: anthropic("claude-3-opus-20240229"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "gemini-1.5-pro": {
    model: google("gemini-1.5-pro-002"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "gemini-1.5-flash": {
    model: google("gemini-1.5-flash-002"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "mistral-large": {
    model: mistral("mistral-large-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "mistral-small": {
    model: mistral("mistral-small-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  codestral: {
    model: mistral("codestral-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "ministral-8b": {
    model: mistral("ministral-8b-latest"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "llama-3.2-90b-text-preview": {
    model: groq("llama-3.2-90b-text-preview"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
  "llama-3.2-1b-preview": {
    model: groq("llama-3.2-1b-preview"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
  "llama-3.2-11b-text-preview": {
    model: groq("llama-3.2-11b-text-preview"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
  "llama-3.1-70b-versatile": {
    model: groq("llama-3.1-70b-versatile"),
    supportsToolUse: true,
    supportsStreaming: true,
  },
  "llama-3.1-online-large": {
    model: perplexity("llama-3.1-sonar-large-128k-online"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
  "llama-3.1-online-small": {
    model: perplexity("llama-3.1-sonar-small-128k-online"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
  "llama-3.1-online-huge": {
    model: perplexity("llama-3.1-sonar-huge-128k-online"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
  "llama-3.1-8b-instruct": {
    model: perplexity("llama-3.1-8b-instruct"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
  "llama-3.1-70b-instruct": {
    model: perplexity("llama-3.1-70b-instruct"),
    supportsToolUse: false,
    supportsStreaming: true,
  },
};
