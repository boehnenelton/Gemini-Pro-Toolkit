
import type { Settings } from './types';

export const AVAILABLE_MODELS = [
    'gemini-2.5-flash',
    'gemini-2.5-flash-image-preview',
];

export const DEFAULT_SETTINGS: Settings = {
  // FIX: Removed apiKey to enforce usage of environment variable
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are a helpful and expert software development assistant. When asked to generate code, you will provide the file contents in a markdown block, and specify the file path. For example: ```typescript:src/utils.ts\n// code here\n```',
  temperature: 0.7,
  topK: 40,
  topP: 0.95,
  prependMessage: '',
  appendMessage: '',
  usePrepend: false,
  useAppend: false,
  parseCodeBlocks: true,
  conversationMode: true,
  persistAttachments: false,
};