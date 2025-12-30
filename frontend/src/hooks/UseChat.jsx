import { useState, useEffect } from 'react';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { v4 as uuidv4 } from 'uuid';

export const UseChat = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fingerprint, setFingerprint] = useState(null);
  const [sessionId, setSessionId] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
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
      let emailPayload = null; // Default to null, as email is submitted once via submitEmail
      let userIdPayload = null;

      // Handle logged in user
      if (userId && userId !== "none") {
        userIdPayload = userId;
        // emailPayload = userEmail; // DISABLED: We don't send email with every message anymore
      } 
      // Handle anonymous user with manual email
      else if (userEmail && userEmail !== "none") {
          // DISABLED: As per user request, we only send email ONCE via submitEmail.
          // Subsequent regular messages do NOT need to contain the email.
          // emailPayload = userEmail; 
          emailPayload = null;
      }

      // Single call to N8N Webhook (Handles DB & AI)
      const WEBHOOK_URL = 'https://n8n-klmi.onrender.com/webhook/fb05eaf5-6e3b-4fef-bbc5-9636e16539e7';
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
      if (data.status === "EMAIL_REQUIRED" || data.status === "LIMIT_REACHED") {
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

  // 3. Submit Email Function (Immediate)
  const submitEmail = async (email) => {
    if (!email) return;

    try {
      const WEBHOOK_URL = 'https://n8n-klmi.onrender.com/webhook/fb05eaf5-6e3b-4fef-bbc5-9636e16539e7';
      
      const payload = {
        message: "[EMAIL_SUBMISSION]",
        session_id: sessionId,
        fingerprint: fingerprint,
        ip: ipAddress,
        email: email,
        user_id: null 
      };

      console.log('Submitting Email Payload:', payload);

      await fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // No need to process response for chat UI, just fire and forget or simple log
      console.log('Email submitted to N8N');

    } catch (error) {
      console.error("Email submission error:", error);
    }
  };

  return { messages, loading, sendMessage, submitEmail, limitReached, setLimitReached, fingerprint, setMessages };
};




