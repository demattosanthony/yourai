import { Router } from "express";
import { MODELS } from "../models";

const router = Router();

router.get("", async (req, res) => {
  res.json(
    Object.entries(MODELS).map(([modelName, config]) => ({
      name: modelName,
      supportsToolUse: config.supportsToolUse,
      supportsStreaming: config.supportsStreaming,
      provider: config.provider,
      supportsImages: config.supportsImages,
      supportsPdfs: config.supportsPdfs,
      description: config.description,
      maxPdfSize: config.maxPdfSize,
    }))
  );
});

export default router;
