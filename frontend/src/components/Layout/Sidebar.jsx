import React from 'react';
import Button from '../UI/Button';

import { useTheme } from '../../hooks/useTheme';

export default function Sidebar({ onNewChat, onOpenSettings }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-[#0F1016] border-r border-gray-200 dark:border-white/5 h-screen pt-4 pb-6 px-4 transition-colors duration-300">
      <div className="mb-6 px-2 pt-4">
         <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-xl border border-indigo-500/10 mb-4">
            <h3 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">About Lumina</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
               Next-gen AI assistant designed for clarity and precision. Powered by Gemini.
            </p>
         </div>

         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 pt-2 mb-2 block">Menu</span>
         <div className="space-y-2">
             <Button onClick={onNewChat} variant="primary" className="w-full justify-center shadow-none bg-white/5 hover:bg-white/10 border border-white/5">
                + New Chat
             </Button>
             
         </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 px-2">
         <span className="text-xs font-bold text-slate-500 uppercase tracking-widest pl-2 mb-2 block">Recent Chats</span>
         <div className="flex items-center justify-center h-32 text-center">
            <div className="text-sm text-slate-500 italic px-4">
               Your chat history will be shown here
            </div>
         </div>
      </div>

      <div className="mt-auto px-2 border-t border-gray-200 dark:border-white/5 pt-4 space-y-1">
        <div className="flex items-center gap-3 text-red-500/80 hover:text-red-600 dark:hover:text-red-400 cursor-pointer p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors mb-2">
            <span>🗑️</span>
            <span className="text-sm font-medium">Clear History</span>
        </div>
        <div className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors" onClick={toggleTheme}>
            <span>{theme === 'dark' ? '☀️' : '🌙'}</span>
            <span className="text-sm font-medium">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </div>
        <div 
             className="flex items-center gap-3 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
             onClick={onOpenSettings}
        >
            <span>⚙️</span>
            <span className="text-sm font-medium">Settings</span>
        </div>
      </div>
    </aside>
  );
}
