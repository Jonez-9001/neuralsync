import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, Zap } from 'lucide-react';

const STORAGE_KEY = 'ns40_deadline';
const DEADLINE_OFFSET_MS = 3 * 24 * 60 * 60 * 1000 + 7 * 60 * 60 * 1000; // 3 days 7 hours

function getDeadline(): number {
  if (typeof window === 'undefined') return Date.now() + DEADLINE_OFFSET_MS;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = Number(stored);
    if (!isNaN(parsed) && parsed > Date.now()) return parsed;
  }
  const deadline = Date.now() + DEADLINE_OFFSET_MS;
  localStorage.setItem(STORAGE_KEY, String(deadline));
  return deadline;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calcTimeLeft(deadline: number): TimeLeft {
  const diff = Math.max(0, deadline - Date.now());
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function TimeBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="relative rounded-xl p-px" style={{
      background: 'linear-gradient(135deg, #00f3ff 0%, #bd00ff 100%)',
    }}>
      <div className="rounded-xl bg-black/90 px-4 py-3 sm:px-6 sm:py-4 flex flex-col items-center gap-1 min-w-[72px] sm:min-w-[88px]">
        <span className="font-mono text-3xl sm:text-4xl font-bold tabular-nums leading-none text-white">
          {String(value).padStart(2, '0')}
        </span>
        <span className="text-[11px] sm:text-xs uppercase tracking-widest text-white/50 font-sans">
          {label}
        </span>
      </div>
    </div>
  );
}

export default function CountdownTimer() {
  const [deadline] = useState(getDeadline);
  const [time, setTime] = useState<TimeLeft>(() => calcTimeLeft(deadline));

  useEffect(() => {
    const id = setInterval(() => {
      setTime(calcTimeLeft(deadline));
    }, 1000);
    return () => clearInterval(id);
  }, [deadline]);

  const expired = time.days + time.hours + time.minutes + time.seconds === 0;

  const handleCTA = () => {
    const el = document.getElementById('checkout-section');
    el?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative w-full py-16 sm:py-20 overflow-hidden">
      {/* Subtle radial glow */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse 60% 40% at 50% 50%, rgba(0,243,255,0.06) 0%, transparent 70%)',
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="relative mx-auto max-w-3xl px-4 sm:px-6"
      >
        {/* Card */}
        <div className="rounded-2xl border border-white/[0.06] bg-black/45 backdrop-blur-sm p-6 sm:p-10 flex flex-col items-center gap-6 sm:gap-8 text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5">
            <Clock className="h-3.5 w-3.5 text-[#00f3ff]" />
            <span className="text-xs font-medium tracking-wide text-white/70 uppercase">
              Limited-Time Offer
            </span>
          </div>

          {/* Heading */}
          <h2 className="font-display text-2xl sm:text-3xl font-bold text-white leading-tight">
            Early Access Pricing Expires In
          </h2>

          {/* Timer boxes */}
          {!expired ? (
            <div className="flex items-center gap-2 sm:gap-3">
              <TimeBox value={time.days} label="Days" />
              <span className="font-mono text-2xl text-[#00f3ff]/60 -mt-4">:</span>
              <TimeBox value={time.hours} label="Hours" />
              <span className="font-mono text-2xl text-[#00f3ff]/60 -mt-4">:</span>
              <TimeBox value={time.minutes} label="Mins" />
              <span className="font-mono text-2xl text-[#00f3ff]/60 -mt-4">:</span>
              <TimeBox value={time.seconds} label="Secs" />
            </div>
          ) : (
            <p className="font-display text-xl text-white/60">Offer has expired</p>
          )}

          {/* Discount code */}
          <div className="flex flex-col items-center gap-2">
            <p className="text-sm text-white/50">Use code at checkout</p>
            <div
              className="relative rounded-lg p-px"
              style={{
                background: 'linear-gradient(90deg, #00f3ff, #bd00ff)',
              }}
            >
              <div className="rounded-lg bg-black px-6 py-2.5 flex items-center gap-3">
                <span className="font-mono text-xl sm:text-2xl font-bold tracking-[0.2em] text-white">
                  BETA50
                </span>
                <span className="text-xs font-semibold rounded bg-[#00f3ff]/10 text-[#00f3ff] px-2 py-0.5">
                  50% OFF
                </span>
              </div>
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={handleCTA}
            className="group relative inline-flex items-center gap-2 rounded-full px-8 py-3.5 font-display font-semibold text-sm sm:text-base text-black transition-shadow duration-300 hover:shadow-[0_0_32px_rgba(0,243,255,0.3)]"
            style={{
              background: 'linear-gradient(135deg, #00f3ff 0%, #bd00ff 100%)',
            }}
          >
            <Zap className="h-4 w-4 transition-transform duration-200 group-hover:scale-110" />
            Claim 50% Off Now
          </button>
        </div>
      </motion.div>
    </section>
  );
}
