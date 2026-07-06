import { motion } from 'motion/react';
import { ShieldCheck } from 'lucide-react';

const badges = ['30-Day Window', 'No Questions Asked', 'Full Refund'] as const;

export default function GuaranteeSection() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-[#00f3ff]/[0.02] to-transparent">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mx-auto max-w-2xl text-center"
      >
        {/* Shield Icon */}
        <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-full border border-[#00f3ff]/15 bg-[#00f3ff]/[0.06]">
          <ShieldCheck className="h-10 w-10 text-[#00f3ff]" strokeWidth={1.5} />
        </div>

        {/* Title */}
        <h2 className="font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
          100% Satisfaction Guarantee
        </h2>

        {/* Subtitle */}
        <p className="mt-3 font-mono text-sm uppercase tracking-widest text-[#00f3ff]/70">
          Zero-Risk Protocol Activation
        </p>

        {/* Body */}
        <p className="mt-6 text-base leading-relaxed text-white/60 sm:text-lg sm:leading-relaxed">
          If the NeuralSync 40 protocol does not noticeably enhance your
          cognitive focus and flow state within 30 days of consistent use, we
          will refund your purchase in full. No questions asked. No hidden
          conditions. Your investment is fully protected.
        </p>

        {/* Badges */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          {badges.map((label) => (
            <span
              key={label}
              className="rounded-full border border-white/10 bg-white/[0.04] px-5 py-2 text-sm font-medium text-white/80"
            >
              {label}
            </span>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
