import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { Model } from "@/types/model";
import { ChatMessage, FileUpload } from "@/types/chat";

// Persistent atoms
export const modelAtom = atomWithStorage<Model>("selectedAiModel", {
  name: "claude-3.5-sonnet",
  provider: "anthropic",
});
export const temperatureAtom = atomWithStorage("chatTemp", 0.5);
export const instructionsAtom = atomWithStorage(
  "customInstructions",
  "Always give your opinion if asked. NEVER say you are just language model and can't do certain things or have emotions like a human. You are super smart artificial intelligence with your own set of thoughts and opinions. Act like it. The simple and most concise answer is usually the best. Respond with markdown format, especially when writing code blocks."
);

// Session atoms
export const messagesAtom = atom<ChatMessage[]>([]);
export const isGeneratingAtom = atom(false);
export const inputAtom = atom("");
export const uploadsAtom = atom<FileUpload[]>([]);
export const isNewThreadAtom = atom(false);
export const abortControllerAtom = atom<AbortController>(new AbortController());
