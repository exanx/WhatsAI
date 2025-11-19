import React, { useEffect, useState, useRef } from 'react';
import { Character } from '../types';
import { LiveVoiceSession } from '../services/liveService';
import { PhoneOff, Mic, MicOff, Volume2 } from 'lucide-react';

interface VoiceCallModalProps {
  character: Character;
  onEndCall: () => void;
}

const VoiceCallModal: React.FC<VoiceCallModalProps> = ({ character, onEndCall }) => {
  const [status, setStatus] = useState('Connecting...');
  const [transcript, setTranscript] = useState<{text: string, isUser: boolean}[]>([]);
  const sessionRef = useRef<LiveVoiceSession | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const startSession = async () => {
      try {
        const session = new LiveVoiceSession(process.env.API_KEY || '');
        sessionRef.current = session;
        
        await session.start(character, (text, isUser) => {
           setTranscript(prev => {
             const last = prev[prev.length - 1];
             // Simple logic to append to last if same speaker to reduce clutter, 
             // but here we just append new lines for simplicity in streaming
             if (last && last.isUser === isUser) {
                // Replace last if it seems like a stream update (simple heuristic)
                // Real implementation might need ID matching
                return [...prev.slice(0, -1), { text: prev[prev.length -1].text + " " + text, isUser }];
             }
             return [...prev, { text, isUser }];
           });
        });
        setStatus('Connected');
      } catch (e) {
        console.error(e);
        setStatus('Connection Failed');
      }
    };

    startSession();

    return () => {
      sessionRef.current?.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
     if (transcriptEndRef.current) {
       transcriptEndRef.current.scrollIntoView({ behavior: 'smooth' });
     }
  }, [transcript]);

  const handleHangup = () => {
    sessionRef.current?.stop();
    onEndCall();
  };

  return (
    <div className="fixed inset-0 bg-[#0b141a] z-50 flex flex-col items-center justify-between py-12 text-white">
      
      {/* Header Info */}
      <div className="flex flex-col items-center gap-4 mt-8">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[#25d366] shadow-lg animate-pulse">
           <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-semibold">{character.name}</h2>
          <p className="text-[#8696a0] mt-2 text-lg">{status}</p>
        </div>
      </div>

      {/* Live Transcription (Optional but cool) */}
      <div className="w-full max-w-md h-48 overflow-y-auto px-6 text-center text-sm text-gray-400 mask-image-gradient">
        {transcript.map((t, i) => (
          <p key={i} className={t.isUser ? "text-gray-500" : "text-white font-medium"}>
            {t.text}
          </p>
        ))}
        <div ref={transcriptEndRef} />
      </div>

      {/* Controls */}
      <div className="bg-[#1f2c34] rounded-full px-8 py-4 flex gap-8 items-center mb-8">
        <button className="p-4 rounded-full bg-[#233138] hover:bg-[#374248] transition">
          <Volume2 className="w-6 h-6 text-white" />
        </button>
        <button className="p-4 rounded-full bg-[#233138] hover:bg-[#374248] transition">
          <Mic className="w-6 h-6 text-white" />
        </button>
        <button 
          onClick={handleHangup}
          className="p-4 rounded-full bg-[#ea0038] hover:bg-[#f04269] transition shadow-lg transform hover:scale-105"
        >
          <PhoneOff className="w-8 h-8 text-white fill-white" />
        </button>
      </div>
    </div>
  );
};

export default VoiceCallModal;
