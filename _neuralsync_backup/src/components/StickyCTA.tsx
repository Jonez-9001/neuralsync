import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export default function StickyCTA() {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > window.innerHeight);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleCTA = () => {
    document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          className="fixed bottom-0 left-0 right-0 z-[45] h-[60px] bg-black/90 backdrop-blur-md border-t border-white/10"
        >
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
            {/* Product name — hidden on mobile */}
            <span className="hidden font-display text-sm font-semibold tracking-wide text-white sm:block">
              NeuralSync 40
            </span>

            {/* Price + CTA */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-white/40 line-through">$38</span>
                <span className="font-semibold text-white">$19.00</span>
              </div>

              <button
                onClick={handleCTA}
                className="rounded-lg bg-[#00f3ff] px-5 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#00f3ff]/85"
              >
                Get the Protocol →
              </button>
            </div>

            {/* Dismiss */}
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss"
              className="ml-3 flex h-7 w-7 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
