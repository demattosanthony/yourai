import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";
import { mistral } from "@ai-sdk/mistral";

const groq = createGroq();

const perplexity = createOpenAI({
  name: "perplexity",
  apiKey: process.env.PPLX_API_KEY ?? "",
  baseURL: "https://api.perplexity.ai/",
});

interface ModelConfig {
  model: ReturnType<
    | typeof openai
    | typeof anthropic
    | typeof groq
    | typeof perplexity
    | typeof xai
    | typeof mistral
  >;
  supportsToolUse: boolean;
  supportsStreaming: boolean;
  provider: string;
  supportsSystemMessages?: boolean;
  supportsImages?: boolean;
  supportsPdfs?: boolean;
  description: string;
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
          description:
            "Claude 3.5 Sonnet is a powerful model excelling at complex reasoning, creative writing, and detailed analysis. It's great for tasks requiring a deep understanding of context and nuanced language. It also supports image and PDF inputs.",
        },
        "claude-3.5-haiku": {
          model: anthropic("claude-3-5-haiku-latest"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "anthropic",
          supportsImages: false,
          supportsPdfs: false,
          supportsSystemMessages: false,
          description:
            "Claude 3.5 Haiku is designed for speed and efficiency, providing quick and concise responses. It's ideal for tasks where you need fast results and don't require extensive analysis or creative output. It does not support image or PDF inputs.",
        },
      }
    : {}),
  ...(process.env.OPENAI_API_KEY
    ? {
        o1: {
          model: openai("o1"),
          supportsToolUse: true,
          supportsStreaming: true,
          supportsSystemMessages: true,
          provider: "openai",
          supportsImages: true,
          description:
            "o1 is a versatile model from OpenAI, capable of handling a wide range of tasks with good performance. It supports tool use, streaming, system messages, and image inputs, making it a solid all-around choice.",
        },
        "o1-mini": {
          model: openai("o1-mini"),
          supportsToolUse: true,
          supportsStreaming: true,
          supportsSystemMessages: true,
          provider: "openai",
          supportsImages: true,
          description:
            "o1-mini is a smaller, more efficient version of o1, designed for faster responses and lower resource usage. It's suitable for tasks where speed and cost-effectiveness are priorities, while still offering good performance and supporting tool use, streaming, system messages, and image inputs.",
        },
        "gpt-4o": {
          model: openai("gpt-4o"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "openai",
          supportsImages: true,
          supportsSystemMessages: true,
          description:
            "GPT-4o is OpenAI's flagship model, offering state-of-the-art performance across a wide range of tasks. It excels in complex reasoning, creative content generation, and understanding nuanced language. It supports tool use, streaming, system messages, and image inputs, making it a top choice for demanding applications.",
        },
        "gpt-4o-mini": {
          model: openai("gpt-4o-mini"),
          supportsToolUse: true,
          provider: "openai",
          supportsStreaming: true,
          supportsImages: true,
          supportsSystemMessages: true,
          description:
            "GPT-4o-mini is a more compact version of GPT-4o, designed for faster and more efficient performance. It's ideal for applications where speed and resource efficiency are important, while still providing strong capabilities and supporting tool use, streaming, system messages, and image inputs.",
        },
      }
    : {}),
  ...(process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ? {
        "gemini-2.0-pro": {
          model: google("gemini-exp-1206"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
          description:
            "Gemini 2.0 Pro is a robust model from Google, well-suited for a variety of tasks including text generation, translation, and code completion. It supports tool use, streaming, image and PDF inputs, making it a versatile option for many applications.",
        },
        "gemini-2.0-flash": {
          model: google("gemini-2.0-flash-exp"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
          description:
            "Gemini 2.0 Flash is optimized for speed and efficiency, providing quick responses for tasks where latency is critical. It supports tool use, streaming, image and PDF inputs, making it a great choice for real-time applications.",
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
          description:
            "Gemini 2.0 Flash Online enhances the speed of Gemini 2.0 Flash with the ability to access real-time information through search grounding. It's perfect for tasks that require up-to-date data and fast responses, while also supporting tool use, streaming, image and PDF inputs.",
        },
        "gemini-2.0-flash-thinking": {
          model: google("gemini-2.0-flash-thinking-exp-1219"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: false,
          description:
            "Gemini 2.0 Flash Thinking is designed for tasks that require more complex reasoning and analysis. While it doesn't support tool use, it provides detailed and thoughtful responses, and supports streaming, image and PDF inputs.",
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
          description:
            "Grok-2 is a powerful model from xAI, known for its strong reasoning and conversational abilities. It's well-suited for tasks that require a deep understanding of context and nuanced language. It supports tool use and streaming.",
        },
        "grok-2-vision": {
          model: xai("grok-2-vision-1212"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "xai",
          supportsImages: true,
          supportsSystemMessages: false,
          description:
            "Grok-2-Vision extends the capabilities of Grok-2 by adding support for image inputs. It's ideal for tasks that require understanding both text and visual information. It supports tool use, streaming, and image inputs.",
        },
      }
    : {}),

  ...(process.env.GROQ_API_KEY
    ? {
        "llama-3.3-70b": {
          model: groq("llama-3.3-70b-versatile"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "meta",
          supportsSystemMessages: false,
          description:
            "Llama-3.3-70b is a large and versatile model designed for high-performance text generation and complex reasoning tasks. It's suitable for applications that require a deep understanding of language and nuanced responses. It supports streaming.",
        },
        "llama-3.1-8b": {
          model: groq("llama-3.1-8b-instant"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "meta",
          description:
            "Llama-3.1-8b is a smaller, more efficient model optimized for speed and quick responses. It's ideal for tasks where low latency is a priority, while still providing good performance. It supports streaming.",
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
          description:
            "Llama-3.1-Sonar-Huge-Online is a large model from Perplexity, designed for tasks that require extensive context and access to real-time information. It's well-suited for complex queries and in-depth analysis. It supports streaming.",
        },
        "llama-3.1-sonar-large-online": {
          model: perplexity("llama-3.1-sonar-large-128k-online"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "perplexity",
          supportsSystemMessages: false,
          description:
            "Llama-3.1-Sonar-Large-Online is a robust model from Perplexity, offering a balance between performance and efficiency. It's suitable for a wide range of tasks that require access to real-time information. It supports streaming.",
        },
        "llama-3.1-sonar-small-online": {
          model: perplexity("llama-3.1-sonar-small-128k-online"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "perplexity",
          supportsSystemMessages: false,
          description:
            "Llama-3.1-Sonar-Small-Online is a smaller, more efficient model from Perplexity, optimized for speed and quick responses. It's ideal for tasks where low latency is a priority and real-time information is needed. It supports streaming.",
        },
      }
    : {}),
  ...(process.env.MISTRAL_API_KEY
    ? {
        "codestral-latest": {
          model: mistral("codestral-latest"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "mistral",
          description:
            "Codestral is a specialized model from Mistral, designed for code generation and understanding. It's excellent for tasks related to programming, debugging, and software development. It supports tool use and streaming.",
        },
        "mistral-large": {
          model: mistral("mistral-large-latest"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "mistral",
          description:
            "Mistral Large is a powerful model from Mistral, capable of handling a wide range of tasks with high performance. It's suitable for complex reasoning, creative writing, and detailed analysis. It supports tool use and streaming.",
        },
        "mistral-small": {
          model: mistral("mistral-small-latest"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "mistral",
          description:
            "Mistral Small is a smaller, more efficient model from Mistral, designed for faster responses and lower resource usage. It's ideal for tasks where speed and cost-effectiveness are priorities. It supports tool use and streaming.",
        },
      }
    : {}),
};
