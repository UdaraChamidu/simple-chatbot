import React, { useState, useEffect } from 'react';
import { UseChat } from './hooks/UseChat';
import { Supabase } from './lib/Supabase'; // Your supabase config

export default function App() {
  const { messages, loading, sendMessage, limitReached, setLimitReached } = UseChat();
  const [input, setInput] = useState('');
  const [session, setSession] = useState(null); // Supabase Auth Session

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
      if (session) setLimitReached(false);
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

  return (
    <div className="app-container">
      {/* Header */}
      <header className="app-header">
        <div className="brand">
          <span>✨</span> GeminiBot
        </div>
        {session ? (
          <span className="limit-badge premium">Pro Member</span>
        ) : (
          <span className="limit-badge">Guest Mode (5 Free)</span>
        )}
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
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🛑</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>Limit Reached</h2>
            
            {!session ? (
              <>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  You've hit the 5-prompt guest limit. Sign in to unlock more!
                </p>
                <button onClick={handleLogin} className="btn-primary">
                  Sign in with Google
                </button>
              </>
            ) : (
              <>
                <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  You have reached the absolute limit of 8 prompts. Thanks for testing!
                </p>
                <div style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px', color: '#94a3b8', fontWeight: 600 }}>
                  Max Limit Reached
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