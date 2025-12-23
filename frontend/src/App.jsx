import React, { useState, useEffect } from 'react';
import { UseChat } from './hooks/UseChat';
import { Supabase } from './lib/Supabase'; // Your supabase config

export default function App() {
  const { messages, loading, sendMessage, limitReached, setLimitReached, promptCount, setPromptCount } = UseChat();
  const [input, setInput] = useState('');
  const [session, setSession] = useState(null); // Supabase Auth Session
  const [isPremium, setIsPremium] = useState(false); // Track premium status

  // Fetch user stats when session changes
  useEffect(() => {
    if (session?.access_token) {
      fetch('http://localhost:8000/api/user/stats', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      .then(res => res.json())
      .then(data => {
        setIsPremium(data.is_premium || false);
        setPromptCount(data.prompt_count || 0);
      })
      .catch(err => {
        console.error('Failed to fetch user stats:', err);
        setIsPremium(false);
      });
    } else {
      setIsPremium(false);
      // Fetch guest stats if needed (using fingerprint from UseChat - easier to just rely on UseChat update for guests
      // unless we add a specific guest-stats endpoint. For now, we can trust UseChat's initial state 
      // OR we can make a lightweight call.
      // Let's rely on the chat response updating it, OR adding a specific guest endpoint. 
      // Actually, let's keep it simple: UseChat handles the session/fingerprint.
    }
  }, [session, setPromptCount]);

  useEffect(() => {
    // 1. Check active session on load
    Supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setLimitReached(false); // Remove limit if logged in
    });

    // 2. Listen for changes (Login/Logout)
    const {
      data: { subscription },
    } = Supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        setLimitReached(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [setLimitReached]);

  const handleSend = () => {
    sendMessage(input, session?.access_token);
    setInput('');
  };

  const handleLogin = async () => {
    await Supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin, // Redirects back to here after login
      }
    });
  };

  const handleLogout = async () => {
    await Supabase.auth.signOut();
    setSession(null);
    setPromptCount(0); // Reset UI count
  };

  const maxLimit = session ? 8 : 5;
  const remaining = Math.max(0, maxLimit - promptCount);

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <span>✨</span> GeminiBot
        </div>
        
        <div className="user-controls">
          {session ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div className="user-badge member">
                <div className="avatar-small">
                   {session.user?.user_metadata?.avatar_url ? (
                     <img src={session.user.user_metadata.avatar_url} alt="U" />
                   ) : (
                     "👤"
                   )}
                </div>
                <div className="info">
                  <span className="name">{isPremium ? "Pro Member" : "Free Member"}</span>
                  <span className="count">{promptCount} / {maxLimit} used</span>
                </div>
              </div>
              <button 
                onClick={handleLogout} 
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Sign Out
              </button>
            </div>
          ) : (
             <div className="user-badge guest">
               <span className="icon">👾</span>
               <div className="info">
                 <span className="name">Guest Mode</span>
                 <span className="count">{promptCount} / {maxLimit} used</span>
               </div>
             </div>
          )}
        </div>
      </header>

      {/* Chat Area */}
      <div className="chat-area">
        {messages.map((msg, idx) => (
          <div key={idx} className={`message-row ${msg.role}`}>
             {msg.role === 'ai' && <div className="avatar">AI</div>}
             <div className={`message-bubble ${msg.role}`}>
                {msg.content}
             </div>
          </div>
        ))}
        {loading && (
          <div className="message-row ai">
            <div className="avatar">AI</div>
            <div className="message-bubble ai" style={{ color: 'var(--text-muted)' }}>
              Thinking...
            </div>
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="input-area">
        <div className="input-container">
          <input
            type="text"
            className="chat-input"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            disabled={limitReached}
          />
          <button
            onClick={handleSend}
            disabled={limitReached || loading}
            className="send-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"></line>
              <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
            </svg>
          </button>
        </div>
      </div>

      {/* Limit Reached Modal */}
      {limitReached && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
              {session ? "🌟" : "🛑"}
            </div>
            <h2 className="modal-title">
              {session ? "You've reached the limit!" : "Guest Limit Reached"}
            </h2>
            
            {!session ? (
              <>
                <p className="modal-text">
                  You've used all 5 free guest prompts. Create a free account to get <strong>3 more prompts</strong> instantly!
                </p>
                <div className="upsell-box">
                  <span>🚀</span> Unlock 8 Total Prompts
                </div>
                <button onClick={handleLogin} className="btn-primary">
                  Sign in with Google
                </button>
              </>
            ) : (
              <>
                <p className="modal-text">
                  You have used all 8 free prompts properly. We hope you enjoyed the demo!
                </p>
                <div className="upsell-box premium">
                  <span>💎</span> Premium Plan Coming Soon
                </div>
              </>
            )}

            <button onClick={() => setLimitReached(false)} className="btn-outline">
              Close (Read Only)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}