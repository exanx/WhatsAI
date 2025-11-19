
import React from 'react';
import { AppSettings, ChatModel } from '../types';
import { X, Zap, Brain, Sparkles, LayoutTemplate, ArrowLeft } from 'lucide-react';

interface SettingsModalProps {
  settings: AppSettings;
  onUpdate: (s: AppSettings) => void;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ settings, onUpdate, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-end md:items-center justify-center z-50 md:p-4 animate-in fade-in">
      {/* Added md:max-h-[85vh] to fit screen on desktop */}
      <div className="bg-white dark:bg-[#222e35] w-full h-[85dvh] md:h-auto md:max-h-[85vh] md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl flex flex-col overflow-hidden transition-colors">
        
        <div className="bg-[#008069] dark:bg-[#00a884] p-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <button onClick={onClose} className="md:hidden"><ArrowLeft /></button>
             <h2 className="text-xl font-semibold">Settings</h2>
          </div>
          <button onClick={onClose} className="hidden md:block hover:bg-[#017561] dark:hover:bg-[#008f6f] p-1 rounded"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-6 space-y-8 overflow-y-auto flex-1 pb-safe scrollbar-thin dark:scrollbar-thumb-gray-600">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between bg-gray-50 dark:bg-[#111b21] p-3 rounded-lg border border-gray-100 dark:border-gray-700">
             <span className="text-sm font-bold text-gray-700 dark:text-gray-200">Dark Mode</span>
             <div className="relative inline-block w-12 align-middle select-none transition duration-200 ease-in">
                <input 
                  type="checkbox" 
                  checked={settings.theme === 'dark'}
                  onChange={(e) => onUpdate({...settings, theme: e.target.checked ? 'dark' : 'light'})}
                  id="theme-toggle"
                  className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-[#008069] dark:checked:border-[#00a884]"
                  style={{right: settings.theme === 'dark' ? '0' : '50%', borderColor: settings.theme === 'dark' ? (settings.theme === 'dark' ? '#00a884' : '#008069') : '#e5e7eb'}}
                />
                <label htmlFor="theme-toggle" className={`block overflow-hidden h-6 rounded-full cursor-pointer ${settings.theme === 'dark' ? 'bg-[#008069] dark:bg-[#00a884]' : 'bg-gray-300'}`}></label>
             </div>
          </div>

          {/* Chat Model Selection */}
          <div className="space-y-4">
            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Intelligence Model</label>
            
            <button 
              onClick={() => onUpdate({...settings, chatModel: ChatModel.SMART_PRO})}
              className={`w-full flex items-start p-4 rounded-xl border-2 transition-all text-left ${settings.chatModel === ChatModel.SMART_PRO ? 'border-[#008069] dark:border-[#00a884] bg-green-50 dark:bg-[#1c2c28] shadow-sm ring-1 ring-[#008069] dark:ring-[#00a884]' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#111b21]'}`}
            >
              <Brain className={`w-6 h-6 mt-1 mr-4 shrink-0 ${settings.chatModel === ChatModel.SMART_PRO ? 'text-[#008069] dark:text-[#00a884]' : 'text-gray-400'}`} />
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">Smart (Pro 3.0)</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 leading-tight">Best for reasoning, coding, video analysis & complex tasks. Slower but smarter.</div>
              </div>
            </button>

            <button 
              onClick={() => onUpdate({...settings, chatModel: ChatModel.FAST_LITE})}
              className={`w-full flex items-start p-4 rounded-xl border-2 transition-all text-left ${settings.chatModel === ChatModel.FAST_LITE ? 'border-[#008069] dark:border-[#00a884] bg-green-50 dark:bg-[#1c2c28] shadow-sm ring-1 ring-[#008069] dark:ring-[#00a884]' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#111b21]'}`}
            >
              <Zap className={`w-6 h-6 mt-1 mr-4 shrink-0 ${settings.chatModel === ChatModel.FAST_LITE ? 'text-[#008069] dark:text-[#00a884]' : 'text-gray-400'}`} />
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">Fast (Flash Lite)</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 leading-tight">Lightning fast responses. Ideal for casual chat and quick answers.</div>
              </div>
            </button>

            <button 
              onClick={() => onUpdate({...settings, chatModel: ChatModel.STANDARD_FLASH})}
              className={`w-full flex items-start p-4 rounded-xl border-2 transition-all text-left ${settings.chatModel === ChatModel.STANDARD_FLASH ? 'border-[#008069] dark:border-[#00a884] bg-green-50 dark:bg-[#1c2c28] shadow-sm ring-1 ring-[#008069] dark:ring-[#00a884]' : 'border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#111b21]'}`}
            >
              <Sparkles className={`w-6 h-6 mt-1 mr-4 shrink-0 ${settings.chatModel === ChatModel.STANDARD_FLASH ? 'text-[#008069] dark:text-[#00a884]' : 'text-gray-400'}`} />
              <div>
                <div className="font-bold text-gray-900 dark:text-gray-100 text-base mb-1">Balanced (Flash 2.5)</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 leading-tight">Good balance of speed and intelligence.</div>
              </div>
            </button>
          </div>

          {/* Advanced Toggles */}
          <div className="space-y-5 pt-2">
             <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">Advanced Features</label>

             <div className="flex items-center justify-between p-2">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg"><Sparkles className="w-5 h-5 text-blue-600 dark:text-blue-300" /></div>
                 <div>
                   <div className="text-gray-900 dark:text-gray-100 font-medium">Thinking Mode</div>
                   <div className="text-xs text-gray-500 dark:text-gray-400">Show AI thought process (Pro only)</div>
                 </div>
               </div>
               <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    name="toggle" 
                    id="toggle-thinking" 
                    checked={settings.enableThinking}
                    onChange={(e) => onUpdate({...settings, enableThinking: e.target.checked})}
                    disabled={settings.chatModel !== ChatModel.SMART_PRO}
                    className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer checked:right-0 right-6 checked:border-[#008069] dark:checked:border-[#00a884]"
                    style={{right: settings.enableThinking ? '0' : '50%', borderColor: settings.enableThinking ? (settings.theme === 'dark' ? '#00a884' : '#008069') : '#e5e7eb'}}
                  />
                  <label htmlFor="toggle-thinking" className={`toggle-label block overflow-hidden h-6 rounded-full cursor-pointer ${settings.enableThinking ? 'bg-[#008069] dark:bg-[#00a884]' : 'bg-gray-300'}`}></label>
               </div>
             </div>

             <div className="flex items-center justify-between p-2">
               <div className="flex items-center gap-3">
                 <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg"><span className="text-xl leading-none">🌍</span></div>
                 <div>
                   <div className="text-gray-900 dark:text-gray-100 font-medium">Search Grounding</div>
                   <div className="text-xs text-gray-500 dark:text-gray-400">Access real-time Google Search data</div>
                 </div>
               </div>
               <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                  <input 
                    type="checkbox" 
                    id="toggle-search" 
                    checked={settings.enableSearchGrounding}
                    onChange={(e) => onUpdate({...settings, enableSearchGrounding: e.target.checked})}
                    className="absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"
                    style={{right: settings.enableSearchGrounding ? '0' : '50%', borderColor: settings.enableSearchGrounding ? (settings.theme === 'dark' ? '#00a884' : '#008069') : '#e5e7eb'}}
                  />
                  <label htmlFor="toggle-search" className={`block overflow-hidden h-6 rounded-full cursor-pointer ${settings.enableSearchGrounding ? 'bg-[#008069] dark:bg-[#00a884]' : 'bg-gray-300'}`}></label>
               </div>
             </div>
          </div>

          {/* Image Settings */}
          <div className="space-y-3 pt-2">
             <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider block flex items-center gap-2"><LayoutTemplate className="w-4 h-4"/> Generated Image Aspect Ratio</label>
             <div className="grid grid-cols-3 gap-3">
               {['1:1', '3:4', '16:9'].map(ratio => (
                 <button 
                   key={ratio}
                   onClick={() => onUpdate({...settings, imageAspectRatio: ratio as any})}
                   className={`px-2 py-3 rounded-lg text-sm font-medium border transition ${settings.imageAspectRatio === ratio ? 'bg-[#008069] dark:bg-[#00a884] text-white border-[#008069] dark:border-[#00a884] shadow-md' : 'text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-[#111b21]'}`}
                 >
                   {ratio}
                 </button>
               ))}
             </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
