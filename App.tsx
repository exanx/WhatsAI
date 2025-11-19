
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/Chat/ChatInterface';
import CharacterForm from './components/CharacterForm';
import VoiceCallModal from './components/VoiceCallModal';
import SettingsModal from './components/SettingsModal';
import ProfileModal from './components/ProfileModal';
import { INITIAL_CHARACTERS, DEFAULT_SETTINGS, DEFAULT_USER_PROFILE } from './constants';
import { Character, Message, AppSettings, UserProfile } from './types';

const App: React.FC = () => {
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem('whatsai_chars');
      return saved ? JSON.parse(saved) : INITIAL_CHARACTERS;
    } catch { return INITIAL_CHARACTERS; }
  });
  
  const [messages, setMessages] = useState<Record<string, Message[]>>(() => {
    try {
      const saved = localStorage.getItem('whatsai_msgs');
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
     try {
       const saved = localStorage.getItem('whatsai_settings');
       return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
     } catch { return DEFAULT_SETTINGS; }
  });

  const [userProfile, setUserProfile] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem('whatsai_profile');
      return saved ? JSON.parse(saved) : DEFAULT_USER_PROFILE;
    } catch { return DEFAULT_USER_PROFILE; }
  });

  const [activeCharId, setActiveCharId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState<Character | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Resize State
  const [sidebarWidth, setSidebarWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth >= 768);

  // Theme Effect
  useEffect(() => {
    if (settings.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.theme]);

  // Persistence
  useEffect(() => {
    localStorage.setItem('whatsai_chars', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    localStorage.setItem('whatsai_msgs', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('whatsai_settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('whatsai_profile', JSON.stringify(userProfile));
  }, [userProfile]);

  // Desktop/Mobile Detection
  useEffect(() => {
    const handleResizeWindow = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', handleResizeWindow);
    return () => window.removeEventListener('resize', handleResizeWindow);
  }, []);

  // Sidebar Resizing Logic
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      // Constraints: Min 280px, Max 50% of screen or 650px
      const maxWidth = Math.min(650, window.innerWidth * 0.5);
      const newWidth = Math.max(280, Math.min(maxWidth, e.clientX));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    };

    if (isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none'; // Prevent text selection
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  const activeCharacter = characters.find(c => c.id === activeCharId);

  const handleSaveCharacter = (char: Character) => {
    if (editingCharacter) {
       // Update existing
       setCharacters(prev => prev.map(c => c.id === char.id ? char : c));
    } else {
       // Add new
       setCharacters(prev => [...prev, char]);
       setActiveCharId(char.id);
    }
    setShowCreateForm(false);
    setEditingCharacter(null);
  };

  const handleEditRequest = () => {
    if (activeCharacter) {
      setEditingCharacter(activeCharacter);
      setShowCreateForm(true);
    }
  };

  const handleClearChat = () => {
    if (activeCharId) {
      setMessages(prev => ({
        ...prev,
        [activeCharId]: []
      }));
    }
  };

  return (
    <div className="flex h-dvh w-screen overflow-hidden bg-white dark:bg-[#111b21] relative transition-colors duration-200">
      {/* Main App Container - Full Screen */}
      <div className="flex w-full h-full">
        
        {/* Sidebar Column - Resizable on desktop, full width on mobile if no active chat */}
        <div 
          className={`${activeCharId ? 'hidden md:flex' : 'flex'} flex-col border-r border-gray-200 dark:border-gray-700 h-full bg-white dark:bg-[#111b21] z-20 transition-colors duration-200 relative shrink-0`}
          style={{ width: isDesktop ? `${sidebarWidth}px` : '100%' }}
        >
          <Sidebar 
            characters={characters}
            userProfile={userProfile}
            activeCharacterId={activeCharId}
            onSelectCharacter={setActiveCharId}
            onAddNew={() => { setEditingCharacter(null); setShowCreateForm(true); }}
            onOpenSettings={() => setShowSettings(true)}
            onOpenProfile={() => setShowProfile(true)}
          />
          
          {/* Resizer Handle (Desktop Only) */}
          <div 
             className="hidden md:block absolute top-0 right-0 w-1.5 h-full cursor-col-resize z-50 hover:bg-[#008069] transition-colors opacity-0 hover:opacity-100 active:opacity-100 active:bg-[#008069]"
             style={{ right: '-3px' }}
             onMouseDown={() => setIsResizing(true)}
          />
        </div>

        {/* Chat Area Column - Grows to fill remaining space on desktop, full width on mobile if active chat */}
        <div className={`${!activeCharId ? 'hidden md:flex' : 'flex'} flex-1 bg-[#efeae2] dark:bg-[#0b141a] relative flex-col h-full z-10 transition-colors duration-200 min-w-0`}>
          {activeCharacter ? (
            <ChatInterface 
              character={activeCharacter}
              messages={messages[activeCharacter.id] || []}
              setMessages={(newMsgs) => {
                 if (typeof newMsgs === 'function') {
                    setMessages(prev => ({...prev, [activeCharacter.id]: newMsgs(prev[activeCharacter.id] || [])}));
                 } else {
                    setMessages(prev => ({...prev, [activeCharacter.id]: newMsgs}));
                 }
              }}
              settings={settings}
              onStartCall={() => setIsCallActive(true)}
              onBack={() => setActiveCharId(null)}
              onClearChat={handleClearChat}
              onEditCharacter={handleEditRequest}
            />
          ) : (
            <div className="hidden md:flex w-full h-full flex-col items-center justify-center text-gray-500 dark:text-gray-400 border-b-[6px] border-[#25D366] bg-[#f0f2f5] dark:bg-[#222e35] transition-colors duration-200">
              <div className="mb-8 opacity-90 dark:opacity-80">
                 {/* Simple generic illustration placeholder */}
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-32 h-32 text-gray-300 dark:text-gray-500">
                   <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                 </svg>
              </div>
              <h1 className="text-3xl font-light text-[#41525d] dark:text-[#e9edef] mb-4">WhatsAI Web</h1>
              <p className="text-sm text-center max-w-md leading-6 text-[#667781] dark:text-[#8696a0]">
                Send and receive messages to your AI characters.<br/>
                Powered by Gemini 2.5 Flash, Pro 3.0 and Imagen.
              </p>
              <div className="mt-8 text-xs text-[#8696a0] flex items-center gap-2">
                <span className="w-3 h-3 bg-gray-400 rounded-full opacity-50"></span> End-to-end AI encrypted
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showCreateForm && (
        <CharacterForm 
          initialData={editingCharacter}
          onSave={handleSaveCharacter} 
          onCancel={() => { setShowCreateForm(false); setEditingCharacter(null); }} 
        />
      )}

      {showSettings && (
        <SettingsModal 
          settings={settings} 
          onUpdate={setSettings} 
          onClose={() => setShowSettings(false)} 
        />
      )}

      {showProfile && (
        <ProfileModal
          profile={userProfile}
          onSave={setUserProfile}
          onClose={() => setShowProfile(false)}
        />
      )}

      {isCallActive && activeCharacter && (
        <VoiceCallModal 
          character={activeCharacter} 
          onEndCall={() => setIsCallActive(false)} 
        />
      )}
    </div>
  );
};

export default App;
