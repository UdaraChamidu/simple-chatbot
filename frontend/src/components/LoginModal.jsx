import React from 'react';
import GlassCard from './UI/GlassCard';
import Button from './UI/Button';

export default function LoginModal({ isOpen, onClose, onLogin, reason, isGuest = true, hasEmail = false }) {
  if (!isOpen) return null;

  // content logic
  const isUserLimit = reason === 'limit' && !isGuest;
  // If we have an email (manual or user), and we hit the limit, it's the final limit (8 prompts)
  const isFinalLimit = reason === 'limit' && hasEmail;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 dark:bg-black/60 backdrop-blur-sm animate-fadeIn">
      <GlassCard className="w-full max-w-md p-8 text-center m-4 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-indigo-500/20 blur-[50px] rounded-full pointer-events-none"></div>

        <div className="relative text-5xl mb-6 transform hover:scale-110 transition-transform duration-300 cursor-default">
           {isUserLimit || isFinalLimit ? '🚀' : (reason === 'limit' ? '🛑' : '✨')}
        </div>
        
        <h2 className="relative text-2xl font-bold text-slate-900 dark:text-white mb-3">
          {isUserLimit || isFinalLimit
            ? 'Premium Limit Reached' 
            : (reason === 'limit' ? 'Guest Limit Reached' : 'Sign In Required')
          }
        </h2>
        
        <p className="relative text-slate-600 dark:text-slate-300 mb-8 leading-relaxed">
          {isFinalLimit 
             ? "This is a beta version. We are working on premium plans. Stay tuned!"
             : (isUserLimit
                ? "You've hit the limit for the free plan. Our Premium functionality with unlimited messages is coming soon!"
                : (reason === 'limit' 
                    ? "Free limit reached. Please provide your email to continue and get 3 more free prompts."
                    : "Please sign in to access this feature.")
               )
          }
        </p>

        {/* Email Input for Guest Limit (Only if not final limit) */}
        {!isUserLimit && !isFinalLimit && reason === 'limit' && (
           <div className="mb-6 space-y-3">
              <input 
                type="email" 
                placeholder="Enter your email" 
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 text-slate-900 dark:text-white placeholder-slate-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const email = e.target.value;
                    if (email && email.includes('@')) {
                       onLogin(email); // Re-using onLogin to pass email for now, or we can use a new prop
                    }
                  }
                }}
                id="manual-email-input"
              />
              <Button 
                onClick={() => {
                   const emailInput = document.getElementById('manual-email-input');
                   if (emailInput && emailInput.value && emailInput.value.includes('@')) {
                      onLogin(emailInput.value);
                   }
                }} 
                className="relative w-full justify-center py-3 text-lg font-semibold shadow-indigo-500/20 bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Continue with Email
              </Button>
              <div className="relative flex items-center gap-4 py-2">
                 <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
                 <span className="text-xs text-slate-400 font-medium">OR</span>
                 <div className="flex-1 h-px bg-slate-200 dark:bg-white/10"></div>
              </div>
           </div>
        )}

        {isUserLimit || isFinalLimit ? (
            <Button disabled className="relative w-full justify-center py-3 text-lg font-semibold opacity-80 cursor-not-allowed bg-slate-700 text-slate-300">
               Premium Coming Soon...
            </Button>
        ) : (
            <Button onClick={() => onLogin()} className="relative w-full justify-center py-3 text-lg font-semibold shadow-indigo-500/20">
               Sign in with Google
            </Button>
        )}

        <button 
          onClick={onClose} 
          className="relative mt-6 text-sm text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors underline decoration-slate-300 dark:decoration-slate-700 hover:decoration-slate-900 dark:hover:decoration-white underline-offset-4 cursor-pointer"
        >
          Close (Read Only)
        </button>
      </GlassCard>
    </div>
  );
}
