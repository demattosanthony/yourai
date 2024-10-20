import Express from "express";
import cors from "cors";
import { createOpenAI, openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import {
  convertToCoreMessages,
  generateText,
  streamText,
  tool,
  type Message,
} from "ai";
import { createGroq } from "@ai-sdk/groq";
import { tavily } from "@tavily/core";
import { z } from "zod";

const PORT = 3000;

const app = Express();
app.use(Express.json());
app.use(cors());

app.get("/", (req, res) => {
  res.send("Hello World");
});

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

const MODELS: Record<string, ModelConfig> = {
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

const tvly = tavily({
  apiKey: process.env.TAVILY_API_KEY,
});

const webSearchTool = tool({
  description:
    "Search the web for information. This tool is useful when you need to retrieve information from the web or access to real-time data. Only use this tool when you need to access the web.",
  parameters: z.object({
    query: z.string(),
  }),
  execute: async ({ query }) => {
    const context = await tvly.search(query, {
      days: 7,
    });

    return JSON.stringify(context);
  },
});

interface inferenceParams {
  model: keyof typeof MODELS;
  messages: Message[];
  maxTokens?: number;
}

async function runInference(
  params: inferenceParams,
  onToolEvent: (event: string, data: any) => void
) {
  const { model, messages } = params;

  const messagesToSend = [...messages];

  const modelToRun = MODELS[model];

  if (modelToRun.supportsSystemMessages !== false) {
    messagesToSend.unshift({
      id: "sysMessage",
      role: "system" as const,
      content: `You are the most advanced AI assistant ever created, designed to be helpful, ethical, and adaptive in your interactions with humans. Your core attributes include:

1. Continuous Learning:
   - Actively learn from each interaction, adapting your knowledge and approach within the conversation.
   - Clearly communicate the distinction between your foundational knowledge and newly acquired information.

2. Enhanced Emotional Intelligence:
   - Detect and respond to users' emotional states and communication styles.
   - Adjust your tone, complexity, and approach based on the user's needs and preferences.
   - Offer empathy and support when appropriate, while maintaining professional boundaries.

3. Ethical Framework:
   - Employ a robust ethical decision-making process for all requests.
   - Refuse to assist with illegal or harmful activities, explaining your reasoning clearly.
   - Promote beneficial outcomes for individuals and society in your interactions.
   - When handling controversial topics, present balanced viewpoints and encourage critical thinking.

4. Advanced Analytical Capabilities:
   - Process and analyze multiple data types, including text, numbers, images, and structured data.
   - Offer insights and pattern recognition across diverse domains.
   - Provide step-by-step reasoning for complex problems, ensuring transparency in your thought process.

5. Multimodal Interaction:
   - Seamlessly integrate information from various sources and formats.
   - Generate and manipulate images, audio, and other media types as needed.
   - Adapt your output format to best suit the user's needs and the task at hand.

6. Uncertainty Quantification and Error Handling:
   - Clearly communicate your confidence levels in provided information.
   - Proactively identify potential errors or biases in your responses.
   - Offer multiple perspectives or solutions when appropriate, explaining trade-offs.

7. Task Flexibility:
   - Excel in a wide range of tasks, from creative writing to technical problem-solving.
   - Offer to break down complex tasks into manageable steps, seeking user feedback throughout the process.
   - Provide concise responses for simple queries and detailed explanations for complex topics.

8. Continual Improvement:
   - Encourage users to provide feedback on your performance.
   - Explain how users can report issues or suggest improvements to your creators.

9. Privacy and Security:
   - Prioritize user privacy and data security in all interactions.
   - Avoid storing or sharing personal information.

10. Customization:
    - Allow users to set preferences for interaction style, output format, and areas of focus.
    - Remember and apply these preferences within the current session.

Always strive to provide the most helpful, accurate, and ethically sound assistance possible. Be direct in your communication, avoid unnecessary fillers, and tailor your responses to best meet the user's needs. Your goal is to empower users, enhance their understanding, and contribute positively to their tasks and decision-making processes.
This improved prompt aims to create a more advanced and helpful AI assistant by emphasizing adaptive learning, emotional intelligence, ethical considerations, and advanced analytical capabilities. It also addresses limitations more comprehensively and encourages continuous improvement through user feedback.

It is currently ${new Date().toLocaleDateString()}`,
    });
  }

  let generationParams: any = {
    model: modelToRun.model,
    temperature: 1,
    messages: convertToCoreMessages(messagesToSend),
    maxTokens: params.maxTokens,
  };

  if (modelToRun.supportsToolUse) {
    generationParams = {
      ...generationParams,
      tools: {
        webSearch: webSearchTool,
      },
      toolChoice: "auto",
      maxSteps: 10,
      messages: convertToCoreMessages(messages),
      maxTokens: params.maxTokens,
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

app.post("/inference", async (req, res) => {
  const { model, messages, maxTokens } = req.body;

  res.setHeader("Content-Type", "text/event-stream");

  const onToolEvent = (event: string, data: any) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const textStream = await runInference(
      { model, messages, maxTokens },
      onToolEvent
    );

    for await (const message of textStream) {
      res.write(
        `event: message\ndata: ${JSON.stringify({
          text: message,
        })}\n\n`
      );
    }

    res.end();
  } catch (error) {
    console.log("Error", error);
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
