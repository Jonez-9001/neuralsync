import React from 'react';

export default function TrustLogos() {
  return (
    <section className="relative z-10 w-full bg-black/80 border-t border-white/5 py-8 overflow-hidden">
      <div className="max-w-6xl mx-auto px-6 text-center">
        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.3em] mb-6">Recognized By Industry Leaders</p>
        
        <div className="flex flex-wrap justify-center items-center gap-8 sm:gap-16 opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
          {/* Placeholder SVGs for generic tech/science publications */}
          <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tighter">
            <div className="w-6 h-6 bg-white rounded-sm" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
            WIRED
          </div>
          
          <div className="flex items-center gap-2 font-serif font-bold text-2xl italic">
            Forbes
          </div>
          
          <div className="flex items-center gap-2 font-display font-black text-xl tracking-widest uppercase">
            <div className="w-2 h-6 bg-[#00f3ff] rounded-sm" />
            FastCompany
          </div>
          
          <div className="flex items-center gap-2 font-mono font-bold text-lg border-2 border-white px-2 py-1">
            TECHCRUNCH
          </div>
        </div>
      </div>
    </section>
  );
}
