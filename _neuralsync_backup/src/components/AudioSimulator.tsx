import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Headphones, Volume2, ShieldAlert, Zap, Layers } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AudioSimulator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(10);
  const [volume, setVolume] = useState(0.3);
  const [useNoise, setUseNoise] = useState(true);
  const [analyzerData, setAnalyzerData] = useState<number[]>(new Array(32).fill(0));

  // Web Audio API References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const analyzerFrameRef = useRef<number>(0);

  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const startAudio = async () => {
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // Analyzer for visualization
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.75;
      masterGain.connect(analyser);
      analyzerRef.current = analyser;

      // Start analyzer loop
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      const readAnalyzer = () => {
        analyser.getByteFrequencyData(dataArray);
        const normalized = Array.from(dataArray).map(v => v / 255);
        setAnalyzerData(normalized);
        analyzerFrameRef.current = requestAnimationFrame(readAnalyzer);
      };
      analyzerFrameRef.current = requestAnimationFrame(readAnalyzer);

      // Binaural Oscillators
      const carrierFreq = 125;

      // Left ear
      const leftOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(carrierFreq, ctx.currentTime);

      const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const leftGain = ctx.createGain();
      leftGain.gain.setValueAtTime(0.5, ctx.currentTime);

      if (leftPanner) {
        leftPanner.pan.setValueAtTime(-1, ctx.currentTime);
        leftOsc.connect(leftGain).connect(leftPanner).connect(masterGain);
      } else {
        leftOsc.connect(leftGain).connect(masterGain);
      }

      // Right ear
      const rightOsc = ctx.createOscillator();
      rightOsc.type = 'sine';
      rightOsc.frequency.setValueAtTime(carrierFreq + frequency, ctx.currentTime);

      const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const rightGain = ctx.createGain();
      rightGain.gain.setValueAtTime(0.5, ctx.currentTime);

      if (rightPanner) {
        rightPanner.pan.setValueAtTime(1, ctx.currentTime);
        rightOsc.connect(rightGain).connect(rightPanner).connect(masterGain);
      } else {
        rightOsc.connect(rightGain).connect(masterGain);
      }

      leftOsc.start();
      rightOsc.start();
      leftOscRef.current = leftOsc;
      rightOscRef.current = rightOsc;

      // Brown Noise
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);

      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5;
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(useNoise ? 0.25 : 0, ctx.currentTime);

      noiseSource.connect(filter).connect(noiseGain).connect(masterGain);
      noiseSource.start();

      noiseGainRef.current = noiseGain;
      (ctx as any)._noiseSource = noiseSource;

      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to initialize Web Audio:', err);
    }
  };

  const stopAudio = () => {
    try {
      cancelAnimationFrame(analyzerFrameRef.current);
      if (leftOscRef.current) {
        leftOscRef.current.stop();
        leftOscRef.current.disconnect();
        leftOscRef.current = null;
      }
      if (rightOscRef.current) {
        rightOscRef.current.stop();
        rightOscRef.current.disconnect();
        rightOscRef.current = null;
      }
      if (audioCtxRef.current) {
        const source = (audioCtxRef.current as any)._noiseSource;
        if (source) {
          source.stop();
          source.disconnect();
        }
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      analyzerRef.current = null;
      setAnalyzerData(new Array(32).fill(0));
      setIsPlaying(false);
    } catch (err) {
      console.error('Failed to cleanup Web Audio:', err);
      setIsPlaying(false);
    }
  };

  // Dynamically update differential frequency
  useEffect(() => {
    if (isPlaying && rightOscRef.current && audioCtxRef.current) {
      const carrierFreq = 125;
      rightOscRef.current.frequency.setTargetAtTime(carrierFreq + frequency, audioCtxRef.current.currentTime, 0.1);
    }
  }, [frequency, isPlaying]);

  // Dynamically update master volume
  useEffect(() => {
    if (isPlaying && masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.1);
    }
  }, [volume, isPlaying]);

  // Dynamically toggle noise
  useEffect(() => {
    if (isPlaying && noiseGainRef.current && audioCtxRef.current) {
      noiseGainRef.current.gain.setTargetAtTime(useNoise ? 0.25 : 0, audioCtxRef.current.currentTime, 0.1);
    }
  }, [useNoise, isPlaying]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cancelAnimationFrame(analyzerFrameRef.current);
      if (audioCtxRef.current) {
        try {
          if (leftOscRef.current) { leftOscRef.current.stop(); leftOscRef.current.disconnect(); }
          if (rightOscRef.current) { rightOscRef.current.stop(); rightOscRef.current.disconnect(); }
          const source = (audioCtxRef.current as any)?._noiseSource;
          if (source) { source.stop(); source.disconnect(); }
          audioCtxRef.current.close();
        } catch (_) { /* cleanup best-effort */ }
      }
    };
  }, []);

  // Generate waveform path
  const getSimulatedWavePath = () => {
    const width = 400;
    const height = 100;
    const points = [];
    const amplitude1 = 15;
    const amplitude2 = 12;
    const currentHzMultiplier = frequency * 0.4;

    for (let x = 0; x <= width; x += 2) {
      const rad1 = (x / width) * Math.PI * 4;
      const rad2 = (x / width) * Math.PI * 2 * currentHzMultiplier;
      const y = height / 2 + Math.sin(rad1) * amplitude1 + Math.sin(rad2) * amplitude2;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  const getFreqLabel = () => {
    if (frequency === 10) return 'Alpha State (Deep Calm)';
    if (frequency <= 20) return 'Beta Sweep (Alertness)';
    if (frequency <= 30) return 'High Beta (Intense Logic)';
    return 'Gamma Focus (NeuralSync On-Ramp)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className="w-full glass-card p-6 sm:p-8 rounded-2xl shadow-2xl relative overflow-hidden"
      id="audio-simulator-widget"
    >
      {/* Ambient glow accent */}
      <div className="absolute -top-20 -right-20 w-60 h-60 bg-[#00f3ff]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-[#bd00ff]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-6">
          <Layers className="w-5 h-5 text-[#00f3ff]" />
          <h3 className="font-display font-bold text-lg text-white">Interactive Smart-Ramp Simulator</h3>
        </div>

        <p className="text-sm text-gray-400 mb-6 leading-relaxed">
          Experience the auditory shift. Toggle the simulation and slide from the relaxed <strong className="text-gray-300">10Hz Alpha state</strong> up to the deep cognitive <strong className="text-gray-300">40Hz Gamma protocol</strong>. <em>Best experienced with headphones.</em>
        </p>

        {/* WAVEFORM + EQ VISUALIZER */}
        <div className="w-full bg-black/50 rounded-xl border border-white/5 p-4 mb-6 relative overflow-hidden h-32">
          {/* SVG Waveform */}
          <svg className="w-full h-full absolute inset-0 text-[#00f3ff]/25" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path
              d={getSimulatedWavePath()}
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="transition-all duration-100 ease-out"
            />
          </svg>
          <svg className="w-full h-full absolute inset-0 text-[#bd00ff]/40 blur-[1px]" viewBox="0 0 400 100" preserveAspectRatio="none">
            <path
              d={getSimulatedWavePath()}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              className="transition-all duration-100 ease-out"
            />
          </svg>

          {/* EQ Bars Overlay */}
          <AnimatePresence>
            {isPlaying && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute bottom-2 left-0 right-0 flex items-end justify-center gap-[3px] h-12 px-4"
              >
                {analyzerData.slice(0, 24).map((val, i) => (
                  <div
                    key={i}
                    className="w-[3px] rounded-full transition-all duration-75 ease-out"
                    style={{
                      height: `${Math.max(8, val * 100)}%`,
                      background: `linear-gradient(to top, #00f3ff, #bd00ff)`,
                      opacity: 0.5 + val * 0.5,
                    }}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Center readout */}
          <div className="relative z-10 flex flex-col items-center justify-center h-full text-center">
            <div className="font-mono text-[10px] text-gray-500 uppercase tracking-[0.25em] mb-1">Active Entrainment Freq</div>
            <motion.div
              key={frequency}
              initial={{ scale: 0.9, opacity: 0.7 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-4xl font-mono font-extrabold shimmer-text"
            >
              {frequency}.0 Hz
            </motion.div>
            <div className="font-display text-[10px] text-gray-400 uppercase tracking-[0.2em] mt-1">
              {getFreqLabel()}
            </div>
          </div>
        </div>

        {/* CONTROLS */}
        <div className="space-y-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <button
              onClick={togglePlay}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold font-display tracking-wider uppercase text-xs transition-all duration-300 shadow-md cursor-pointer select-none ${
                isPlaying
                  ? 'bg-red-500/90 hover:bg-red-500 text-white shadow-red-500/15'
                  : 'bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-black hover:scale-[1.03] shadow-[0_0_20px_rgba(0,243,255,0.2)]'
              }`}
            >
              {isPlaying ? (
                <><Square className="w-4 h-4 fill-white" /> Stop Listening</>
              ) : (
                <><Play className="w-4 h-4 fill-black text-black" /> Preview Protocol Tone</>
              )}
            </button>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="noise-layer"
                className="w-4.5 h-4.5 accent-[#bd00ff] rounded border-white/10 cursor-pointer"
                checked={useNoise}
                onChange={(e) => setUseNoise(e.target.checked)}
              />
              <label htmlFor="noise-layer" className="text-xs text-gray-400 cursor-pointer select-none">
                Acoustic Masking (Brownian Noise)
              </label>
            </div>
          </div>

          {/* SLIDERS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400">FREQUENCY SWEEP</span>
                <span className="text-[#00f3ff] font-semibold">{frequency}Hz</span>
              </div>
              <input
                type="range"
                min="10"
                max="40"
                step="1"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value, 10))}
                className="w-full h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer accent-[#00f3ff]"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>ALPHA (10Hz)</span>
                <span>GAMMA (40Hz)</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-gray-400 flex items-center gap-1"><Volume2 className="w-3.5 h-3.5" /> VOLUME LEVEL</span>
                <span className="text-gray-300 font-semibold">{Math.round(volume * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.05"
                max="0.8"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-1.5 rounded-lg appearance-none bg-white/10 cursor-pointer accent-[#bd00ff]"
              />
              <div className="flex justify-between text-[10px] text-gray-500 font-mono">
                <span>SAFE COMFORT</span>
                <span>MAX POWER</span>
              </div>
            </div>
          </div>
        </div>

        {/* PROOF BADGES */}
        <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#00f3ff]/20 transition-colors duration-300">
            <Headphones className="w-4 h-4 text-[#00f3ff] mx-auto mb-1.5" />
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">True Binaural</h4>
            <p className="text-[9px] text-gray-500 mt-0.5">Stereo-separated oscillation</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-[#bd00ff]/20 transition-colors duration-300">
            <Zap className="w-4 h-4 text-[#bd00ff] mx-auto mb-1.5" />
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Smart Sweep</h4>
            <p className="text-[9px] text-gray-500 mt-0.5">Frequency sweep technology</p>
          </div>
          <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl hover:border-emerald-400/20 transition-colors duration-300 col-span-2 sm:col-span-1">
            <ShieldAlert className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
            <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Acoustic Guard</h4>
            <p className="text-[9px] text-gray-500 mt-0.5">Optimized hearing comfort</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
