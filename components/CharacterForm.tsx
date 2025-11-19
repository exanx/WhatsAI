
import React, { useState, useRef } from 'react';
import { Character } from '../types';
import { generateProfileMagic, generateImage } from '../services/geminiService';
import { Sparkles, Loader2, X, User, Mic, ArrowLeft, Camera, RefreshCw, AlertCircle, Palette } from 'lucide-react';

interface CharacterFormProps {
  initialData?: Character | null;
  onSave: (character: Character) => void;
  onCancel: () => void;
}

const IMAGE_STYLES: Record<string, { label: string; prompt: string }> = {
  realistic: { label: 'Realistic Photo', prompt: ', photorealistic, raw photo, 8k uhd, dslr, soft lighting, realistic portrait, highly detailed' },
  anime: { label: 'Anime Style', prompt: ', anime style, key visual, vibrant, studio anime, highly detailed, 2d, cel shaded' },
  render: { label: '3D Render', prompt: ', 3d render, cgi, cute, pixar style, disney style, octane render, 8k, smooth lighting' },
  painting: { label: 'Oil Painting', prompt: ', oil painting, classic art, textured, masterpiece, detailed brushstrokes' }
};

const CharacterForm: React.FC<CharacterFormProps> = ({ initialData, onSave, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageStyle, setImageStyle] = useState('realistic');
  const [magicDesc, setMagicDesc] = useState('');
  const [formData, setFormData] = useState<Partial<Character>>(initialData || {
    name: '', age: '', gender: '', language: 'English', role: '', appearance: '', persona: '',
    avatar: ''
  });
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleMagic = async () => {
    if (!magicDesc) return;
    setLoading(true);
    try {
      // 1. Generate Profile Text
      const profile = await generateProfileMagic(magicDesc);
      setFormData(prev => ({ ...prev, ...profile }));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateImage = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!formData.appearance) return;
    
    setImageLoading(true);
    setImageError(null);
    try {
      const stylePrompt = IMAGE_STYLES[imageStyle].prompt;
      const finalPrompt = formData.appearance + stylePrompt;
      
      const imageBase64 = await generateImage(finalPrompt, '1:1');
      setFormData(prev => ({ ...prev, avatar: `data:image/jpeg;base64,${imageBase64}` }));
    } catch (e: any) {
      console.error("Image generation failed", e);
      setImageError("Failed to generate image. The prompt might be blocked or the service is busy.");
    } finally {
      setImageLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (ev.target?.result) {
        setFormData(prev => ({ ...prev, avatar: ev.target.result as string }));
        setImageError(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const newChar: Character = {
      id: initialData?.id || Date.now().toString(),
      name: formData.name!,
      age: formData.age || 'Unknown',
      gender: formData.gender || 'Unknown',
      language: formData.language || 'English',
      role: formData.role || 'Chat',
      description: magicDesc || formData.description || '',
      persona: formData.persona || 'Friendly and helpful.',
      appearance: formData.appearance || 'A person',
      avatar: formData.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.name}`,
      systemInstruction: `You are ${formData.name}, a ${formData.age} year old ${formData.gender} ${formData.role}. 
      Your personality/persona is: ${formData.persona}. 
      ${formData.description}`,
      phoneNumber: initialData?.phoneNumber || '+1 (555) 000-0000',
      voiceName: formData.voiceName || 'Kore'
    };
    onSave(newChar);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end md:items-center justify-center z-50 md:p-4 animate-in fade-in duration-200">
      {/* Added max-h constraint for desktop to ensure it doesn't overflow screen */}
      <div className="bg-white dark:bg-[#222e35] w-full h-[95dvh] md:h-auto md:max-h-[85vh] md:max-w-lg md:rounded-lg rounded-t-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
        
        {/* Header */}
        <div className="p-4 bg-[#008069] dark:bg-[#00a884] text-white flex items-center gap-3 shadow-md shrink-0">
          <button onClick={onCancel} className="md:hidden"><ArrowLeft /></button>
          <h2 className="font-semibold text-lg flex-1">{initialData ? 'Edit Contact' : 'New AI Contact'}</h2>
          <button onClick={onCancel} className="hidden md:block hover:bg-[#017561] dark:hover:bg-[#008f6f] p-1 rounded"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin dark:scrollbar-thumb-gray-600">
          
          {/* Magic Generator */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-5 rounded-xl border border-indigo-100 dark:border-indigo-900/30 mb-8 shadow-sm">
            <label className="text-indigo-900 dark:text-indigo-300 text-sm font-bold flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Magic Generator
            </label>
            <p className="text-xs text-indigo-700 dark:text-indigo-300 mb-3">
              {initialData ? 'Refine details by describing changes (e.g. "Make them older and grumpier")' : 'Describe a character (e.g. "A grumpy cyberpunk detective") and let Gemini fill the details.'}
            </p>
            <div className="flex flex-col gap-3">
              <input 
                value={magicDesc} 
                onChange={e => setMagicDesc(e.target.value)}
                placeholder="Describe your character..." 
                className="w-full border border-indigo-200 dark:border-indigo-800 rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white dark:bg-[#111b21] text-gray-900 dark:text-gray-100 placeholder-indigo-300 dark:placeholder-indigo-700"
              />
              <button 
                onClick={handleMagic} 
                disabled={loading || !magicDesc}
                className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                   <span className="flex items-center gap-2">
                     <Loader2 className="animate-spin w-4 h-4" /> 
                     Dreaming up details...
                   </span>
                ) : (
                   <><Sparkles className="w-4 h-4"/> {initialData ? 'Update Details' : 'Auto-Fill Details'}</>
                )}
              </button>
            </div>
          </div>

          <form id="charForm" onSubmit={handleSubmit} className="space-y-5">
            
            {/* Avatar Section */}
            <div className="flex flex-col items-center gap-3 mb-6">
              <div 
                className={`w-28 h-28 rounded-full bg-gray-100 dark:bg-[#111b21] border-2 border-dashed flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-inner ${imageError ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => fileInputRef.current?.click()}
              >
                {imageLoading ? (
                   <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-[#202c33]">
                      <Loader2 className="w-8 h-8 text-[#008069] animate-spin" />
                   </div>
                ) : formData.avatar ? (
                   <img src={formData.avatar} className="w-full h-full object-cover" alt="Avatar" />
                ) : (
                   <div className="text-center">
                     <User className="w-8 h-8 text-gray-400 mx-auto mb-1" />
                     <span className="text-[10px] text-gray-400">Tap to Upload</span>
                   </div>
                )}
                
                {/* Hover Overlay */}
                {!imageLoading && (
                  <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                )}
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
              </div>
              
              {imageError && (
                <div className="text-red-500 text-xs text-center max-w-xs flex items-center justify-center gap-1">
                   <AlertCircle className="w-3 h-3"/> {imageError}
                </div>
              )}

              {/* Generate Image Controls */}
              {formData.appearance && (
                <div className="flex flex-col items-center gap-2 w-full">
                  <div className="flex items-center gap-2 bg-gray-100 dark:bg-[#111b21] p-1 rounded-lg">
                    {Object.entries(IMAGE_STYLES).map(([key, style]) => (
                       <button
                         key={key}
                         type="button"
                         onClick={() => setImageStyle(key)}
                         className={`text-[10px] px-2 py-1 rounded transition ${imageStyle === key ? 'bg-white dark:bg-[#202c33] text-[#008069] dark:text-[#00a884] shadow-sm font-medium' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400'}`}
                       >
                         {style.label}
                       </button>
                    ))}
                  </div>
                  <button 
                    type="button"
                    onClick={handleGenerateImage} 
                    disabled={imageLoading}
                    className="text-xs text-[#008069] dark:text-[#00a884] font-semibold hover:underline flex items-center gap-1"
                  >
                    {imageLoading ? <Loader2 className="w-3 h-3 animate-spin"/> : <RefreshCw className="w-3 h-3"/>}
                    Generate Avatar
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-1 block">Full Name</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border-b-2 border-gray-200 dark:border-gray-600 focus:border-[#008069] dark:focus:border-[#00a884] py-2 outline-none bg-transparent transition text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" placeholder="Character Full Name" />
              </div>

              {/* Age & Gender */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-1 block">Age</label>
                  <input value={formData.age} onChange={e => setFormData({...formData, age: e.target.value})} className="w-full border-b-2 border-gray-200 dark:border-gray-600 focus:border-[#008069] dark:focus:border-[#00a884] py-2 outline-none bg-transparent transition text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" placeholder="Age" />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-1 block">Gender</label>
                  <input value={formData.gender} onChange={e => setFormData({...formData, gender: e.target.value})} className="w-full border-b-2 border-gray-200 dark:border-gray-600 focus:border-[#008069] dark:focus:border-[#00a884] py-2 outline-none bg-transparent transition text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" placeholder="Gender" />
                </div>
              </div>
              
              {/* Role & Language */}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-1 block">Role / Job</label>
                    <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border-b-2 border-gray-200 dark:border-gray-600 focus:border-[#008069] dark:focus:border-[#00a884] py-2 outline-none bg-transparent transition text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" placeholder="Role" />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-1 block">Language</label>
                    <input value={formData.language} onChange={e => setFormData({...formData, language: e.target.value})} className="w-full border-b-2 border-gray-200 dark:border-gray-600 focus:border-[#008069] dark:focus:border-[#00a884] py-2 outline-none bg-transparent transition text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" placeholder="English" />
                 </div>
              </div>

              {/* Persona */}
              <div>
                <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-1 block">Persona / Personality</label>
                <textarea 
                  value={formData.persona} 
                  onChange={e => setFormData({...formData, persona: e.target.value})} 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#008069] dark:focus:ring-[#00a884] outline-none transition resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                  rows={2} 
                  placeholder="Detailed personality traits, behaviors, and mannerisms..."
                />
              </div>

              {/* Appearance */}
              <div>
                <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-1 block">Visual Appearance (Prompt)</label>
                <textarea 
                  value={formData.appearance} 
                  onChange={e => setFormData({...formData, appearance: e.target.value})} 
                  className="w-full border border-gray-200 dark:border-gray-600 rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#008069] dark:focus:ring-[#00a884] outline-none transition resize-none bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-600" 
                  rows={2} 
                  placeholder="Description used for image generation..."
                />
              </div>

              {/* Voice Selection */}
              <div>
                 <label className="text-xs font-bold text-gray-900 dark:text-gray-400 uppercase mb-2 block flex items-center gap-1"><Mic className="w-3 h-3"/> Voice</label>
                 <div className="flex flex-wrap gap-2">
                   {['Kore', 'Puck', 'Charon', 'Fenrir', 'Aoede'].map(v => (
                     <button 
                       type="button"
                       key={v}
                       onClick={() => setFormData({...formData, voiceName: v})}
                       className={`px-3 py-1 text-xs rounded-full border transition ${formData.voiceName === v ? 'bg-[#008069] dark:bg-[#00a884] text-white border-[#008069] dark:border-[#00a884]' : 'bg-white dark:bg-[#111b21] text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-[#202c33]'}`}
                     >
                       {v}
                     </button>
                   ))}
                 </div>
              </div>
            </div>
          </form>
        </div>

        <div className="p-4 border-t dark:border-gray-700 bg-gray-50 dark:bg-[#202c33] flex justify-end gap-3 shrink-0 pb-safe">
          <button onClick={onCancel} className="px-6 py-2.5 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-[#374248] rounded-lg transition">Cancel</button>
          <button type="submit" form="charForm" className="px-6 py-2.5 bg-[#008069] hover:bg-[#017561] dark:bg-[#00a884] dark:hover:bg-[#008f6f] text-white rounded-lg font-medium shadow-md transition flex items-center gap-2">
            {initialData ? 'Save Changes' : 'Create Character'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CharacterForm;
