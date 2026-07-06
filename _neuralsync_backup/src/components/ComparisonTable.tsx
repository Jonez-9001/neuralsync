import { motion } from 'motion/react';
import { Check, X, Minus } from 'lucide-react';

type CellStatus = 'positive' | 'negative' | 'neutral' | 'na';

interface RowData {
  label: string;
  values: { text: string; status: CellStatus }[];
}

const columns = [
  'NeuralSync 40',
  'Generic Binaural Beats',
  'White Noise Apps',
  'Silence / No Aid',
];

const rows: RowData[] = [
  {
    label: 'Entry Method',
    values: [
      { text: 'Smart-Ramp™ (10→40Hz)', status: 'positive' },
      { text: 'Abrupt 40Hz Start', status: 'negative' },
      { text: 'No Entrainment', status: 'neutral' },
      { text: 'None', status: 'na' },
    ],
  },
  {
    label: 'Sensory Fatigue',
    values: [
      { text: 'Zero (Organic Layers)', status: 'positive' },
      { text: 'High (Harsh Tones)', status: 'negative' },
      { text: 'Low', status: 'neutral' },
      { text: 'N/A', status: 'na' },
    ],
  },
  {
    label: 'Cognitive Sync',
    values: [
      { text: '40Hz Gamma Lock', status: 'positive' },
      { text: 'Unstable', status: 'negative' },
      { text: 'None', status: 'neutral' },
      { text: 'None', status: 'na' },
    ],
  },
  {
    label: 'Audio Quality',
    values: [
      { text: 'Lossless WAV/FLAC', status: 'positive' },
      { text: 'Compressed MP3', status: 'negative' },
      { text: 'Varies', status: 'neutral' },
      { text: 'N/A', status: 'na' },
    ],
  },
  {
    label: 'Session Length',
    values: [
      { text: '60 Min Deep Protocol', status: 'positive' },
      { text: '15-30 Min', status: 'neutral' },
      { text: 'Unlimited', status: 'neutral' },
      { text: 'N/A', status: 'na' },
    ],
  },
  {
    label: 'Price',
    values: [
      { text: '$19 One-Time', status: 'positive' },
      { text: '$5-15/mo Subscription', status: 'negative' },
      { text: 'Free-$10/mo', status: 'neutral' },
      { text: 'Free', status: 'neutral' },
    ],
  },
  {
    label: 'Guarantee',
    values: [
      { text: '100% Risk-Free', status: 'positive' },
      { text: 'Varies', status: 'neutral' },
      { text: 'Varies', status: 'neutral' },
      { text: 'N/A', status: 'na' },
    ],
  },
];

function StatusIcon({ status }: { status: CellStatus }) {
  if (status === 'positive')
    return <Check className="w-4 h-4 text-[#00f3ff] shrink-0" />;
  if (status === 'negative')
    return <X className="w-4 h-4 text-red-400/80 shrink-0" />;
  if (status === 'neutral')
    return <Minus className="w-4 h-4 text-white/30 shrink-0" />;
  return <Minus className="w-4 h-4 text-white/15 shrink-0" />;
}

export default function ComparisonTable() {
  return (
    <section className="relative py-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Section header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.5 }}
        className="text-center max-w-3xl mx-auto mb-16"
      >
        <p className="text-sm font-mono uppercase tracking-[0.2em] text-[#bd00ff] mb-3">
          Side-by-Side
        </p>
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-white mb-4">
          How NeuralSync 40 Compares
        </h2>
        <p className="text-base sm:text-lg text-white/50 leading-relaxed">
          See exactly why thousands are switching from generic audio tools to a
          precision-engineered 40Hz gamma protocol.
        </p>
      </motion.div>

      {/* Table container */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="max-w-6xl mx-auto"
      >
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[720px] px-4 sm:px-0">
            {/* Column headers */}
            <div className="grid grid-cols-[minmax(120px,1.2fr)_repeat(4,1fr)] gap-px">
              {/* Empty corner cell */}
              <div />

              {columns.map((col, i) => {
                const isNeural = i === 0;
                return (
                  <div
                    key={col}
                    className={`relative text-center px-3 pt-3 pb-4 rounded-t-xl ${
                      isNeural
                        ? 'bg-white/[0.04] border border-b-0 border-[rgba(0,243,255,0.2)]'
                        : ''
                    }`}
                  >
                    {isNeural && (
                      <span className="inline-block mb-2 px-3 py-0.5 text-[10px] font-mono font-bold uppercase tracking-[0.15em] rounded-full bg-gradient-to-r from-[#00f3ff]/20 to-[#bd00ff]/20 text-[#00f3ff] border border-[#00f3ff]/25">
                        Recommended
                      </span>
                    )}
                    <p
                      className={`text-sm font-display font-semibold leading-tight ${
                        isNeural ? 'text-white' : 'text-white/50'
                      }`}
                    >
                      {col}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Data rows */}
            {rows.map((row, rowIdx) => {
              const isLast = rowIdx === rows.length - 1;
              return (
                <div
                  key={row.label}
                  className="grid grid-cols-[minmax(120px,1.2fr)_repeat(4,1fr)] gap-px"
                >
                  {/* Row label */}
                  <div className="flex items-center py-3.5 pr-4">
                    <span className="text-sm font-medium text-white/70">
                      {row.label}
                    </span>
                  </div>

                  {/* Value cells */}
                  {row.values.map((cell, colIdx) => {
                    const isNeural = colIdx === 0;
                    return (
                      <div
                        key={`${row.label}-${colIdx}`}
                        className={`flex items-center justify-center gap-2 px-3 py-3.5 text-center ${
                          isNeural
                            ? `bg-white/[0.04] border-x border-[rgba(0,243,255,0.2)] ${
                                isLast
                                  ? 'border-b rounded-b-xl'
                                  : 'border-b-0'
                              }`
                            : `border-b border-white/[0.04] ${
                                isLast ? 'border-b-0' : ''
                              }`
                        }`}
                      >
                        <StatusIcon status={cell.status} />
                        <span
                          className={`text-xs sm:text-sm leading-snug ${
                            isNeural && cell.status === 'positive'
                              ? 'text-white font-medium'
                              : cell.status === 'negative'
                                ? 'text-red-300/60'
                                : 'text-white/40'
                          }`}
                        >
                          {cell.text}
                        </span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
