import React, { useState } from 'react';
import { Message, MessageType } from '../../types';
import { CheckCheck, Volume2, Globe } from 'lucide-react';
import { generateSpeech } from '../../services/geminiService';

interface MessageBubbleProps {
  message: Message;
  isMe: boolean;
  characterVoice?: string;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isMe, characterVoice }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const formatTime = (ts: number) => {
    return new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleTTS = async () => {
    if (isPlaying || !message.content) return;
    setIsPlaying(true);
    try {
      const audioData = await generateSpeech(message.content, characterVoice);
      
      // Simple playback
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const binaryString = atob(audioData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
      
      const buffer = await audioCtx.decodeAudioData(bytes.buffer);
      const source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(audioCtx.destination);
      source.start(0);
      source.onended = () => setIsPlaying(false);
    } catch (e) {
      console.error("TTS Error", e);
      setIsPlaying(false);
    }
  };

  return (
    <div className={`flex w-full mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
      <div 
        className={`
          relative max-w-[85%] md:max-w-[65%] rounded-lg shadow-sm group
          ${isMe ? 'bg-[#d9fdd3] dark:bg-[#005c4b] rounded-tr-none' : 'bg-white dark:bg-[#202c33] rounded-tl-none'}
        `}
        style={{ minWidth: '100px' }}
      >
        {/* MEDIA DISPLAY (Images/Video Uploads) */}
        {message.fileData && (
          <div className="p-1 pb-0">
            {message.fileData.mimeType.startsWith('image/') ? (
              <img 
                src={`data:${message.fileData.mimeType};base64,${message.fileData.data}`}
                alt="Attachment"
                className="rounded-lg w-full h-auto max-h-[400px] object-cover"
              />
            ) : (
              <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 flex items-center justify-center text-gray-500 dark:text-gray-400">
                Video Attachment ({message.fileData.mimeType})
              </div>
            )}
          </div>
        )}

        {/* GENERATED IMAGES */}
        {message.type === MessageType.IMAGE && !message.fileData && (
           <div className="p-1 pb-0">
             <img 
               src={`data:image/jpeg;base64,${message.content}`} 
               alt="Generated"
               className="rounded-lg w-full h-auto max-h-[400px] object-cover"
             />
           </div>
        )}

        {/* TEXT CONTENT */}
        {message.type === MessageType.TEXT && (
          <div className="px-3 pt-2 pb-1 text-[#111b21] dark:text-[#e9edef] text-[15px] leading-relaxed whitespace-pre-wrap break-words">
            {message.content}
          </div>
        )}

        {/* GROUNDING SOURCES */}
        {message.groundingMetadata && message.groundingMetadata.length > 0 && (
          <div className="px-3 py-1 mt-1 bg-gray-50 dark:bg-[#182229] border-t border-gray-100 dark:border-gray-700 rounded-b-lg">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold flex items-center gap-1">
              <Globe className="w-3 h-3" /> Sources:
            </p>
            <div className="flex flex-wrap gap-2 mt-1">
              {message.groundingMetadata.slice(0, 3).map((g, idx) => (
                g.web?.uri && (
                  <a 
                    key={idx} 
                    href={g.web.uri} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[150px] block"
                  >
                    {g.web.title || new URL(g.web.uri).hostname}
                  </a>
                )
              ))}
            </div>
          </div>
        )}

        {/* FOOTER */}
        <div className="flex justify-between items-end px-2 pb-1 gap-2">
          {/* TTS Button (Left aligned in bubble) */}
          {!isMe && message.type === MessageType.TEXT && (
            <button 
              onClick={handleTTS}
              className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 ${isPlaying ? 'text-[#008069] dark:text-[#00a884]' : 'text-gray-400 dark:text-gray-500'}`}
              title="Read Aloud"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
          <div className="flex-1" />
          <div className="flex items-center gap-1">
             <span className="text-[11px] text-[#667781] dark:text-[#8696a0]">{formatTime(message.timestamp)}</span>
             {isMe && <CheckCheck className="w-4 h-4 text-[#53bdeb]" />}
          </div>
        </div>

        {/* Triangle Tail */}
        <div className={`absolute top-0 w-0 h-0 border-8 border-transparent ${isMe ? '-right-2 border-t-[#d9fdd3] dark:border-t-[#005c4b]' : '-left-2 border-t-white dark:border-t-[#202c33]'}`} />
      </div>
    </div>
  );
};

export default MessageBubble;