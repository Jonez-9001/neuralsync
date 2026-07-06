import React, { useState, useEffect } from 'react';
import { Timer, Sparkles, X } from 'lucide-react';

export default function TopBanner() {
  const [isVisible, setIsVisible] = useState(true);
  const [timeLeft, setTimeLeft] = useState(3600 * 2); // 2 hours

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!isVisible) return null;

  const hours = Math.floor(timeLeft / 3600);
  const minutes = Math.floor((timeLeft % 3600) / 60);
  const seconds = timeLeft % 60;

  return (
    <div className="relative z-[60] bg-gradient-to-r from-[#bd00ff] via-[#8553ff] to-[#00f3ff] text-white py-2 px-4 shadow-[0_4px_20px_rgba(189,0,255,0.2)]">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 text-xs sm:text-sm font-semibold tracking-wide">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 animate-pulse" />
          <span className="uppercase">Flash Sale: 50% Off Beta Access</span>
        </div>
        
        <div className="flex items-center gap-1.5 bg-black/30 px-3 py-1 rounded-full font-mono">
          <Timer className="w-3.5 h-3.5" />
          <span>
            {hours.toString().padStart(2, '0')}:
            {minutes.toString().padStart(2, '0')}:
            {seconds.toString().padStart(2, '0')}
          </span>
        </div>
      </div>
      
      <button 
        onClick={() => setIsVisible(false)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-black/20 rounded-full transition-colors cursor-pointer"
        aria-label="Close banner"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
