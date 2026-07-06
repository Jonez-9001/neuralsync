import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "Do I need special headphones to use NeuralSync 40?",
    answer: "No specialized audio equipment is required, but standard headphones (over-ear or earbuds) are mandatory. True binaural beats rely on feeding slightly different frequencies to your left and right ears independently. The brain's olivary nucleus merges these to perceive the 40Hz frequency. Listening through standard external room speakers will bypass this effect."
  },
  {
    question: "How long should I listen to the protocol in a single session?",
    answer: "We recommend starting with 20 to 30-minute sessions to allow your nervous system to fully synchronize. Once accustomed, the 60-minute Master Protocol is perfect for tackling deep development tasks, writing sessions, or detailed mathematical modeling. There is no cumulative chemical toxicity, so you can safely use it multiple times a day."
  },
  {
    question: "What exactly is 'Smart-Ramp' and why is it superior?",
    answer: "Standard brainwave files immediately blast your ears with a static 40Hz beat. This sudden sensory shift can trigger immediate cognitive resistance, leading to tension, mild headaches, or mental fatigue. Smart-Ramp begins smoothly at a soothing 10Hz (Alpha) frequency to relax you, then slowly sweeps up to 40Hz (Gamma) over a comfortable 5-minute period. Your brain adapts naturally and remains locked in focus."
  },
  {
    question: "Are there any health or physical restrictions?",
    answer: "Yes. Auditory entrainment and binaural beats modify active brainwave frequencies. If you have a personal or family history of epilepsy, clinical seizures, or severe neurological disorders, you must NOT use the protocol. Additionally, avoid listening to the track while driving or operating heavy industrial machinery."
  },
  {
    question: "Can I copy the audio files to my phone and other media devices?",
    answer: "Absolutely. Once purchased, you receive direct download links for the lossless WAV and high-fidelity FLAC audio formats, along with standard MP3. You own the physical audio assets outright. You can transfer them to your iPhone, Android, tablet, or home network server without any DRM or subscription locks."
  }
];

export default function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-16" id="faq-section-container">
      <motion.div
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="text-center space-y-4 mb-14"
      >
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#00f3ff]/5 border border-[#00f3ff]/15 text-xs font-mono text-[#00f3ff] uppercase tracking-wider">
          <HelpCircle className="w-3.5 h-3.5" /> Core Support
        </span>
        <h3 className="font-display text-2xl sm:text-4xl font-bold text-white">
          Frequently Answered Doubts
        </h3>
        <p className="text-gray-400 text-sm max-w-xl mx-auto leading-relaxed">
          Gain immediate clarification on auditory physics, device setups, and safe medical recommendations.
        </p>
      </motion.div>

      <div className="space-y-4">
        {faqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.16, 1, 0.3, 1] }}
              className={`glass-card rounded-xl overflow-hidden transition-all duration-400 ${
                isOpen ? 'border-[#00f3ff]/15' : ''
              }`}
              id={`faq-item-${idx}`}
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full text-left p-5 flex justify-between items-center gap-4 text-white hover:bg-white/[0.02] transition-colors focus:outline-none cursor-pointer group"
              >
                <span className="font-display font-medium text-sm sm:text-base leading-snug group-hover:text-[#00f3ff] transition-colors duration-300">
                  {faq.question}
                </span>
                <span className={`flex-shrink-0 p-1 rounded-lg transition-all duration-300 ${
                  isOpen ? 'bg-[#00f3ff]/10 text-[#00f3ff]' : 'text-gray-500'
                }`}>
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {/* Gradient underline */}
                    <div className="mx-5 h-px bg-gradient-to-r from-[#00f3ff]/30 via-[#bd00ff]/20 to-transparent" />
                    <div className="px-5 pb-5 pt-3 text-xs sm:text-sm text-gray-400 leading-relaxed">
                      {faq.answer}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
