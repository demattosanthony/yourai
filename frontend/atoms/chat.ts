import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Model } from "@/types/model";
import { ChatMessage, FileUpload } from "@/types/chat";

export const CLAUDE_3_5_CONFIG = {
  name: "claude-3.5-sonnet",
  provider: "anthropic",
  supportedMimeTypes: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
  ],
  maxImageSize: 5 * 1024 * 1024, // 5MB
  maxFileSize: 32 * 1024 * 1024, // 32MB
};

export const SONAR_PRO_CONFIG = {
  name: "sonar-pro",
  provider: "perplexity",
};

// Persistent atoms
export const modelAtom = atomWithStorage<Model>(
  "selectedAiModel",
  CLAUDE_3_5_CONFIG
);
export const temperatureAtom = atomWithStorage("chatTemp", 0.5);
export const instructionsAtom = atomWithStorage("customInstructions", "");

// Session atoms
export const messagesAtom = atom<ChatMessage[]>([]);
export const isGeneratingAtom = atom(false);
export const initalInputAtom = atom("");
export const inputAtom = atom("");
export const uploadsAtom = atom<FileUpload[]>([]);
export const abortControllerAtom = atom<AbortController>(new AbortController());
