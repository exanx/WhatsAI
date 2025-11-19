
import React, { useState, useRef } from 'react';
import { UserProfile } from '../types';
import { X, Camera, User, ArrowLeft } from 'lucide-react';

interface ProfileModalProps {
  profile: UserProfile;
  onSave: (profile: UserProfile) => void;
  onClose: () => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ profile, onSave, onClose }) => {
  const [name, setName] = useState(profile.name);
  const [about, setAbout] = useState(profile.about);
  const [avatar, setAvatar] = useState(profile.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setAvatar(ev.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, about, avatar });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 md:p-4 animate-in fade-in">
      {/* Added md:max-h-[85vh] for desktop fitting */}
      <div className="bg-white dark:bg-[#222e35] w-full h-[90dvh] md:h-auto md:max-h-[85vh] md:max-w-md md:rounded-lg rounded-t-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="bg-[#008069] dark:bg-[#00a884] p-4 text-white flex items-center gap-3 shrink-0 shadow-md">
          <button onClick={onClose} className="md:hidden"><ArrowLeft /></button>
          <h2 className="text-xl font-semibold flex-1">Profile</h2>
          <button onClick={onClose} className="hidden md:block hover:bg-[#017561] dark:hover:bg-[#008f6f] p-1 rounded"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 flex flex-col items-center scrollbar-thin dark:scrollbar-thumb-gray-600">
          
          {/* Avatar Upload */}
          <div className="relative mb-8 group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-gray-200 dark:border-gray-700 shadow-sm">
              <img src={avatar} alt="Profile" className="w-full h-full object-cover" />
            </div>
            <div className="absolute inset-0 bg-black bg-opacity-30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-10 h-10 text-white" />
            </div>
            <div className="absolute bottom-2 right-2 bg-[#008069] p-3 rounded-full shadow-lg text-white">
              <Camera className="w-5 h-5" />
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              accept="image/*" 
              className="hidden" 
              onChange={handleFileChange} 
            />
          </div>

          <div className="w-full space-y-6">
            {/* Name Field */}
            <div>
              <label className="text-xs font-bold text-[#008069] dark:text-[#00a884] mb-2 block">Your Name</label>
              <div className="flex items-center border-b-2 border-gray-200 dark:border-gray-600 py-2">
                <input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#111b21] dark:text-[#e9edef] text-lg"
                  placeholder="Enter your name"
                  maxLength={25}
                />
                <User className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">This is not your username or pin. This name will be visible to your AI contacts.</p>
            </div>

            {/* About Field */}
            <div>
              <label className="text-xs font-bold text-[#008069] dark:text-[#00a884] mb-2 block">About</label>
              <div className="flex items-center border-b-2 border-gray-200 dark:border-gray-600 py-2">
                <input 
                  type="text" 
                  value={about} 
                  onChange={(e) => setAbout(e.target.value)}
                  className="w-full bg-transparent outline-none text-[#111b21] dark:text-[#e9edef] text-lg"
                  placeholder="About"
                />
              </div>
            </div>
          </div>

          <div className="flex-1" />
          
          <button 
            type="submit"
            className="w-full bg-[#008069] hover:bg-[#017561] dark:bg-[#00a884] dark:hover:bg-[#008f6f] text-white py-3 rounded-lg font-bold shadow-md mt-8 transition"
          >
            Save Profile
          </button>

        </form>
      </div>
    </div>
  );
};

export default ProfileModal;
