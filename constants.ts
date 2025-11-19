
import { AppSettings, ChatModel, UserProfile } from "./types";

export const DEFAULT_SETTINGS: AppSettings = {
  chatModel: ChatModel.STANDARD_FLASH,
  enableThinking: false,
  thinkingBudget: 16384,
  enableSearchGrounding: true,
  imageAspectRatio: '1:1',
  theme: 'light'
};

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'You',
  about: 'Available',
  avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=user123'
};

export const MODEL_IDS = {
  // Text/Multimodal
  GEMINI_3_PRO: 'gemini-3-pro-preview',
  GEMINI_2_5_FLASH: 'gemini-2.5-flash',
  GEMINI_FLASH_LITE: 'gemini-flash-lite-latest',
  
  // Image
  IMAGEN_4: 'imagen-4.0-generate-001',
  GEMINI_FLASH_IMAGE: 'gemini-2.5-flash-image', // Nano banana for editing
  
  // Audio/Video
  LIVE_AUDIO: 'gemini-2.5-flash-native-audio-preview-09-2025',
  TTS: 'gemini-2.5-flash-preview-tts',
  
  // Video Gen (not fully used in chat flow but good to have const)
  VEO: 'veo-3.1-fast-generate-preview'
};

export const INITIAL_CHARACTERS = [
  {
    id: 'char_1',
    name: 'Gemini Agent',
    age: 'AI',
    gender: 'Non-binary',
    language: 'English',
    role: 'Helpful Assistant',
    description: 'A capable AI assistant that can see, hear, and speak. Use me to analyze photos, edit images, or just chat.',
    persona: 'Polite, efficient, and technically proficient. Always eager to help with complex tasks.',
    appearance: 'Abstract futuristic digital avatar, glowing nodes, cyan and blue palette.',
    avatar: 'https://www.gstatic.com/lamda/images/gemini_sparkle_v002_d4735304ff6292a690345.svg',
    systemInstruction: 'You are a helpful AI assistant powered by Google Gemini.',
    phoneNumber: '+1 (555) 000-0000',
    voiceName: 'Kore'
  }
];
