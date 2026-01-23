import React, { useState, useEffect } from 'react';
import { UseChat } from '../hooks/UseChat';
import { usePromptCount } from '../hooks/usePromptCount';
import { Supabase } from '../lib/Supabase';
import Sidebar from '../components/Layout/Sidebar';
import Header from '../components/Layout/Header';
import ChatArea from '../components/Layout/ChatArea';
import LoginModal from '../components/LoginModal';
import Button from '../components/UI/Button';
import SettingsModal from '../components/SettingsModal';
import { Link } from 'react-router-dom';

export default function Home() {
  const { messages, loading, sendMessage, submitEmail, limitReached, setLimitReached, fingerprint, setMessages } = UseChat();
  const [input, setInput] = useState('');
  const [session, setSession] = useState(null);
  const [isPremium, setIsPremium] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const [isSettingsOpen, setIsSettingsOpen] = useState({ isOpen: false, tab: 'general' });

  const [manualEmail, setManualEmail] = useState(() => localStorage.getItem('guest_email') || null);
  const [limitType, setLimitType] = useState('guest'); // 'guest' | 'final'

  // Fetch prompt count from Supabase with real-time updates
  const { promptCount, maxPrompts, loading: countLoading, userId: fetchedUserId } = usePromptCount(
    fingerprint,
    session?.user?.id,
    session,
    manualEmail
  );

  useEffect(() => {
    Supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
          // Check if premium
          const checkPremium = async () => {
              const { data, error } = await Supabase
                  .from('user_subscriptions')
                  .select('status')
                  .eq('user_id', session.user.id)
                  .single();
              
              if (data && (data.status === 'active' || data.status === 'trialing')) {
                  setIsPremium(true);
              }
          };
          checkPremium();
      }
    });

    const {
      data: { subscription },
    } = Supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ensure correct limit type is shown if backend triggers limit
  useEffect(() => {
    if (limitReached) {
        const hasEmail = !!(session?.user?.email || manualEmail);
        console.log('[App] Limit reached triggered. Identified:', hasEmail);
        if (hasEmail) {
            setLimitType('final');
        } else {
            setLimitType('guest');
        }
    }
  }, [limitReached, session, manualEmail]);

  const handleSend = async (text = null) => {
    // If text is provided (from sample questions), use it. Otherwise use input state.
    const messageContent = typeof text === 'string' ? text : input;
    
    if (!messageContent?.trim()) return;
    
    // Check limits before sending
    const isGuest = !session;
    const hasEmailProvided = !!(session?.user?.email || manualEmail);
    
    // Guest without email: max 5 prompts
    if (isGuest && !manualEmail && promptCount >= 5) {
      console.log('[App] Guest limit reached (5 prompts), showing email modal');
      setLimitType('guest');
      setLimitReached(true);
      return;
    }
    
    // User with email (manual or logged in): max 8 prompts
    if (hasEmailProvided && promptCount >= 8) {
      console.log('[App] Final limit reached (8 prompts), showing beta modal');
      setLimitType('final');
      setLimitReached(true);
      return;
    }
    
    const email = session?.user?.email || manualEmail || "none";
    const userId = session?.user?.id || fetchedUserId || "none"; // Use fetched user ID from DB for manual email users
    
    // If we have a manual email but no userId, we are still anonymous but identified by email
    await sendMessage(messageContent, session?.access_token, email, userId);
    
    // Only clear input if we sent from the input field
    if (!text) {
        setInput('');
    }
    
    // No need to manually refetch - real-time subscription will update automatically
  };

  const handleLogin = async (emailInput = null) => {
    // If emailInput is provided, it's a manual guest email submission
    if (typeof emailInput === 'string' && emailInput.includes('@')) {
        console.log('[App] Email provided by guest:', emailInput);
        setManualEmail(emailInput);
        localStorage.setItem('guest_email', emailInput);
        setLimitReached(false); // Close modal and allow to continue
        
        // Immediate N8N Submission
        submitEmail(emailInput);
        return;
    }

    // Otherwise, standard Google Login
    console.log('[App] Initiating Google OAuth login');
    await Supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin }
    });
  };

  const handleLogout = async () => {
    await Supabase.auth.signOut();
    localStorage.removeItem('guest_email'); // Clear manual email
    setManualEmail(null);
    setSession(null);
    // Optional: clear chat on logout
    window.location.reload(); 
  };

  // Mock New Chat (Clear messages)
  const handleNewChat = () => {
      window.location.reload(); // Simple way to reset state/uuid for now since we rely on mount effect
  };

  return (
    <div className="fixed inset-0 flex bg-gray-50 dark:bg-[#0F1016] text-slate-900 dark:text-white overflow-hidden font-sans transition-colors duration-300">
      {/* Sidebar (Desktop & Mobile) */}
      <Sidebar 
        onNewChat={handleNewChat} 
        onOpenSettings={() => setIsSettingsOpen({ isOpen: true, tab: 'general' })}
        isOpen={isMobileSidebarOpen}
        onClose={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative w-full min-h-0">
        <Header 
            session={session} 
            manualEmail={manualEmail}
            isPremium={isPremium} 
            promptCount={promptCount} 
            maxLimit={maxPrompts}
            onLogin={handleLogin}
            onLogout={handleLogout}
            onOpenProfile={() => setIsSettingsOpen({ isOpen: true, tab: 'profile' })}
            onToggleSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
        />

        <ChatArea messages={messages} loading={loading} onSend={handleSend} />

        {/* Input Area */}
        <div className="p-4 md:p-6 bg-white/80 dark:bg-[#0F1016]/95 backdrop-blur border-t border-gray-200 dark:border-white/5 z-10 transition-colors duration-300">
          <div className="max-w-6xl mx-auto">
              <div className="relative bg-gray-100 dark:bg-[#1E1F2E] border border-gray-200 dark:border-white/10 rounded-2xl shadow-lg flex items-center p-2 focus-within:ring-2 focus-within:ring-indigo-500/50 transition-all">
                <input
                    type="text"
                    className="bg-transparent border-none outline-none flex-1 px-4 py-2 text-slate-900 dark:text-white placeholder-slate-500"
                    placeholder="Message Lumina..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && !loading && handleSend()}
                    disabled={limitReached || loading}
                />
                <Button 
                    onClick={() => handleSend()}
                    disabled={limitReached || loading || !input.trim()}
                    className={`rounded-xl w-10 h-10 !p-0 flex items-center justify-center transition-all ${input.trim() ? 'opacity-100 bg-indigo-600' : 'opacity-50 bg-slate-700'}`}
                >
                    {loading ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="22" y1="2" x2="11" y2="13"></line>
                        <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                        </svg>
                    )}
                </Button>
            </div>
          </div>
        </div>

        {/* Modals */}
        <LoginModal 
            isOpen={limitReached} 
            onClose={() => setLimitReached(false)} 
            onLogin={handleLogin} 
            limitType={limitType}
        />
        <SettingsModal 
            isOpen={isSettingsOpen.isOpen} 
            onClose={() => setIsSettingsOpen({ isOpen: false, tab: 'general' })} 
            initialTab={isSettingsOpen.tab}
            session={session}
            manualEmail={manualEmail}
            userId={session?.user?.id || fetchedUserId}
            usageStats={{ promptCount: promptCount, isPremium: isPremium }}
        />
      </div>
    </div>
  );
}
