export enum MessageRole {
  system = "system",
  user = "user",
  assistant = "assistant",
  tool = "tool",
}

export type MessageContent = {
  type: "image" | "text" | "file";
  data?: string;
  image?: string;
  text?: string;
  mimeType?: string;
};

export type ChatMessage = {
  role: MessageRole;
  content: MessageContent | null;
  name?: string;
  // Include any other properties as needed
};

export type FileUpload = {
  file: File;
  preview: string;
  type: "image" | "pdf";
};
