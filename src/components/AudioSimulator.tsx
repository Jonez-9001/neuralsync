import React, { useState, useRef, useEffect } from 'react';
import { Play, Square, Headphones, Volume2, ShieldAlert, Zap, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export default function AudioSimulator() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [frequency, setFrequency] = useState(10); // Starts at 10Hz (Alpha)
  const [volume, setVolume] = useState(0.3); // Safe default volume
  const [useNoise, setUseNoise] = useState(true);

  // Web Audio API References
  const audioCtxRef = useRef<AudioContext | null>(null);
  const leftOscRef = useRef<OscillatorNode | null>(null);
  const rightOscRef = useRef<OscillatorNode | null>(null);
  const noiseNodeRef = useRef<AudioWorkletNode | ScriptProcessorNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const noiseGainRef = useRef<GainNode | null>(null);

  // Handle Play/Stop Toggle
  const togglePlay = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const startAudio = async () => {
    try {
      // 1. Initialize AudioContext
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // Create Master Gain Node
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(volume, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // 2. Setup Binaural Beats Oscillators
      const carrierFreq = 125; // Left ear starts at 125Hz
      
      // Left ear node path
      const leftOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(carrierFreq, ctx.currentTime);
      
      const leftPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const leftGain = ctx.createGain();
      leftGain.gain.setValueAtTime(0.5, ctx.currentTime); // left ear amplitude 0.5

      if (leftPanner) {
        leftPanner.pan.setValueAtTime(-1, ctx.currentTime);
        leftOsc.connect(leftGain).connect(leftPanner).connect(masterGain);
      } else {
        leftOsc.connect(leftGain).connect(masterGain);
      }

      // Right ear node path
      const rightOsc = ctx.createOscillator();
      rightOsc.type = 'sine';
      rightOsc.frequency.setValueAtTime(carrierFreq + frequency, ctx.currentTime); // 125Hz + 10 to 40Hz = 135Hz to 165Hz
      
      const rightPanner = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
      const rightGain = ctx.createGain();
      rightGain.gain.setValueAtTime(0.5, ctx.currentTime); // right ear amplitude 0.5

      if (rightPanner) {
        rightPanner.pan.setValueAtTime(1, ctx.currentTime);
        rightOsc.connect(rightGain).connect(rightPanner).connect(masterGain);
      } else {
        rightOsc.connect(rightGain).connect(masterGain);
      }

      // Start oscillators
      leftOsc.start();
      rightOsc.start();
      leftOscRef.current = leftOsc;
      rightOscRef.current = rightOsc;

      // 3. Setup Pink/Brown Noise Background for Comfort and Acoustic Shielding
      const bufferSize = 2 * ctx.sampleRate;
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      
      // Generate Brown Noise
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + (0.02 * white)) / 1.02;
        lastOut = output[i];
        output[i] *= 3.5; // Amplify slightly
      }

      const noiseSource = ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      // Soft Bandpass Filter for the noise to sound like ocean waves
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(250, ctx.currentTime);
      filter.Q.setValueAtTime(1.0, ctx.currentTime);

      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(useNoise ? 0.25 : 0, ctx.currentTime);

      noiseSource.connect(filter).connect(noiseGain).connect(masterGain);
      noiseSource.start();

      noiseGainRef.current = noiseGain;
      // Store noise node as a custom property or handle on cleanup
      (ctx as any)._noiseSource = noiseSource;

      setIsPlaying(true);
    } catch (err) {
      console.error('Failed to initialize Web Audio:', err);
    }
  };

  const stopAudio = () => {
    try {
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

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (isPlaying) {
        stopAudio();
      }
    };
  }, [isPlaying]);

  // Generate simulated wave paths for the real-time responsive SVG graph
  const getSimulatedWavePath = () => {
    const width = 400;
    const height = 100;
    const points = [];
    const amplitude1 = 15;
    const amplitude2 = 12;
    // Speed / frequency multiplier based on current alpha/gamma state
    const currentHzMultiplier = frequency * 0.4;
    
    for (let x = 0; x <= width; x += 2) {
      // Combines base sound carrier wave with high-speed focus pulse
      const rad1 = (x / width) * Math.PI * 4;
      const rad2 = (x / width) * Math.PI * 2 * currentHzMultiplier;
      const y = height / 2 + Math.sin(rad1) * amplitude1 + Math.sin(rad2) * amplitude2;
      points.push(`${x},${y}`);
    }
    return `M ${points.join(' L ')}`;
  };

  return (
    <div className="w-full bg-black/75 p-6 sm:p-8 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl" id="audio-simulator-widget">
      <div className="flex items-center gap-2 mb-6">
        <Layers className="w-5 h-5 text-[#00f3ff]" />
        <h3 className="font-display font-bold text-lg text-white">Interactive Smart-Ramp Simulator</h3>
      </div>

      <p className="text-sm text-gray-400 mb-6">
        Experience the auditory shift. Toggle the simulation below and slide from the relaxed **10Hz Alpha state** up to the deep cognitive **40Hz Gamma protocol**. *Best experienced with headphones.*
      </p>

      {/* WAVEFORM VISUALIZER CONTAINER */}
      <div className="w-full bg-black/40 rounded-xl border border-white/5 p-4 mb-6 relative overflow-hidden flex items-center justify-center h-28">
        <svg className="w-full h-full absolute inset-0 text-[#00f3ff]/30" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path 
            d={getSimulatedWavePath()} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="1.5" 
            className="transition-all duration-100 ease-out"
          />
        </svg>

        {/* Outer glowing line representing the frequency spectrum */}
        <svg className="w-full h-full absolute inset-0 text-[#bd00ff]/50 blur-sm" viewBox="0 0 400 100" preserveAspectRatio="none">
          <path 
            d={getSimulatedWavePath()} 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="3.0" 
            className="transition-all duration-100 ease-out"
          />
        </svg>

        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <div className="font-mono text-xs text-gray-500 uppercase tracking-widest mb-1">Active Entrainment Freq</div>
          <motion.div 
            key={frequency}
            initial={{ scale: 0.95, opacity: 0.8 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-4xl font-mono font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bd00ff]"
          >
            {frequency}.0 Hz
          </motion.div>
          <div className="font-display text-[10px] text-gray-400 uppercase tracking-widest mt-1">
            {frequency === 10 ? 'Alpha State (Deep Calm)' : frequency <= 20 ? 'Beta Sweep (Alertness)' : frequency <= 30 ? 'High Beta (Intense Logic)' : 'Gamma Focus (NeuralSync On-Ramp)'}
          </div>
        </div>
      </div>

      {/* CONTROLS GRID */}
      <div className="space-y-6">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold font-display tracking-wider uppercase text-xs transition-all duration-300 shadow-md ${
              isPlaying 
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-red-500/10' 
                : 'bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-black hover:scale-[1.03]'
            }`}
          >
            {isPlaying ? (
              <>
                <Square className="w-4 h-4 fill-white" /> Stop Listening
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-black text-black" /> Preview Protocol Tone
              </>
            )}
          </button>

          {/* Noise layer check */}
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

        {/* SLIDERS SECTION */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-white/5">
          {/* Freq Ramp Slider */}
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

          {/* Volume Control */}
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

      {/* AUDIO PROTOCOL PROOF BADGES */}
      <div className="mt-8 pt-6 border-t border-white/5 grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
          <Headphones className="w-4 h-4 text-[#00f3ff] mx-auto mb-1.5" />
          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">True Binaural</h4>
          <p className="text-[9px] text-gray-500 mt-0.5">Stereo-separated oscillation</p>
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg">
          <Zap className="w-4 h-4 text-[#bd00ff] mx-auto mb-1.5" />
          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Smart Sweep</h4>
          <p className="text-[9px] text-gray-500 mt-0.5">Frequency sweep technology</p>
        </div>
        <div className="p-3 bg-white/[0.02] border border-white/5 rounded-lg col-span-2 sm:col-span-1">
          <ShieldAlert className="w-4 h-4 text-emerald-400 mx-auto mb-1.5" />
          <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Acoustic Guard</h4>
          <p className="text-[9px] text-gray-500 mt-0.5">Optimized hearing comfort</p>
        </div>
      </div>
    </div>
  );
}
