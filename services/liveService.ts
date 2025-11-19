import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";
import { Character } from "../types";
import { MODEL_IDS } from "../constants";

export class LiveVoiceSession {
  private client: GoogleGenAI;
  private sessionPromise: Promise<any> | null = null;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime = 0;
  private sources = new Set<AudioBufferSourceNode>();
  private stream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private isActive = false;

  constructor(apiKey: string) {
    this.client = new GoogleGenAI({ apiKey });
  }

  async start(character: Character, onTranscript: (text: string, isUser: boolean) => void) {
    this.isActive = true;
    // Initialize Audio Contexts
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.inputAudioContext = new AudioContextClass({ sampleRate: 16000 });
    this.outputAudioContext = new AudioContextClass({ sampleRate: 24000 });
    
    // Mic Stream
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const outputNode = this.outputAudioContext.createGain();
    outputNode.connect(this.outputAudioContext.destination);

    // Connect to Gemini Live
    this.sessionPromise = this.client.live.connect({
      model: MODEL_IDS.LIVE_AUDIO,
      config: {
        responseModalities: [Modality.AUDIO], // STRICTLY ONLY AUDIO
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: character.voiceName || 'Kore' } },
        },
        systemInstruction: `You are ${character.name}. ${character.description}. Roleplay naturally. Keep responses concise for a voice conversation.`,
        inputAudioTranscription: { model: "google-provided-model" }, // Enable Input Transcription
        outputAudioTranscription: { model: "google-provided-model" }  // Enable Output Transcription
      },
      callbacks: {
        onopen: () => {
          console.log("Live session connected");
          this.startAudioInput();
        },
        onmessage: async (message: LiveServerMessage) => {
           if (!this.isActive) return;

           // Transcriptions
           if (message.serverContent?.inputTranscription?.text) {
             onTranscript(message.serverContent.inputTranscription.text, true);
           }
           if (message.serverContent?.outputTranscription?.text) {
             onTranscript(message.serverContent.outputTranscription.text, false);
           }

           // Audio Playback
           const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
           if (base64Audio && this.outputAudioContext) {
             const now = this.outputAudioContext.currentTime;
             this.nextStartTime = Math.max(this.nextStartTime, now);
             
             try {
               const audioBuffer = await this.decodeAudioData(
                 this.decodeBase64(base64Audio), 
                 this.outputAudioContext,
                 24000,
                 1
               );
               
               const source = this.outputAudioContext.createBufferSource();
               source.buffer = audioBuffer;
               source.connect(outputNode);
               source.start(this.nextStartTime);
               this.nextStartTime += audioBuffer.duration;
               
               source.onended = () => this.sources.delete(source);
               this.sources.add(source);
             } catch (e) {
               console.error("Error decoding audio chunk", e);
             }
           }
        },
        onclose: () => console.log("Session closed"),
        onerror: (err) => console.error("Session error", err)
      }
    });
  }

  private startAudioInput() {
    if (!this.inputAudioContext || !this.stream) return;
    
    const source = this.inputAudioContext.createMediaStreamSource(this.stream);
    this.scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptProcessor.onaudioprocess = (e) => {
      if (!this.isActive || !this.sessionPromise) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = this.createPcmBlob(inputData);
      
      this.sessionPromise.then(session => {
        session.sendRealtimeInput({ media: pcmBlob });
      }).catch(e => console.error("Send input failed", e));
    };

    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.inputAudioContext.destination);
  }

  stop() {
    this.isActive = false;
    this.stream?.getTracks().forEach(t => t.stop());
    this.scriptProcessor?.disconnect();
    this.inputAudioContext?.close();
    this.outputAudioContext?.close();
    this.sources.forEach(s => s.stop());
    this.sources.clear();
    
    // Try to close session gracefully
    this.sessionPromise?.then(session => {
        // Using type assertion as close might not be in type def explicitly depending on version but exists
        if((session as any).close) (session as any).close();
    });
  }

  // Helper for PCM 16-bit conversion
  private createPcmBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
      // Simple clipping and conversion
      let s = Math.max(-1, Math.min(1, data[i]));
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
    }
    return {
      data: this.encodeBase64(new Uint8Array(int16.buffer)),
      mimeType: 'audio/pcm;rate=16000'
    };
  }

  private encodeBase64(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  private async decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number) {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }
}
