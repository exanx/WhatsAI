
export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  SYSTEM = 'system'
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  id: string;
  senderId: string; // 'user' or characterId
  content: string; // text content or base64 string
  type: MessageType;
  timestamp: number;
  // Extras
  fileData?: {
    mimeType: string;
    data: string; // base64
  };
  groundingMetadata?: GroundingChunk[];
  thinkingTrace?: string; // For Gemini 2.5/3.0 thinking content
  isThinking?: boolean;
}

export interface Character {
  id: string;
  name: string;
  age: string;
  gender: string;
  language: string;
  role: string;
  description: string;
  persona: string; // Detailed behavioral traits
  appearance: string;
  avatar: string;
  systemInstruction: string;
  phoneNumber: string;
  voiceName: string; // For TTS/Live
}

export interface UserProfile {
  name: string;
  about: string;
  avatar: string; // URL or Base64
}

export enum ChatModel {
  SMART_PRO = 'gemini-3-pro-preview',
  FAST_LITE = 'gemini-flash-lite-latest',
  STANDARD_FLASH = 'gemini-2.5-flash'
}

export interface AppSettings {
  chatModel: ChatModel;
  enableThinking: boolean;
  thinkingBudget: number;
  enableSearchGrounding: boolean;
  imageAspectRatio: '1:1' | '3:4' | '4:3' | '16:9' | '9:16';
  theme: 'light' | 'dark';
}
