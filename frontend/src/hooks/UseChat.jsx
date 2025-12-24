import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { v4 as uuidv4 } from 'uuid';

export const UseChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [promptCount, setPromptCount] = useState(0); // Track usage 

  // 1. Initialize Fingerprint & Session on Mount
  useEffect(() => {
    // Fingerprint
    const setFp = async () => {
      const fpPromise = await FingerprintJS.load();
      const result = await fpPromise.get();
      setFingerprint(result.visitorId);
    };
    setFp();

    // Session ID (Persist across refreshes)
    let storedSession = localStorage.getItem('chat_session_id');
    if (!storedSession) {
      storedSession = uuidv4();
      localStorage.setItem('chat_session_id', storedSession);
    }
    setSessionId(storedSession);

    // Fetch History
    fetch(`http://localhost:8000/api/chat/history/${storedSession}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(err => console.error("Failed to fetch history:", err));

  }, []);

  // 2. Send Message Function
  const sendMessage = async (text, userToken = null) => {
    if (!text.trim()) return;

    // Add User Message to UI immediately
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      const response = await fetch('http://localhost:8000/api/chat', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          fingerprint: fingerprint,
          system_instruction: localStorage.getItem('systemPrompt') || undefined
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail === "GUEST_LIMIT_REACHED" || data.detail === "USER_LIMIT_REACHED") {
            setLimitReached(true); // Trigger Limit Modal
        }
        throw new Error(data.detail);
      }

      // Update prompt count if provided
      if (data.prompt_count !== undefined) {
        setPromptCount(data.prompt_count);
      }

      // Add AI Response to UI
      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
    
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage, limitReached, setLimitReached, promptCount, setPromptCount, setMessages };
};