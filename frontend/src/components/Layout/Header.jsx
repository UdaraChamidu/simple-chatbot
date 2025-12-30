import React from 'react';
import Button from '../UI/Button';
import LimitIndicator from '../UI/LimitIndicator';

export default function Header({ session, manualEmail, isPremium, promptCount, maxLimit, onLogin, onLogout, onOpenProfile }) {
  const userEmail = session?.user?.email || manualEmail;

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-[#0F1016]/80 backdrop-blur-md border-b border-gray-200 dark:border-white/5 sticky top-0 z-20 transition-colors duration-300">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <span className="text-xl">✨</span>
        </div>
        <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
          Lumina AI
        </h1>
        <div className="text-[10px] font-mono bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full border border-indigo-500/20 ml-2">
            Beta v1.0
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-4 md:gap-6">
        {/* Limit Ring */}
        <LimitIndicator count={promptCount} max={maxLimit} />

        {/* User Profile - Show if we have any email (manual or session) */}
        {userEmail && (
            <>
                <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10 mx-2 hidden sm:block"></div>
                <div className="flex items-center gap-4">
                   <div className="hidden sm:flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity" onClick={onOpenProfile}>
                      <div className="w-9 h-9 rounded-full border-2 border-gray-200 dark:border-white/10 overflow-hidden shadow-inner bg-gray-100 dark:bg-slate-700">
                         {session?.user?.user_metadata?.avatar_url ? (
                             <img src={session.user.user_metadata.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full flex items-center justify-center text-xs text-slate-500 dark:text-white font-bold">
                                {userEmail[0].toUpperCase()}
                             </div>
                         )}
                      </div>
                      <div>
                          <div className="text-sm font-medium text-slate-900 dark:text-white">{userEmail.split('@')[0]}</div>
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold tracking-wide uppercase">{isPremium ? 'PRO Account' : 'Free Plan'}</div>
                      </div>
                   </div>
                   {userEmail && <Button variant="ghost" className="!px-3 !py-1.5 text-xs border border-gray-200 dark:border-white/5 text-slate-600 dark:text-white" onClick={onLogout}>Sign Out</Button>}
                </div>
            </>
        )}
      </div>
    </header>
  );
}
