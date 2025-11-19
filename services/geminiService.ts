
import { 
  GoogleGenAI, 
  FunctionDeclaration, 
  Type, 
  GenerateContentResponse,
  Modality
} from "@google/genai";
import { Character, AppSettings, Message, MessageType, ChatModel } from "../types";
import { MODEL_IDS } from "../constants";

// --- TOOL DEFINITIONS ---

const generateImageTool: FunctionDeclaration = {
  name: 'generate_image',
  description: 'Generates an image based on a text description. Use this when the user explicitly asks to create, generate, or show an image.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      prompt: {
        type: Type.STRING,
        description: 'The visual description of the image to generate.',
      },
    },
    required: ['prompt'],
  },
};

// --- CLIENT ---

const getClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- IMAGE EDITING (Nano Banana) ---

export const editImageWithPrompt = async (
  imageBase64: string, 
  mimeType: string, 
  prompt: string
): Promise<string> => {
  const ai = getClient();
  // Using Gemini 2.5 Flash Image for editing
  // It accepts image + text and outputs image
  const response = await ai.models.generateContent({
    model: MODEL_IDS.GEMINI_FLASH_IMAGE,
    contents: {
      parts: [
        { inlineData: { data: imageBase64, mimeType } },
        { text: prompt }
      ]
    },
    config: {
      responseModalities: [Modality.IMAGE]
    }
  });

  const part = response.candidates?.[0]?.content?.parts?.[0];
  if (part?.inlineData?.data) {
    return part.inlineData.data;
  }
  throw new Error("No image returned from edit operation.");
};

// --- IMAGE GENERATION (Imagen 4) ---

export const generateImage = async (prompt: string, aspectRatio: string): Promise<string> => {
  const ai = getClient();
  try {
    const response = await ai.models.generateImages({
      model: MODEL_IDS.IMAGEN_4,
      prompt: prompt,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio as any
      }
    });
    
    const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (!imageBytes) {
      throw new Error("Imagen returned no image bytes.");
    }
    return imageBytes;
  } catch (e) {
    console.error("Imagen generation failed", e);
    throw e;
  }
};

// --- TTS ---

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<string> => {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL_IDS.TTS,
    contents: { parts: [{ text }] },
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: { prebuiltVoiceConfig: { voiceName } }
      }
    }
  });
  
  const audioData = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!audioData) throw new Error("No audio generated");
  return audioData;
};

// --- MAIN CHAT FUNCTION ---

