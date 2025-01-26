export interface Model {
  name: string;
  provider: string;
  supportsImages?: boolean;
  supportsToolUse?: boolean;
  supportsStreaming?: boolean;
  supportsPdfs?: boolean;
  description?: string;
  maxPdfSize?: number;
}
