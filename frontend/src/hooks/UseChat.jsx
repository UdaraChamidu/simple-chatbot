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
  const [ipAddress, setIpAddress] = useState(null);

  // 1. Initialize Fingerprint & Session on Mount
  useEffect(() => {
    // Fingerprint
    const setFp = async () => {
      const fpPromise = await FingerprintJS.load();
      const result = await fpPromise.get();
      setFingerprint(result.visitorId);
    };
    setFp();

    // Fetch IP
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(err => console.error("IP Fetch Error:", err));

    // Session ID (Persist across refreshes)
    let storedSession = localStorage.getItem('chat_session_id');
    if (!storedSession) {
      storedSession = uuidv4();
      localStorage.setItem('chat_session_id', storedSession);
    }
    setSessionId(storedSession);

    // Fetch History (DISABLED: N8N manages DB now)
    /* 
    fetch(`http://localhost:8000/api/chat/history/${storedSession}`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setMessages(data);
        }
      })
      .catch(err => console.error("Failed to fetch history:", err)); 
    */

  }, []);

  // 2. Send Message Function
  const sendMessage = async (text, userToken = null, userEmail = "", userId = "") => {
    if (!text.trim()) return;

    // Add User Message to UI immediately
    const userMsg = { role: 'user', content: text };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const headers = { 'Content-Type': 'application/json' };
      if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

      // Determine payloads
      let emailPayload = null;
      let userIdPayload = null;

      if (userId && userId !== null) {
        userIdPayload = userId;
        emailPayload = userEmail;
        
        const emailSentKey = `email_sent_${userId}`;
        const hasSentEmail = localStorage.getItem(emailSentKey);
        if (hasSentEmail) {
          emailPayload = "none";
        }
      }

      // Single call to N8N Webhook (Handles DB & AI)
      const WEBHOOK_URL = 'https://n8n-klmi.onrender.com/webhook-test/fb05eaf5-6e3b-4fef-bbc5-9636e16539e7';
      const systemPrompt = localStorage.getItem('systemPrompt');

      const response = await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          message: text,
          session_id: sessionId,
          fingerprint: fingerprint,
          system_instruction: systemPrompt,
          ip: ipAddress,
          email: emailPayload,
          user_id: userIdPayload
        }),
      });
      const textData = await response.text();
      console.log('Raw Webhook response:', textData);
      
      let data;
      try {
          data = JSON.parse(textData);
      } catch (e) {
          console.error("Failed to parse webhook JSON:", e);
          throw new Error("Invalid response from server");
      }
      
      console.log('Received N8N Data:', data); // Debugging log

      // Handle N8N Response Formats
      if (data.status === "EMAIL_REQUIRED") {
          setLimitReached(true); // Trigger Login/email Modal
          // You might want to show data.message to the user too
          throw new Error(data.message || "Limit reached");
      }

      if (data.status === "OK" || data.response || data.status === "Email_Provided") {
          // Mark email as sent if we successfully sent it
          if (userId !== "none" && userId && emailPayload !== "none") {
            const emailSentKey = `email_sent_${userId}`;
            localStorage.setItem(emailSentKey, 'true');
          }

          // Update prompt count
          if (data.prompts_used !== undefined) {
             setPromptCount(data.prompts_used);
          }
          
          // Add AI Response
          const aiContent = data.response || data.output || data.reply || data.message;
          if (aiContent) {
            setMessages((prev) => [...prev, { role: 'ai', content: aiContent }]);
          }
      } else {
          console.warn("Unknown N8N response format:", data);
      }
    
    } catch (error) {
      console.error("Chat error:", error);
    } finally {
      setLoading(false);
    }
  };

  return { messages, loading, sendMessage, limitReached, setLimitReached, promptCount, setPromptCount, setMessages };
};


