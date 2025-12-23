import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { v4 as uuidv4 } from 'uuid';

export const UseChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [limitReached, setLimitReached] = useState(false);

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
          fingerprint: fingerprint
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.detail === "GUEST_LIMIT_REACHED" || data.detail === "USER_LIMIT_REACHED") {
          setLimitReached(true); // Trigger Limit Modal
        }
        throw new Error(data.detail);
      }

      // Add AI Response to UI
      setMessages((prev) => [...prev, { role: 'ai', content: data.reply }]);
    
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage, limitReached, setLimitReached };
};