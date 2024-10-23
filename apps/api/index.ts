import Express from "express";
import cors from "cors";
import {
  convertToCoreMessages,
  generateText,
  streamText,
  type Message,
} from "ai";
import { MODELS } from "./models";
import { getWebPageContentsTool, webSearchTool } from "./tools";
import { SYSTEM_MESSAGE } from "./prompts";
import multer from "multer";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import db from "@anyagent/db";
import path from "path";
import { convertContentToTurtle, driver, readPdf } from "./convert";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10000 * 1024 * 1024, // Limit file size to 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

const PORT = process.env.PORT || 4000;

async function main() {
  // try {
  //   await migrate(db, {
  //     migrationsFolder: path.join(__dirname, "../../packages/db/drizzle"),
  //   });
  // } catch (error) {
  //   console.error("Error occurred during database migration", error);
  //   process.exit(1);
  // }

  const app = Express();
  app.use(Express.json());
  app.use(cors());

  app.get("/", (req, res) => {
    res.send("Hello World");
  });

  interface inferenceParams {
    model: keyof typeof MODELS;
    messages: Message[];
    maxTokens?: number;
    temperature?: number;
  }

  async function runInference(
    params: inferenceParams,
    onToolEvent: (event: string, data: any) => void
  ) {
    const { model, messages, temperature, maxTokens } = params;

    let messagesToSend = [...messages];

    const modelToRun = MODELS[model];

    if (modelToRun.supportsSystemMessages !== false) {
      messagesToSend.unshift({
        id: "sysMessage",
        role: "system" as const,
        content: SYSTEM_MESSAGE,
      });
    }

    let generationParams: any = {
      model: modelToRun.model,
      temperature: temperature || 0.5,
      messages: convertToCoreMessages(messagesToSend),
      maxTokens: maxTokens || undefined,
    };

    if (modelToRun.supportsToolUse) {
      generationParams = {
        ...generationParams,
        tools: {
          webSearch: webSearchTool,
          getWebPageContents: getWebPageContentsTool,
        },
        toolChoice: "auto",
        maxSteps: 5,
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
    const { model, messages, maxTokens, temperature } = req.body;

    res.setHeader("Content-Type", "text/event-stream");

    const onToolEvent = (event: string, data: any) => {
      res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
    };

    try {
      const textStream = await runInference(
        { model, messages, maxTokens, temperature },
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

  app.post("/upload", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        res.status(400).json({ error: "No file uploaded" });
        return; // Ensure the function returns void
      }

      // Use the buffer from multer instead of Bun.file
      const file = req.file.buffer;
      const uint8Array = new Uint8Array(file);

      const contents = await readPdf(uint8Array);
      const turtle = await convertContentToTurtle(contents);

      if (turtle.length !== 0) {
        await driver.executeQuery(
          `CALL n10s.rdf.import.inline('${turtle}', 'Turtle')`
        );
      }

      res.status(200).json({ turtle });
    } catch (error) {
      console.error("Error processing upload:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.get("/graph", async (req, res) => {
    try {
      const query = `
    MATCH (n)
    OPTIONAL MATCH (n)-[r]->(m)
    RETURN collect(distinct n) as nodes, collect(distinct r) as relationships
  `;

      const result = await driver.executeQuery(query);
      const record = result.records[0];

      const nodes = record.get("nodes").map((node: any) => ({
        id: node.elementId, // or node.identity.toString()
        label: node.labels[0],
        properties: node.properties,
      }));

      const edges = record
        .get("relationships")
        .filter((rel: any) => rel !== null)
        .map((rel: any) => ({
          id: rel.elementId, // or rel.identity.toString()
          source: rel.startNodeElementId, // or rel.start.toString()
          target: rel.endNodeElementId, // or rel.end.toString()
          type: rel.type,
          properties: rel.properties,
        }));

      res.json({ nodes, edges });
    } catch (error) {
      console.error("Error querying graph:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });
}

main();
