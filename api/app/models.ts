import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { createGroq } from "@ai-sdk/groq";
import { google } from "@ai-sdk/google";
import { xai } from "@ai-sdk/xai";
import { mistral } from "@ai-sdk/mistral";
import { deepseek } from "@ai-sdk/deepseek";

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
  maxPdfSize?: number;
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
          supportsSystemMessages: true,
          maxPdfSize: 32 * 1024 * 1024, // 32MB
          description:
            "Claude 3.5 Sonnet strikes the ideal balance between intelligence and speed—particularly for enterprise workloads. It delivers strong performance at a lower cost compared to its peers, and is engineered for high endurance in large-scale AI deployments.",
        },
        "claude-3.5-haiku": {
          model: anthropic("claude-3-5-haiku-latest"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "anthropic",
          supportsImages: false,
          supportsPdfs: false,
          supportsSystemMessages: true,
          description:
            "Claude 3.5 Haiku is the next generation of our fastest model. For a similar speed to Claude 3 Haiku, Claude 3.5 Haiku improves across every skill set and surpasses Claude 3 Opus, the largest model in our previous generation, on many intelligence benchmarks.",
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
            "GPT-4o from OpenAI has broad general knowledge and domain expertise allowing it to follow complex instructions in natural language and solve difficult problems accurately. It matches GPT-4 Turbo performance with a faster and cheaper API.",
        },
        "gpt-4o-mini": {
          model: openai("gpt-4o-mini"),
          supportsToolUse: true,
          provider: "openai",
          supportsStreaming: true,
          supportsImages: true,
          supportsSystemMessages: true,
          description:
            "GPT-4o mini from OpenAI is their most advanced and cost-efficient small model. It is multi-modal (accepting text or image inputs and outputting text) and has higher intelligence than gpt-3.5-turbo but is just as fast.",
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
          supportsSystemMessages: true,
          maxPdfSize: 50 * 1024 * 1024, // 50MB
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
          supportsSystemMessages: true,
          maxPdfSize: 50 * 1024 * 1024, // 50MB
          description:
            "Gemini 2.0 Flash delivers next-gen features and improved capabilities, including superior speed, native tool use, multimodal generation, and a 1M token context window.",
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
          supportsSystemMessages: true,
          maxPdfSize: 50 * 1024 * 1024, // 50MB
          description:
            "Gemini 2.0 Flash Online enhances the speed of Gemini 2.0 Flash with the ability to access real-time information through search grounding. It's perfect for tasks that require up-to-date data and fast responses, while also supporting tool use, streaming, image and PDF inputs.",
        },
        "gemini-2.0-flash-thinking": {
          model: google("gemini-2.0-flash-thinking-exp-01-21"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "google",
          supportsImages: true,
          supportsPdfs: true,
          supportsSystemMessages: true,
          maxPdfSize: 50 * 1024 * 1024, // 50MB
          description:
            "Gemini 2.0 Flash Thinking is an experimental model trained to expose its reasoning process in responses. By making its thinking process explicit, this model demonstrates enhanced reasoning capabilities compared to other Gemini 2.0 Flash models.",
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
          supportsSystemMessages: true,
          description:
            "Grok is an AI modeled after the Hitchhiker’s Guide to the Galaxy. It is intended to answer almost anything and, far harder, even suggest what questions to ask!",
        },
        "grok-2-vision": {
          model: xai("grok-2-vision-1212"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "xai",
          supportsImages: true,
          supportsSystemMessages: true,
          description:
            "In addition to Grok's strong text capabilities, this multimodal model can now process a wide variety of visual information, including documents, diagrams, charts, screenshots, and photographs.",
        },
      }
    : {}),
  ...(process.env.DEEPSEEK_API_KEY
    ? {
        "deepseak-r1": {
          model: deepseek("deepseek-reasoner"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "deepseek",
          description:
            "DeepSeek Reasoner is a specialized model developed by DeepSeek that uses Chain of Thought (CoT) reasoning to improve response accuracy. Before providing a final answer, it generates detailed reasoning steps that are accessible through the API, allowing users to examine and leverage the model's thought process.",
          supportsImages: false,
          supportsPdfs: false,
          supportsSystemMessages: true,
        },
        "deepseek-v3": {
          model: deepseek("deepseek-chat"),
          supportsToolUse: true,
          supportsStreaming: true,
          provider: "deepseek",
          description: `DeepSeek-V3 is an open-source large language model that builds upon LLaMA (Meta’s foundational language model) to enable versatile functionalities such as text generation, code completion, and more.`,
          supportsImages: false,
          supportsPdfs: false,
          supportsSystemMessages: true,
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
          supportsSystemMessages: true,
          description:
            "The Meta Llama 3.3 multilingual large language model (LLM) is a pretrained and instruction tuned generative model in 70B (text in/text out). The Llama 3.3 instruction tuned text only model is optimized for multilingual dialogue use cases and outperforms many of the available open source and closed chat models on common industry benchmarks.",
        },
        "llama-3.1-8b": {
          model: groq("llama-3.1-8b-instant"),
          supportsToolUse: false,
          supportsStreaming: true,
          supportsSystemMessages: true,
          provider: "meta",
          description:
            "Llama is a 8 billion parameter open source model by Meta fine-tuned for instruction following purposes served by Groq on their LPU hardware.",
        },
      }
    : {}),
  ...(process.env.PPLX_API_KEY
    ? {
        "sonar-pro": {
          model: perplexity("sonar-pro"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "perplexity",
          supportsSystemMessages: true,
          description:
            "Permier offering with search grounding, supporting advanced queries and follow-ups",
        },
        sonar: {
          model: perplexity("sonar"),
          supportsToolUse: false,
          supportsStreaming: true,
          provider: "perplexity",
          supportsSystemMessages: true,
          description:
            "Perplexity's lightweight offering with search grounding, quicker and cheaper than Sonar Pro.",
        },
      }
    : {}),
  //   ...(process.env.MISTRAL_API_KEY
  //     ? {
  //         "codestral-latest": {
  //           model: mistral("codestral-latest"),
  //           supportsToolUse: true,
  //           supportsStreaming: true,
  //           provider: "mistral",
  //           description:
  //             "Codestral is a specialized model from Mistral, designed for code generation and understanding. It's excellent for tasks related to programming, debugging, and software development. It supports tool use and streaming.",
  //         },
  //         "mistral-large": {
  //           model: mistral("mistral-large-latest"),
  //           supportsToolUse: true,
  //           supportsStreaming: true,
  //           provider: "mistral",
  //           description:
  //             "Mistral Large is a powerful model from Mistral, capable of handling a wide range of tasks with high performance. It's suitable for complex reasoning, creative writing, and detailed analysis. It supports tool use and streaming.",
  //         },
  //         "mistral-small": {
  //           model: mistral("mistral-small-latest"),
  //           supportsToolUse: true,
  //           supportsStreaming: true,
  //           provider: "mistral",
  //           description:
  //             "Mistral Small is a smaller, more efficient model from Mistral, designed for faster responses and lower resource usage. It's ideal for tasks where speed and cost-effectiveness are priorities. It supports tool use and streaming.",
  //         },
  //       }
  //     : {}),
};
