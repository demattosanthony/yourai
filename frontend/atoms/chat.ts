import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Model } from "@/types/model";
import { ChatMessage, FileUpload } from "@/types/chat";

// Persistent atoms
export const modelAtom = atomWithStorage<Model>("selectedAiModel", {
  name: "claude-3.5-sonnet",
  provider: "anthropic",
  supportsImages: true,
  supportsPdfs: true,
  supportsToolUse: true,
  supportsStreaming: true,
});
export const temperatureAtom = atomWithStorage("chatTemp", 0.5);
export const instructionsAtom = atomWithStorage("customInstructions", "");

// Session atoms
export const messagesAtom = atom<ChatMessage[]>([]);
export const isGeneratingAtom = atom(false);
export const inputAtom = atom("");
export const uploadsAtom = atom<FileUpload[]>([]);
export const abortControllerAtom = atom<AbortController>(new AbortController());
