import React, { useRef, useEffect } from 'react';

export default function ChatArea({ messages, loading }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (messages.length === 0) {
      return (
          <div className="flex-1 flex items-center justify-center flex-col text-center p-8 opacity-50">
             <div className="text-6xl mb-6 grayscale hover:grayscale-0 transition-all duration-500 transform hover:scale-110 cursor-pointer">✨</div>
             <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Welcome to Lumina</h3>
             <p className="text-slate-500 dark:text-slate-400 max-w-md leading-relaxed">Start a conversation to experience the power of AI with our premium interface.</p>
          </div>
      )
  }

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth custom-scrollbar">
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slideUp`}>
          <div className={`flex max-w-[90%] md:max-w-[70%] gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
             
             {/* Avatar */}
             <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs border border-gray-200 dark:border-white/10 shadow-sm ${msg.role === 'ai' ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-white'}`}>
                {msg.role === 'ai' ? '✨' : '👤'}
             </div>

             {/* BUBBLE */}
             <div className={`relative px-6 py-4 rounded-2xl shadow-md text-[0.95rem] leading-relaxed transition-colors duration-300 ${
                 msg.role === 'user' 
                 ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm' 
                 : 'bg-white dark:bg-[#1E1F2E] border border-gray-200 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-sm'
             }`}>
                {msg.content}
             </div>
          </div>
        </div>
      ))}

      {loading && (
        <div className="flex w-full justify-start animate-pulse">
             <div className="flex gap-4">
                 <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center border border-gray-200 dark:border-white/10 text-indigo-600 dark:text-indigo-300">✨</div>
                 <div className="bg-white dark:bg-[#1E1F2E] border border-gray-200 dark:border-white/5 px-6 py-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                    <span className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce delay-75"></span>
                    <span className="w-2 h-2 bg-indigo-500 dark:bg-indigo-400 rounded-full animate-bounce delay-150"></span>
                 </div>
             </div>
        </div>
      )}
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
