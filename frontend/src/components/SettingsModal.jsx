import React, { useState } from 'react';
import GlassCard from './UI/GlassCard';
import Button from './UI/Button';
import { useTheme } from '../hooks/useTheme';

export default function SettingsModal({ isOpen, onClose, initialTab = 'general', session, usageStats }) {
  if (!isOpen) return null;
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState(initialTab);

  // Tabs config
  const tabs = [
    { id: 'profile', label: 'My Profile', icon: '👤', hidden: !session },
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'chat', label: 'Chat', icon: '💬' },
    { id: 'data', label: 'Data', icon: '🛡️' }
  ].filter(t => !t.hidden);
  
  // Safe stats
  const count = usageStats?.promptCount || 0;
  const max = session ? 8 : 5;
  const progress = Math.min((count / max) * 100, 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <GlassCard className="w-full max-w-2xl min-h-[500px] flex overflow-hidden m-4 p-0">
        
        {/* Sidebar */}
        <div className="w-1/3 border-r border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-white/5 p-4 flex flex-col gap-2">
            <h2 className="text-xl font-bold px-2 mb-4 text-slate-800 dark:text-white">Settings</h2>
            {tabs.map((tab) => (
                <div 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${
                        activeTab === tab.id 
                        ? 'bg-indigo-500 text-white shadow-md' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-white/5'
                    }`}
                >
                    <span>{tab.icon}</span>
                    <span className="font-medium text-sm">{tab.label}</span>
                </div>
            ))}
        </div>

        {/* Content */}
        <div className="flex-1 p-8 bg-white/50 dark:bg-transparent relative">
            <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
            >
                ✕
            </button>

            {/* PROFILE TAB */}
            {activeTab === 'profile' && session && (
                 <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">My Profile</h3>
                    
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 overflow-hidden shadow-lg">
                             {session.user?.user_metadata?.avatar_url ? (
                                 <img src={session.user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                             ) : (
                                 <div className="w-full h-full bg-indigo-500 text-white flex items-center justify-center text-xl font-bold">
                                     {session.user.email?.[0].toUpperCase()}
                                 </div>
                             )}
                        </div>
                        <div>
                            <div className="text-xl font-bold text-slate-900 dark:text-white">{session.user.user_metadata?.full_name || 'User'}</div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">{session.user.email}</div>
                            <div className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 uppercase tracking-wide">
                                {usageStats?.isPremium ? 'PRO Account' : 'Free Plan'}
                            </div>
                        </div>
                    </div>

                    <div className="bg-white/50 dark:bg-white/5 rounded-xl p-4 border border-gray-200 dark:border-white/5">
                        <div className="flex justify-between text-sm font-medium mb-2 text-slate-700 dark:text-slate-300">
                             <span>Monthly Usage</span>
                             <span>{count} / {max} Prompts</span>
                        </div>
                        <div className="h-2 w-full bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                             <div className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-1000 ease-out" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-2 text-right">Resets daily</p>
                    </div>

                    <Button className="w-full justify-center bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-lg hover:shadow-xl mt-4">
                        Manage Subscription
                    </Button>
                 </div>
            )}

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">App Preferences</h3>
                    
                    {/* Theme Toggle */}
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium text-slate-700 dark:text-slate-200">Appearance</div>
                            <div className="text-xs text-slate-500 dark:text-slate-400">Switch between Light and Dark themes</div>
                        </div>
                        <div className="flex bg-gray-200 dark:bg-white/10 p-1 rounded-full cursor-pointer" onClick={toggleTheme}>
                             <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${theme === 'light' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Light</div>
                             <div className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${theme === 'dark' ? 'bg-indigo-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Dark</div>
                        </div>
                    </div>
                </div>
            )}

            {/* CHAT TAB */}
            {activeTab === 'chat' && (
                <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Chat Experience</h3>
                    
                     {/* System Prompt */}
                     <div>
                        <div className="flex justify-between mb-2">
                             <div className="font-medium text-slate-700 dark:text-slate-200">System Instructions</div>
                             <div className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Defines AI Personality</div>
                        </div>
                        <textarea 
                            className="w-full h-24 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-3 text-sm text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none"
                            placeholder="e.g., You are a helpful assistant. Be concise."
                            value={localStorage.getItem('systemPrompt') || ''}
                            onChange={(e) => {
                                localStorage.setItem('systemPrompt', e.target.value);
                                // Force re-render isn't ideal but works for simple local storage sync
                                // Better: hoist state or use context. For now, this is quick.
                            }}
                        />
                        <p className="text-[10px] text-slate-500 mt-2">These instructions will be sent with every message to guide the AI's behavior.</p>
                     </div>

                     {/* Temperature Slider */}
                     <div>
                        <div className="flex justify-between mb-2">
                            <span className="font-medium text-slate-700 dark:text-slate-200">Creativity (Temperature)</span>
                            <span className="text-xs font-mono bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded">0.7</span>
                        </div>
                        <input type="range" min="0" max="1" step="0.1" className="w-full accent-indigo-500 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer" />
                        <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                            <span>Precise</span>
                            <span>Balanced</span>
                            <span>Creative</span>
                        </div>
                    </div>
                </div>
            )}

             {/* DATA TAB */}
             {activeTab === 'data' && (
                <div className="space-y-6 animate-fadeIn">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white border-b border-gray-200 dark:border-white/10 pb-2">Data Management</h3>
                    
                    <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl">
                        <h4 className="font-bold text-red-600 dark:text-red-400 mb-1">Clear All Data</h4>
                        <p className="text-xs text-red-500/80 mb-4">This will delete all local chat history and settings. This action cannot be undone.</p>
                        <Button className="bg-red-500 hover:bg-red-600 text-white border-none shadow-none text-xs w-full justify-center">
                            Delete Everything
                        </Button>
                    </div>
                </div>
            )}

        </div>
      </GlassCard>
    </div>
  );
}
