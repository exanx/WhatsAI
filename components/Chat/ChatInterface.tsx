
import React, { useState, useRef, useEffect } from 'react';
import { Character, Message, MessageType, AppSettings } from '../../types';
import MessageBubble from './MessageBubble';
import { sendMessageToCharacter } from '../../services/geminiService';
import { Send, Phone, MoreVertical, Paperclip, Image as ImageIcon, Video, X, ArrowLeft, Trash2, UserCog } from 'lucide-react';

interface ChatInterfaceProps {
  character: Character;
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  settings: AppSettings;
  onStartCall: () => void;
  onBack: () => void;
  onClearChat: () => void;
  onEditCharacter: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ 
  character, 
  messages, 
  setMessages, 
  settings,
  onStartCall,
  onBack,
  onClearChat,
  onEditCharacter
}) => {
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [attachment, setAttachment] = useState<{data: string, mimeType: string, type: 'image'|'video'} | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, attachment]);

  // Close option menu on click outside
  useEffect(() => {
    const handleClick = () => setShowOptionsMenu(false);
    if (showOptionsMenu) window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [showOptionsMenu]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = (ev.target?.result as string).split(',')[1];
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setAttachment({
        data: base64,
        mimeType: file.type,
        type
      });
      setShowAttachMenu(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSend = async () => {
    if (!inputText.trim() && !attachment) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      senderId: 'user',
      content: inputText,
      type: MessageType.TEXT,
      timestamp: Date.now(),
      fileData: attachment ? { data: attachment.data, mimeType: attachment.mimeType } : undefined
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setAttachment(null);
    setIsTyping(true);
    setShowAttachMenu(false);

    // Create Bot Placeholder
    const botMsgId = (Date.now() + 1).toString();
    const initialBotMsg: Message = {
      id: botMsgId,
      senderId: character.id,
      content: '',
      type: MessageType.TEXT,
      timestamp: Date.now()
    };
    setMessages(prev => [...prev, initialBotMsg]);

    try {
      await sendMessageToCharacter(
        character,
        messages, 
        userMsg, 
        settings,
        (chunk, thinking, grounding) => {
          setMessages(prev => prev.map(m => {
            if (m.id === botMsgId) {
               return {
                 ...m,
                 content: m.content + (chunk || ''),
                 groundingMetadata: grounding || m.groundingMetadata
               };
            }
            return m;
          }));
        },
        (imgBase64) => {
          const imgMsg: Message = {
             id: Date.now().toString() + '_img',
             senderId: character.id,
             content: imgBase64,
             type: MessageType.IMAGE,
             timestamp: Date.now()
          };
          setMessages(prev => [...prev, imgMsg]);
        }
      );
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-[#efeae2] dark:bg-[#0b141a] relative transition-colors duration-200">
       {/* Wallpaper */}
       <div className="absolute inset-0 opacity-40 dark:opacity-5 pointer-events-none" 
            style={{ 
              backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
              backgroundRepeat: 'repeat',
              backgroundSize: '400px'
            }}>
       </div>

      {/* Header */}
      <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-2 md:px-4 z-20 shadow-sm shrink-0 transition-colors">
        <div className="flex items-center gap-2 cursor-pointer" onClick={onEditCharacter}>
          <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden p-2 text-[#54656f] dark:text-[#aebac1] hover:bg-gray-200 dark:hover:bg-[#374248] rounded-full">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-300 dark:border-gray-600 shrink-0">
            <img src={character.avatar} alt={character.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col justify-center min-w-0">
            <h2 className="text-[#111b21] dark:text-[#e9edef] font-medium leading-tight truncate max-w-[150px] md:max-w-xs">{character.name}</h2>
            <span className="text-[#667781] dark:text-[#8696a0] text-xs flex items-center gap-1 truncate">
              {settings.chatModel.includes('pro') ? 'Smart Mode' : 'Fast Mode'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 md:gap-5 text-[#54656f] dark:text-[#aebac1]">
           <button onClick={onStartCall} title="Voice Call" className="hover:bg-gray-200 dark:hover:bg-[#374248] p-2 rounded-full transition">
             <Phone className="w-5 h-5 md:w-6 md:h-6" />
           </button>
           
           <div className="relative">
             <button 
               onClick={(e) => {
                 e.stopPropagation();
                 setShowOptionsMenu(!showOptionsMenu);
               }}
               className="hover:bg-gray-200 dark:hover:bg-[#374248] p-2 rounded-full transition"
             >
                <MoreVertical className="w-5 h-5 md:w-6 md:h-6" />
             </button>
             
             {showOptionsMenu && (
               <div className="absolute right-0 top-10 bg-white dark:bg-[#233138] shadow-xl rounded-lg py-2 w-52 z-50 origin-top-right animate-in fade-in zoom-in-95 border dark:border-gray-700">
                 <button 
                   onClick={() => {
                     onEditCharacter();
                     setShowOptionsMenu(false);
                   }}
                   className="w-full text-left px-4 py-3 text-[#111b21] dark:text-[#e9edef] hover:bg-gray-100 dark:hover:bg-[#111b21] transition text-sm flex items-center gap-3"
                 >
                   <UserCog className="w-4 h-4" />
                   Edit contact
                 </button>
                 <button 
                   onClick={() => {
                     onClearChat();
                     setShowOptionsMenu(false);
                   }}
                   className="w-full text-left px-4 py-3 text-[#111b21] dark:text-[#e9edef] hover:bg-gray-100 dark:hover:bg-[#111b21] transition text-sm flex items-center gap-3"
                 >
                   <Trash2 className="w-4 h-4" />
                   Clear chat
                 </button>
               </div>
             )}
           </div>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-4 z-10 scrollbar-thin dark:scrollbar-thumb-gray-600 pb-20 md:pb-4">
        <div className="flex flex-col space-y-2 max-w-4xl mx-auto">
          {/* Encryption notice style placeholder */}
          <div className="flex justify-center mb-4">
            <div className="bg-[#ffeecd] dark:bg-[#182229] text-[#54656f] dark:text-[#f7f8fa] text-[11px] md:text-xs px-3 py-1.5 rounded-lg shadow-sm text-center max-w-[90%] border dark:border-none">
              Messages are generated by AI. Tap the phone icon to start a real-time voice call.
            </div>
          </div>

          {messages.map((msg) => (
            <MessageBubble 
              key={msg.id} 
              message={msg} 
              isMe={msg.senderId === 'user'} 
              characterVoice={character.voiceName}
            />
          ))}
          {isTyping && (
             <div className="ml-2 mb-2 p-3 bg-white dark:bg-[#202c33] rounded-lg rounded-tl-none inline-block shadow-sm w-fit">
               <div className="flex gap-1">
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0s'}}></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></div>
                 <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.4s'}}></div>
               </div>
             </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-[#f0f2f5] dark:bg-[#202c33] px-2 md:px-4 py-2 z-20 shrink-0 pb-safe md:pb-2 transition-colors">
         {/* Attachment Preview */}
         {attachment && (
           <div className="flex items-center gap-4 bg-white dark:bg-[#2a3942] p-2 rounded-t-lg border-b border-gray-100 dark:border-gray-600 mx-1 animate-in slide-in-from-bottom-2">
              <div className="w-14 h-14 rounded overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                 {attachment.type === 'image' ? (
                   <img src={`data:${attachment.mimeType};base64,${attachment.data}`} className="w-full h-full object-cover" />
                 ) : (
                   <Video className="w-full h-full p-3 text-gray-500"/>
                 )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">Ready to send</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{attachment.mimeType}</p>
              </div>
              <button onClick={() => setAttachment(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"><X className="w-5 h-5 text-gray-500 dark:text-gray-400"/></button>
           </div>
         )}

         {/* Controls */}
         <div className="flex items-end gap-2 py-1">
           {/* Attach Menu */}
           <div className="relative mb-1">
              <button onClick={() => setShowAttachMenu(!showAttachMenu)} className="p-3 text-[#54656f] dark:text-[#8696a0] hover:bg-gray-200 dark:hover:bg-[#374248] rounded-full transition active:bg-gray-300">
                <Paperclip className="w-6 h-6" />
              </button>
              {showAttachMenu && (
                <>
                <div className="fixed inset-0 z-30" onClick={() => setShowAttachMenu(false)}></div>
                <div className="absolute bottom-14 left-0 bg-white dark:bg-[#233138] rounded-xl shadow-xl p-2 flex flex-col gap-2 min-w-[180px] animate-in zoom-in-95 origin-bottom-left z-40 mb-2">
                   <label className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#111b21] rounded-lg cursor-pointer transition">
                     <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-full"><ImageIcon className="w-5 h-5 text-purple-600 dark:text-purple-300" /></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Photos & Images</span>
                     <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileSelect} />
                   </label>
                   <label className="flex items-center gap-3 p-3 hover:bg-gray-100 dark:hover:bg-[#111b21] rounded-lg cursor-pointer transition">
                     <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full"><Video className="w-5 h-5 text-red-600 dark:text-red-300" /></div>
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Videos</span>
                     <input type="file" accept="video/*" className="hidden" onChange={handleFileSelect} />
                   </label>
                </div>
                </>
              )}
           </div>

           {/* Text Input */}
           <div className="flex-1 bg-white dark:bg-[#2a3942] rounded-2xl shadow-sm border-white dark:border-[#2a3942] border focus-within:border-white min-h-[45px] flex items-center px-4 py-2 my-1">
             <input 
               type="text" 
               placeholder="Type a message"
               className="w-full outline-none text-[#111b21] dark:text-[#e9edef] bg-transparent text-[15px] placeholder-gray-500 dark:placeholder-gray-400"
               value={inputText}
               onChange={(e) => setInputText(e.target.value)}
               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
             />
           </div>
           
           {/* Send Button */}
           <button 
             onClick={handleSend} 
             disabled={!inputText.trim() && !attachment}
             className={`p-3 rounded-full transition mb-1 ${(!inputText.trim() && !attachment) ? 'text-gray-400 bg-transparent' : 'text-white bg-[#008069] hover:bg-[#017561] shadow-md'}`}
           >
             <Send className="w-5 h-5" />
           </button>
         </div>
      </div>
    </div>
  );
};

export default ChatInterface;
