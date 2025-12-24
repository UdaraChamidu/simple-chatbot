import React from 'react';

export default function GlassCard({ children, className = '' }) {
  return (
    <div className={`backdrop-blur-xl bg-white/90 dark:bg-[#1a1b26]/80 border border-gray-200 dark:border-white/5 shadow-2xl rounded-2xl transition-colors duration-300 ${className}`}>
      {children}
    </div>
  );
}
