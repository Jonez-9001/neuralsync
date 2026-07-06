import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Zap, Clock, ShieldCheck, Download } from 'lucide-react';

interface StatItem {
  value: number;
  suffix: string;
  label: string;
  icon: React.ReactNode;
  prefix?: string;
  color: string;
}

const stats: StatItem[] = [
  { value: 40, suffix: ' Hz', label: 'Gamma Frequency', icon: <Zap className="w-5 h-5" />, color: '#00f3ff' },
  { value: 60, suffix: ' Min', label: 'Master Protocol', icon: <Clock className="w-5 h-5" />, color: '#bd00ff' },
  { value: 100, suffix: '%', label: 'Risk-Free', icon: <ShieldCheck className="w-5 h-5" />, color: '#00f3ff' },
  { value: 0, suffix: '', label: 'Instant Access', icon: <Download className="w-5 h-5" />, prefix: '∞', color: '#bd00ff' },
];

function AnimatedCounter({
  value,
  suffix,
  prefix,
  duration = 2000
}: {
  value: number;
  suffix: string;
  prefix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          if (prefix) {
            // Symbolic value, don't animate
            return;
          }
          const startTime = performance.now();
          const tick = (now: number) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * value));
            if (progress < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        }
      },
      { threshold: 0.4 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, duration, hasAnimated, prefix]);

  return (
    <div
      ref={ref}
      className="font-mono text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] leading-none"
    >
      {prefix || count}{suffix}
    </div>
  );
}

export default function StatsCounter() {
  return (
    <section className="relative z-10 py-20 sm:py-24 px-4 sm:px-10" id="stats-section">
      <div className="max-w-6xl mx-auto">
        {/* Section micro-label */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-14"
        >
          <span className="text-[10px] font-mono text-gray-500 tracking-[0.35em] uppercase">Protocol Metrics</span>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 sm:gap-6">
          {stats.map((stat, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 35, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="glass-card gradient-border rounded-2xl p-5 sm:p-7 text-center space-y-3 hover:scale-[1.03] transition-transform duration-300 group"
            >
              <div
                className="mx-auto w-10 h-10 rounded-xl border border-white/10 flex items-center justify-center transition-colors duration-300"
                style={{
                  background: `linear-gradient(135deg, ${stat.color}15, ${stat.color}08)`,
                  color: stat.color,
                }}
              >
                {stat.icon}
              </div>
              <AnimatedCounter value={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
              <div className="text-[10px] sm:text-xs font-mono uppercase tracking-[0.2em] text-gray-400 group-hover:text-gray-300 transition-colors">
                {stat.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
