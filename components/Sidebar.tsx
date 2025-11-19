
import React from 'react';
import { Character, UserProfile } from '../types';
import { MessageSquarePlus, Settings } from 'lucide-react';

interface SidebarProps {
  characters: Character[];
  userProfile: UserProfile;
  activeCharacterId: string | null;
  onSelectCharacter: (id: string) => void;
  onAddNew: () => void;
  onOpenSettings: () => void;
  onOpenProfile: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  characters, 
  userProfile,
  activeCharacterId, 
  onSelectCharacter, 
  onAddNew,
  onOpenSettings,
  onOpenProfile
}) => {
  return (
    <div className="flex flex-col h-full w-full">
      {/* Header */}
      <div className="h-16 bg-[#f0f2f5] dark:bg-[#202c33] flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 shrink-0 transition-colors">
        <button onClick={onOpenProfile} className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden border border-gray-200 dark:border-gray-600 focus:outline-none hover:opacity-80 transition">
           <img src={userProfile.avatar} alt="User" className="w-full h-full object-cover" />
        </button>
        <div className="flex gap-5 text-[#54656f] dark:text-[#aebac1]">
          <button onClick={onAddNew} title="New Chat" className="hover:bg-gray-200 dark:hover:bg-[#374248] p-2 rounded-full transition">
            <MessageSquarePlus className="w-6 h-6" />
          </button>
          <button onClick={onOpenSettings} title="Settings" className="hover:bg-gray-200 dark:hover:bg-[#374248] p-2 rounded-full transition">
            <Settings className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Search (Visual only) */}
      <div className="p-3 border-b border-gray-100 dark:border-gray-800 bg-white dark:bg-[#111b21] transition-colors">
        <div className="bg-[#f0f2f5] dark:bg-[#202c33] rounded-lg px-4 py-2 flex items-center h-10">
          <span className="text-[#54656f] dark:text-[#aebac1] text-sm pl-2">Search or start new chat</span>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin dark:scrollbar-thumb-gray-600">
        {characters.map((char) => (
          <div 
            key={char.id}
            onClick={() => onSelectCharacter(char.id)}
            className={`flex items-center px-4 py-3 cursor-pointer hover:bg-[#f5f6f6] dark:hover:bg-[#202c33] transition-colors active:bg-[#e9edef] dark:active:bg-[#2a3942] ${activeCharacterId === char.id ? 'bg-[#f0f2f5] dark:bg-[#2a3942]' : ''}`}
          >
            <div className="w-12 h-12 rounded-full overflow-hidden mr-3 shrink-0 border border-gray-100 dark:border-gray-700">
              <img src={char.avatar} alt={char.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 border-b border-gray-100 dark:border-gray-800 pb-3 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-[#111b21] dark:text-[#e9edef] text-[17px] font-normal truncate">{char.name}</h3>
                <span className="text-[#667781] dark:text-[#8696a0] text-xs">12:30 PM</span>
              </div>
              <p className="text-[#667781] dark:text-[#8696a0] text-[14px] truncate flex items-center">
                {char.role}
              </p>
            </div>
          </div>
        ))}
        
        {characters.length === 0 && (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <p className="text-gray-500 dark:text-gray-400 mb-4">No chats yet.</p>
            <button 
              onClick={onAddNew} 
              className="bg-[#008069] text-white px-6 py-2 rounded-full font-medium hover:bg-[#017561] transition shadow-sm"
            >
              Start a new chat
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Sidebar;
