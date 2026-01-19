import React from 'react';
import Button from '../UI/Button';

import { useTheme } from '../../hooks/useTheme';

export default function Sidebar({ onNewChat, onOpenSettings, isOpen, onClose }) {
  const { theme, toggleTheme } = useTheme();
  return (
    <>
    {/* Mobile Overlay */}
    {isOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
            onClick={onClose}
        />
    )}

    <aside className={`
        fixed md:static inset-y-0 left-0 z-50 w-72 bg-white dark:bg-[#0F1016] border-r border-gray-200 dark:border-white/5 
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        flex flex-col h-full pt-4 pb-6 px-4
    `}>
      <div className="mb-6 px-2 pt-4 relative">
         {/* Mobile Close Button */}
         <button 
            onClick={onClose}
            className="absolute top-2 right-2 p-1 md:hidden text-slate-400 hover:text-slate-600 dark:hover:text-white"
         >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
         </button>

         <div className="p-3 bg-gradient-to-br from-indigo-500/10 to-violet-500/10 rounded-xl border border-indigo-500/10 mb-4 mt-2 md:mt-0">
            <h3 className="text-xs font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-wider mb-1">About Lumina</h3>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
               Next-gen Medical AI assistant designed for medical support. Powered by Gemini.
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
    </>
  );
}