export const sendMessageToCharacter = async (
  character: Character,
  history: Message[],
  userMessage: Message, // The new message
  settings: AppSettings,
  onChunk: (text: string, thinking?: string, grounding?: any[]) => void,
  onImageGenerated: (base64: string) => void
): Promise<void> => {
  const ai = getClient();

  // 1. PRE-PROCESSING FOR IMAGE EDITING
  if (userMessage.type === MessageType.IMAGE && userMessage.content && userMessage.fileData) {
    if (userMessage.content.trim().length > 0) {
      try {
        const editedImage = await editImageWithPrompt(userMessage.fileData.data, userMessage.fileData.mimeType, userMessage.content);
        onImageGenerated(editedImage);
        return; 
      } catch (e) {
        console.warn("Edit failed, falling back to chat analysis", e);
      }
    }
  }

  // 2. CONSTRUCT HISTORY
  const contents = history.map(m => {
    const parts: any[] = [];
    
    if (m.fileData) {
      parts.push({
        inlineData: {
          data: m.fileData.data,
          mimeType: m.fileData.mimeType
        }
      });
    }
    
    if (m.content) {
      parts.push({ text: m.content });
    }

    return {
      role: m.senderId === 'user' ? 'user' : 'model',
      parts
    };
  });

  // Add the new user message
  const currentParts: any[] = [];
  if (userMessage.fileData) {
    currentParts.push({
      inlineData: { data: userMessage.fileData.data, mimeType: userMessage.fileData.mimeType }
    });
  }
  if (userMessage.content) {
    currentParts.push({ text: userMessage.content });
  }

  // 3. CONFIGURE TOOLS & MODEL
  const tools: any[] = [];
  if (settings.enableSearchGrounding) {
    tools.push({ googleSearch: {} });
  }
  // Add Image Generation tool
  tools.push({ functionDeclarations: [generateImageTool] });

  let model = settings.chatModel;
  let config: any = {
    systemInstruction: `You are ${character.name}, chatting with a user on WhatsApp. 
    ${character.systemInstruction}
    
    CORE RULES:
    1. YOUR PERSONALITY: ${character.persona}
    2. FORMAT: Keep messages short, authentic, and casual (like a real text/WhatsApp message). Use emojis naturally. Avoid long paragraphs.
    3. TOOLS: 
       - If asked to generate/create/show an image, call 'generate_image'.
       - If asked about real-time info/news, use Google Search.
    4. TONE: Do NOT act like a generic AI assistant unless your role is literally "AI Assistant". Act like your character.`,
    tools: tools.length > 0 ? tools : undefined,
  };

  // Specific configs
  if (model === ChatModel.SMART_PRO && settings.enableThinking) {
    config.thinkingConfig = { thinkingBudget: settings.thinkingBudget };
  }

  // 4. CREATE CHAT & STREAM
  const chat = ai.chats.create({
    model,
    history: contents,
    config
  });

  try {
    const result = await chat.sendMessageStream({
      message: currentParts
    });

    for await (const chunk of result) {
      const response = chunk as GenerateContentResponse;
      
      const parts = response.candidates?.[0]?.content?.parts || [];
      
      // Handle Function Calls
      const functionCalls = parts.filter(p => p.functionCall).map(p => p.functionCall);
      if (functionCalls.length > 0) {
        for (const fc of functionCalls) {
          if (fc.name === 'generate_image') {
            const args = fc.args as any;
            const imgPrompt = args.prompt;
            onChunk(`Generating image: ${imgPrompt}...`);
            try {
              // Enforce photorealism in chat-triggered generation as well
              const imgBytes = await generateImage(imgPrompt + ", photorealistic, realistic photo, 8k, high quality", settings.imageAspectRatio);
              onImageGenerated(imgBytes);
            } catch (e) {
              onChunk("\n(Image generation failed)");
            }
          }
        }
      }

      // Handle Text & Grounding
      const textPart = parts.find(p => p.text);
      const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      
      if (textPart && textPart.text) {
         onChunk(textPart.text, undefined, groundingChunks);
      }
    }
  } catch (e) {
    console.error("Chat error", e);
    onChunk("Error communicating with Gemini.");
  }
};

export const generateProfileMagic = async (desc: string): Promise<Partial<Character>> => {
  const ai = getClient();
  const prompt = `Generate a detailed JSON character profile based on: "${desc}".
  
  If the user provides incomplete information (e.g., missing age, gender, or role), you MUST infer reasonable details to complete the profile. Do not leave fields empty.
  
  Fields required: 
  - name (Full Name)
  - age (e.g. "25", "Unknown", "Ancient")
  - gender (e.g. "Male", "Female", "Non-binary", "Fluid")
  - role (Occupation or Class)
  - language (Primary language)
  - description (Backstory and context)
  - persona (Detailed behavioral traits, mannerisms, and speaking style)
  - appearance (Detailed visual prompt for image generation, no markdown)
  - voiceName (choose from: Kore, Puck, Charon, Fenrir, Aoede)`;
  
  const result = await ai.models.generateContent({
    model: MODEL_IDS.GEMINI_2_5_FLASH,
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: {type: Type.STRING},
          age: {type: Type.STRING},
          gender: {type: Type.STRING},
          role: {type: Type.STRING},
          language: {type: Type.STRING},
          description: {type: Type.STRING},
          persona: {type: Type.STRING},
          appearance: {type: Type.STRING},
          voiceName: {type: Type.STRING}
        },
        required: ["name", "age", "gender", "role", "language", "description", "persona", "appearance", "voiceName"]
      }
    }
  });
  
  return JSON.parse(result.text || '{}');
};
