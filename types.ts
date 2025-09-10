export interface ProcessedFile {
  path: string;
  content: string; // base64 encoded
  size: number;
  mimeType: string;
}

export interface ProjectFile extends ProcessedFile {
  id: string;
  version: number;
}

export interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  content: string;
  timestamp: string;
  files?: ProcessedFile[];
  isAlert?: boolean;
}

export interface Settings {
  apiKey: string;
  model: string;
  systemInstruction: string;
  temperature: number;
  topK: number;
  topP: number;
  prependMessage: string;
  appendMessage: string;
  usePrepend: boolean;
  useAppend: boolean;
  parseCodeBlocks: boolean;
  conversationMode: boolean;
  persistAttachments: boolean;
}

export interface SessionData {
    settings: Settings;
    messages: Message[];
}

export type AppStatus = 'idle' | 'sending' | 'success' | 'error';
