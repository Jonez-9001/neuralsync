import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { motion } from 'motion/react';
import {
  Check, AlertCircle, Sparkles, Cpu, ShieldCheck, ArrowDown,
  Menu, X, Lock, Zap, Infinity, HelpCircle
} from 'lucide-react';
import AudioSimulator from './components/AudioSimulator';
import FaqSection from './components/FaqSection';
import StatsCounter from './components/StatsCounter';
import CountdownTimer from './components/CountdownTimer';
import ComparisonTable from './components/ComparisonTable';
import SocialProofBar from './components/SocialProofBar';
import GuaranteeSection from './components/GuaranteeSection';
import StickyCTA from './components/StickyCTA';
import TopBanner from './components/TopBanner';

// ═══════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════

interface ScrollState {
  checkoutProgress: number;
}

// ═══════════════════════════════════════════════
// NEURAL DIVIDER (lightweight SVG)
// ═══════════════════════════════════════════════

const NeuralDivider: React.FC<{ flip?: boolean }> = ({ flip = false }) => {
  const [vis, setVis] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVis(true); },
      { threshold: 0.3 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div ref={ref} className={`w-full py-4 overflow-hidden ${flip ? 'rotate-180' : ''}`}>
      <svg viewBox="0 0 1200 60" className="w-full h-12 sm:h-16" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id={`sg-${flip ? 'b' : 'a'}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#00f3ff" stopOpacity="0" />
            <stop offset="30%" stopColor="#00f3ff" stopOpacity="0.6" />
            <stop offset="50%" stopColor="#bd00ff" stopOpacity="0.8" />
            <stop offset="70%" stopColor="#00f3ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#bd00ff" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d="M0,30 Q150,5 300,30 T600,30 T900,30 T1200,30" fill="none" stroke={`url(#sg-${flip ? 'b' : 'a'})`} strokeWidth="1.5" strokeDasharray="1000" strokeDashoffset={vis ? '0' : '1000'} style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.16, 1, 0.3, 1)' }} />
        {vis && [200, 500, 800].map((cx, i) => (
          <circle key={i} cx={cx} cy={30} r="3" fill="#00f3ff" opacity="0.7">
            <animate attributeName="r" values="2;5;2" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.5;1;0.5" dur={`${1.5 + i * 0.3}s`} repeatCount="indefinite" />
          </circle>
        ))}
      </svg>
    </div>
  );
};

// ═══════════════════════════════════════════════
// TYPEWRITER TEXT (lightweight)
// ═══════════════════════════════════════════════

const TypewriterText: React.FC<{ text: string; delay?: number }> = ({ text, delay = 1200 }) => {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => { const t = setTimeout(() => setStarted(true), delay); return () => clearTimeout(t); }, [delay]);
  useEffect(() => {
    if (!started) return;
    let i = 0;
    const iv = setInterval(() => { if (i <= text.length) { setDisplayed(text.slice(0, i)); i++; } else clearInterval(iv); }, 50);
    return () => clearInterval(iv);
  }, [started, text]);

  return (
    <span>
      {displayed}
      {started && displayed.length < text.length && (
        <span className="inline-block w-[2px] h-[1em] bg-[#00f3ff] ml-0.5 align-middle" style={{ animation: 'blink-cursor 1s step-end infinite' }} />
      )}
    </span>
  );
};

// ═══════════════════════════════════════════════
// THREE.JS BACKGROUND — PERFORMANCE-OPTIMIZED
// ═══════════════════════════════════════════════

const ThreeBackground: React.FC<{ scrollState: React.RefObject<ScrollState> }> = ({ scrollState }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = mountRef.current;
    if (!el) return;
    while (el.firstChild) el.removeChild(el.firstChild);

    const W = window.innerWidth, H = window.innerHeight;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(70, W / H, 0.1, 800);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: false, powerPreference: 'high-performance' });
    renderer.setSize(W, H);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0)); // Cap at 1.0 for massive performance boost
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.6;
    el.appendChild(renderer.domElement);

    // Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 1.0, 0.5, 0.6); // Reduced bloom
    composer.addPass(bloom);

    const world = new THREE.Group();
    scene.add(world);

    // ── Core TorusKnot ──
    const coreGeo = new THREE.TorusKnotGeometry(1, 0.32, 180, 48);
    const coreUni = {
      uTime: { value: 0 },
      uColor1: { value: new THREE.Color('#bd00ff') },
      uColor2: { value: new THREE.Color('#00f3ff') },
      uDistort: { value: 0.5 },
    };
    const coreMat = new THREE.ShaderMaterial({
      uniforms: coreUni,
      wireframe: true,
      transparent: true,
      depthWrite: false,
      vertexShader: `
        uniform float uTime, uDistort;
        varying vec3 vN;
        varying float vD;
        void main(){
          vN = normal;
          vec3 p = position;
          float n = sin(p.x*2.5+uTime*1.5)*cos(p.y*2.0+uTime*1.5)*sin(p.z*2.5+uTime);
          p += normal * n * uDistort;
          vD = n * uDistort;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p,1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor1, uColor2;
        uniform float uTime;
        varying vec3 vN;
        varying float vD;
        void main(){
          float f = pow(0.5 - dot(normalize(vN), vec3(0,0,1)), 2.0);
          float c = sin(uTime*0.3)*0.5+0.5;
          gl_FragColor = vec4(mix(uColor1, uColor2, f*2.0+c*0.3), 0.8);
        }
      `,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.scale.setScalar(1.6);
    world.add(core);

    // ── Outer Wireframe Icosahedron ──
    const icoGeo = new THREE.IcosahedronGeometry(3, 1);
    const icoMat = new THREE.MeshBasicMaterial({ color: 0x8553ff, wireframe: true, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false });
    const ico = new THREE.Mesh(icoGeo, icoMat);
    world.add(ico);

    // ── Center Pulse ──
    const pulseGeo = new THREE.SphereGeometry(0.2, 24, 24);
    const pulseMat = new THREE.MeshBasicMaterial({ color: 0x00f3ff, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false });
    const pulse = new THREE.Mesh(pulseGeo, pulseMat);
    world.add(pulse);

    // ── 3 Orbital Rings ──
    const mkRing = (r: number, c: number, o: number) => {
      const g = new THREE.TorusGeometry(r, 0.01, 12, 100);
      const m = new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false });
      return new THREE.Mesh(g, m);
    };
    const r1 = mkRing(2.8, 0xbd00ff, 0.2); r1.rotation.x = Math.PI * 0.55;
    const r2 = mkRing(3.2, 0x00f3ff, 0.15); r2.rotation.x = Math.PI * 0.35; r2.rotation.z = -0.4;
    const r3 = mkRing(2.2, 0x8553ff, 0.1); r3.rotation.x = Math.PI * 0.7; r3.rotation.y = 0.5;
    world.add(r1, r2, r3);

    // ── Particles (single lightweight layer) ──
    const pCount = 800; // Reduced from 2500
    const pGeo = new THREE.BufferGeometry();
    const pPos = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount * 3; i++) pPos[i] = (Math.random() - 0.5) * 16;
    pGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    const pMat = new THREE.PointsMaterial({ size: 0.04, color: 0x00f3ff, transparent: true, opacity: 0.45, blending: THREE.AdditiveBlending, depthWrite: false, sizeAttenuation: true });
    const particles = new THREE.Points(pGeo, pMat);
    world.add(particles);

    // Second small purple layer
    const p2Count = 250; // Reduced from 800
    const p2Geo = new THREE.BufferGeometry();
    const p2Pos = new Float32Array(p2Count * 3);
    for (let i = 0; i < p2Count * 3; i++) p2Pos[i] = (Math.random() - 0.5) * 18;
    p2Geo.setAttribute('position', new THREE.BufferAttribute(p2Pos, 3));
    const p2Mat = new THREE.PointsMaterial({ size: 0.05, color: 0xbd00ff, transparent: true, opacity: 0.25, blending: THREE.AdditiveBlending, depthWrite: false });
    const p2 = new THREE.Points(p2Geo, p2Mat);
    world.add(p2);

    // ── Animation ──
    let raf: number;
    const animate = (time: number) => {
      const t = time / 1000;
      const ease = 1 - Math.pow(1 - scrollState.current.checkoutProgress, 2);

      coreUni.uTime.value = t;
      coreUni.uDistort.value = 0.5 - 0.45 * ease;
      core.rotation.x = t * 0.1;
      core.rotation.y = t * 0.15;

      ico.rotation.x = -t * 0.04;
      ico.rotation.y = t * 0.06;

      const ps = 0.15 + Math.sin(t * 2.5) * 0.12;
      pulse.scale.setScalar(ps);
      pulseMat.opacity = 0.3 + Math.sin(t * 2.5) * 0.25;

      world.position.y = Math.sin(t) * 0.15;

      r1.rotation.z = t * 0.06; r1.rotation.y = t * 0.08;
      r2.rotation.z = -t * 0.04; r2.rotation.x = Math.PI * 0.35 + Math.sin(t * 0.4) * 0.08;
      r3.rotation.z = t * 0.07;

      particles.rotation.y = t * 0.02;
      p2.rotation.y = -t * 0.015;

      bloom.strength = 1.4 - 0.6 * ease;
      composer.render();
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const onResize = () => {
      const w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h); composer.setSize(w, h);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(raf);
      if (el.contains(renderer.domElement)) el.removeChild(renderer.domElement);
      [coreGeo, icoGeo, pulseGeo, r1.geometry, r2.geometry, r3.geometry, pGeo, p2Geo].forEach(g => g.dispose());
      [coreMat, icoMat, pulseMat, r1.material, r2.material, r3.material, pMat, p2Mat].forEach(m => (m as THREE.Material).dispose());
      renderer.dispose(); composer.dispose();
    };
  }, [scrollState]);

  return <div ref={mountRef} className="w-full h-full" />;
};

// ═══════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════

export default function App() {
  const checkoutRef = useRef<HTMLElement>(null);
  const scrollState = useRef<ScrollState>({ checkoutProgress: 0 });

  const [legalAgreed, setLegalAgreed] = useState(false);
  const [showDisclaimerWarning, setShowDisclaimerWarning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Lightweight scroll handler — no canvas transforms
  useEffect(() => {
    const onScroll = () => {
      if (checkoutRef.current) {
        const rect = checkoutRef.current.getBoundingClientRect();
        const s = window.innerHeight;
        const e = s / 2 - rect.height / 2;
        if (s !== e) scrollState.current.checkoutProgress = Math.max(0, Math.min(1, (s - rect.top) / (s - e)));
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div className="relative w-full min-h-screen bg-black text-white font-sans overflow-x-hidden">

      {/* 3D Background — fixed, no scroll transform */}
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-0">
        <ThreeBackground scrollState={scrollState} />
      </div>

      <TopBanner />

      {/* ── HEADER ── */}
      <header className="sticky top-0 left-0 w-full z-50 px-6 py-4 md:px-12 flex justify-between items-center bg-black/60 border-b border-white/5" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)' }}>
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] animate-pulse" />
          <span className="font-display font-semibold tracking-wider uppercase text-sm">NeuralSync 40</span>
        </div>

        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-gray-300">
          <button onClick={() => scrollTo('science-section')} className="hover:text-[#00f3ff] transition-colors cursor-pointer">Science</button>
          <button onClick={() => scrollTo('interactive-simulator-section')} className="hover:text-[#00f3ff] transition-colors cursor-pointer">Simulator</button>
          <button onClick={() => scrollTo('checkout-section')} className="hover:text-[#bd00ff] transition-colors cursor-pointer font-bold text-[#bd00ff]">Get Protocol</button>
          <button onClick={() => scrollTo('faq-support-section')} className="hover:text-[#00f3ff] transition-colors cursor-pointer">FAQ</button>
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:flex px-2.5 py-1 rounded bg-white/5 border border-white/10 items-center gap-1.5 text-xs font-mono text-gray-400">
            <Cpu className="w-3 h-3 text-[#00f3ff]" /> Smart-Ramp v1.4
          </span>
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-gray-300 hover:text-white cursor-pointer" aria-label="Toggle menu">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* ── MOBILE MENU ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 flex flex-col items-center justify-center space-y-8 font-display text-xl tracking-widest uppercase md:hidden">
          {['Home', 'Science', 'Simulator', 'Get Protocol', 'FAQ'].map((label, i) => (
            <button key={i} onClick={() => {
              if (label === 'Home') { window.scrollTo({ top: 0, behavior: 'smooth' }); setMobileMenuOpen(false); }
              else scrollTo(label === 'Get Protocol' ? 'checkout-section' : `${label.toLowerCase().replace(/ /g, '-')}-section`);
            }} className={`transition-colors cursor-pointer ${label === 'Get Protocol' ? 'text-[#bd00ff] font-bold' : 'text-gray-400 hover:text-white'}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {/* ── CONTENT ── */}
      <div className="relative z-10 w-full">

        {/* ══ HERO ══ */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 relative" id="hero-section">
          <div className="text-center max-w-4xl mx-auto space-y-6 relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00f3ff] tracking-wider uppercase"
            >
              <Sparkles className="w-3.5 h-3.5" /> Early Access Protocol Now Active
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              className="font-display text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter shimmer-text"
              id="main-title"
            >
              NEURALSYNC 40
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.5 }}
              className="text-lg sm:text-2xl tracking-[0.3em] text-[#00f3ff] uppercase font-light font-display"
            >
              <TypewriterText text="The Neural On-Ramp™ Protocol" delay={1200} />
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, delay: 0.8 }}
              className="max-w-xl mx-auto text-gray-400 text-sm sm:text-base leading-relaxed"
            >
              Unlock continuous, deep cognitive flow states without the standard mental fatigue. 40Hz auditory sequencing engineered for precision focus.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4"
            >
              <button onClick={() => scrollTo('checkout-section')} className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-[#00f3ff] via-[#8553ff] to-[#bd00ff] text-white font-display font-bold tracking-wider uppercase text-sm hover:scale-[1.03] active:scale-[0.97] transition-all duration-300 shadow-[0_0_30px_rgba(0,243,255,0.25)] cursor-pointer">
                Get the Protocol
              </button>
              <button onClick={() => scrollTo('science-section')} className="px-8 py-3.5 rounded-xl border border-white/10 bg-white/5 text-gray-300 font-display font-medium tracking-wider uppercase text-sm hover:bg-white/10 hover:text-white transition-all duration-300 cursor-pointer">
                Explore the Science
              </button>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.6, y: [0, 8, 0] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: 2.5 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-500 font-mono text-[10px] tracking-widest uppercase cursor-pointer"
            onClick={() => scrollTo('science-section')}
          >
            Scroll to Analyze
            <ArrowDown className="w-4 h-4 text-[#00f3ff] mt-1" />
          </motion.div>
        </section>

        {/* ══ TRUST STRIP ══ */}
        <section className="relative z-10 w-full border-y border-white/5 bg-black/40 py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16 md:gap-24 text-xs font-mono text-gray-500 uppercase tracking-widest">
            {[
              { icon: <Lock className="w-4 h-4 text-gray-400" />, label: '256-Bit SSL Encryption' },
              { icon: <Zap className="w-4 h-4 text-gray-400" />, label: 'Instant Delivery' },
              { icon: <Infinity className="w-4 h-4 text-gray-400" />, label: 'Lifetime Access' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300">
                {item.icon}<span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <NeuralDivider />
        <StatsCounter />
        <NeuralDivider flip />

        {/* ══ SCIENCE / FEATURES ══ */}
        <section id="science-section" className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-10 py-28">
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="text-center mb-16">
            <h2 className="text-sm font-mono text-[#00f3ff] tracking-[0.3em] uppercase mb-4">Core Architecture</h2>
            <h3 className="text-3xl sm:text-5xl font-bold text-white">Engineered for <span className="shimmer-text">Precision Focus</span></h3>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
            {[
              { tag: '01 / SWEEP', title: 'The 40Hz Gamma Sweep', desc: '40Hz is the operating frequency of cognitive integration. Our sweep locks your sensory inputs into high-harmony states without the jarring entry.', color: '#00f3ff' },
              { tag: '02 / SHOCK', title: 'Preventing Neural Shock', desc: 'By starting the entrainment at a resting 10Hz Alpha state and smoothly bridging up, we bypass the resistance that dictates standard audio fatigue.', color: '#bd00ff', lift: true },
              { tag: '03 / FATIGUE', title: 'Zero Sensory Fatigue', desc: 'Traditional binaural beats sound harsh. Our protocol uses organic, layered soundscapes to soften the wave, allowing for hours of listening with absolute safety.', color: '#00f3ff' },
            ].map((card, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.7, delay: idx * 0.15 }}
                className={`group relative rounded-2xl p-[1px] ${card.lift ? 'md:-translate-y-6' : ''}`}
                style={{ background: `linear-gradient(to bottom, ${card.color}40, transparent)` }}
              >
                <div className="h-full bg-black/70 rounded-2xl p-6 sm:p-10 border border-white/5 hover:border-white/10 transition-all duration-500">
                  <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-700" style={{ background: `radial-gradient(circle, ${card.color}12, transparent 70%)` }} />
                  <div className="font-mono text-xs mb-4 tracking-widest inline-block px-3 py-1 rounded-full border" style={{ color: card.color, borderColor: `${card.color}4D` }}>
                    {card.tag}
                  </div>
                  <h4 className="text-2xl font-bold text-white mb-4">{card.title}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{card.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        <NeuralDivider />

        {/* ══ COMPARISON TABLE (Market Research Feature) ══ */}
        <section id="comparison-section" className="relative z-10 py-20 px-4 sm:px-10">
          <ComparisonTable />
        </section>

        <NeuralDivider flip />

        {/* ══ COUNTDOWN TIMER (Market Research Feature) ══ */}
        <section className="relative z-10 py-12 px-4 sm:px-10">
          <CountdownTimer />
        </section>

        <NeuralDivider />

        {/* ══ SIMULATOR ══ */}
        <section id="interactive-simulator-section" className="flex items-center justify-center lg:justify-end px-4 sm:px-12 md:px-20 py-24">
          <div className="w-full max-w-2xl">
            <AudioSimulator />
          </div>
        </section>

        <NeuralDivider />

        {/* ══ GUARANTEE (Market Research Feature) ══ */}
        <section className="relative z-10">
          <GuaranteeSection />
        </section>

        <NeuralDivider flip />

        {/* ══ CHECKOUT ══ */}
        <section ref={checkoutRef} id="checkout-section" className="min-h-screen flex items-center justify-center lg:justify-end px-4 sm:px-12 md:px-20 pb-20 pt-10">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-2xl bg-black/70 border border-[#00f3ff]/20 p-6 sm:p-10 rounded-2xl shadow-[0_0_60px_rgba(0,243,255,0.08)] relative overflow-hidden"
          >
            <div className="absolute -top-24 -right-24 w-72 h-72 bg-[#00f3ff]/4 rounded-full blur-[80px] pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-[#bd00ff]/4 rounded-full blur-[60px] pointer-events-none" />

            <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="font-display text-3xl sm:text-4xl font-bold text-white" id="checkout-heading">Access the Protocol</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">Acquire high-fidelity physical audio assets instantly.</p>
                </div>
                <div className="text-right">
                  <div className="text-lg font-mono text-gray-500 line-through">$38.00</div>
                  <div className="text-3xl sm:text-4xl font-mono shimmer-text font-bold">$19.00</div>
                  <div className="text-gray-500 text-[10px] uppercase font-mono tracking-wider">USD One-Time</div>
                </div>
              </div>

              <div className="bg-black/50 border border-white/5 rounded-xl p-5 sm:p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Standard Tier */}
                  <div className="relative border border-white/10 rounded-xl p-4 hover:border-[#00f3ff]/50 transition-colors cursor-pointer group">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-white group-hover:text-[#00f3ff] transition-colors">Standard Access</h4>
                      <span className="font-mono text-xl font-bold">$19</span>
                    </div>
                    <ul className="text-gray-400 text-xs space-y-2 mt-4">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#00f3ff]" /> 40Hz Master Protocol</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#00f3ff]" /> Digital Guidebook</li>
                    </ul>
                  </div>

                  {/* Pro Tier */}
                  <div className="relative border border-[#bd00ff]/50 bg-[#bd00ff]/5 rounded-xl p-4 cursor-pointer group">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#bd00ff] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                      Most Popular
                    </div>
                    <div className="flex justify-between items-start mb-2 mt-2">
                      <h4 className="font-bold text-white group-hover:text-[#bd00ff] transition-colors">Pro Bundle</h4>
                      <span className="font-mono text-xl font-bold">$39</span>
                    </div>
                    <ul className="text-gray-300 text-xs space-y-2 mt-4">
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#bd00ff]" /> Everything in Standard</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#bd00ff]" /> Deep Sleep Protocol</li>
                      <li className="flex items-center gap-2"><Check className="w-3 h-3 text-[#bd00ff]" /> Flow State Blueprint Video</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Order Bump */}
              <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-4 mb-6 flex items-start gap-3">
                <input type="checkbox" id="order-bump" className="mt-1 w-4 h-4 accent-blue-500" />
                <label htmlFor="order-bump" className="text-xs text-gray-300 cursor-pointer select-none">
                  <span className="font-bold text-white text-sm block mb-1">Add "10-Minute Rapid Reset" Audio (+$9)</span>
                  A condensed version of the protocol perfect for quick breaks between deep work blocks. 73% of customers add this.
                </label>
              </div>

              <div className="bg-black/50 border border-white/5 rounded-xl p-4 sm:p-5 mb-6">
                <div className="flex items-start cursor-pointer">
                  <input type="checkbox" id="epilepsy-warning" className="w-5 h-5 accent-[#bd00ff] mr-3 cursor-pointer mt-0.5 flex-shrink-0 rounded" checked={legalAgreed} onChange={(e) => { setLegalAgreed(e.target.checked); if (e.target.checked) setShowDisclaimerWarning(false); }} />
                  <label htmlFor="epilepsy-warning" className="text-xs text-gray-400 leading-relaxed cursor-pointer select-none">
                    I confirm that <strong className="text-white">I do not have a history of epilepsy or seizures</strong>, and understand that binaural beats and entrainment frequencies are designed for safe mental exercise only.
                  </label>
                </div>
              </div>

              {showDisclaimerWarning && (
                <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span>You must agree to the medical disclaimer before you can access the protocol.</span>
                </motion.div>
              )}

              <a
                href={legalAgreed ? "https://jonesy1238.gumroad.com/l/gxgtm" : "#"}
                target={legalAgreed ? "_blank" : "_self"}
                rel="noopener noreferrer"
                className={`block w-full py-4 text-center font-bold font-display text-lg rounded-xl transition-all duration-300 select-none ${legalAgreed ? "bg-gradient-to-r from-[#00f3ff] via-[#8553ff] to-[#bd00ff] text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_30px_rgba(0,243,255,0.25)]" : "bg-gray-800 text-gray-500 cursor-not-allowed"}`}
                onClick={(e) => { if (!legalAgreed) { e.preventDefault(); setShowDisclaimerWarning(true); } }}
                id="checkout-action-button"
              >
                Complete Order
              </a>
            </div>
          </motion.div>
        </section>

        <NeuralDivider flip />

        {/* ══ TESTIMONIALS ══ */}
        <section id="trust-backing-section" className="relative z-10 flex flex-col items-center justify-center px-4 sm:px-10 py-20">
          <div className="w-full max-w-5xl">
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ duration: 0.7 }} className="flex items-center gap-4 mb-12">
              <div className="h-[1px] w-12 bg-[#bd00ff]" />
              <h3 className="text-sm font-mono text-[#bd00ff] tracking-[0.2em] uppercase">User Telemetry</h3>
              <div className="h-[1px] flex-grow bg-gradient-to-r from-[#bd00ff] to-transparent" />
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { text: '"The 40Hz transition completely eliminated my usual afternoon brain fog. I\'ve never experienced deep work synchronization this quickly."', name: 'Dr. Elena Rostova', role: 'Cognitive Researcher', color: '#00f3ff' },
                { text: '"Absolutely unreal state of flow. The difference in my cognitive stamina is night and day. I leave the protocol on for hours."', name: 'Marcus Vance', role: 'Senior Engineer', color: '#bd00ff' },
                { text: '"I was deeply skeptical. After one week of consistent sessions, my concentration during complex modeling work improved by what felt like an order of magnitude."', name: 'Dr. Aisha Patel', role: 'Data Scientist', color: '#00f3ff' },
                { text: '"The Smart-Ramp entry is what sets this apart. Other tools gave me headaches. NeuralSync 40 is smooth and I barely notice the transition."', name: 'James Chen', role: 'Product Designer', color: '#bd00ff' },
              ].map((t, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.6, delay: idx * 0.1 }}
                  className="bg-black/50 border border-white/5 hover:border-white/10 rounded-xl p-6 transition-all duration-300 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-[2px] h-full" style={{ background: `linear-gradient(to bottom, ${t.color}, transparent)` }} />
                  <div className="flex text-yellow-400 mb-3 pl-4">
                    ★★★★★
                  </div>
                  <p className="text-gray-300 italic mb-4 leading-relaxed text-sm pl-4">{t.text}</p>
                  <div className="flex items-center gap-3 pl-4">
                    <div className="w-9 h-9 rounded-full border flex items-center justify-center font-bold text-xs" style={{ background: `linear-gradient(135deg, ${t.color}, black)`, borderColor: `${t.color}80` }}>
                      {t.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-white font-bold text-sm flex items-center gap-1.5">
                        {t.name}
                        <ShieldCheck className="w-3 h-3 text-emerald-400" />
                      </div>
                      <div className="font-mono text-[10px] uppercase" style={{ color: t.color }}>{t.role}</div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FAQ ══ */}
        <section id="faq-support-section" className="py-24 px-4 sm:px-12 md:px-20 bg-black/60">
          <FaqSection />
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="relative z-10 border-t border-white/5 bg-black/80 py-12 px-6 sm:px-12">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#00f3ff] to-[#bd00ff]" />
              <span className="font-display font-semibold tracking-wider uppercase text-xs text-gray-400">NeuralSync 40</span>
            </div>
            <div className="text-[10px] font-mono text-gray-600 tracking-wider text-center sm:text-right">
              <p>© {new Date().getFullYear()} NeuralSync 40. All rights reserved.</p>
              <p className="mt-1">Precision-engineered 40Hz gamma entrainment for cognitive enhancement.</p>
            </div>
          </div>
        </footer>

        {/* Floating help button */}
        <button onClick={() => scrollTo('faq-support-section')} className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-black hover:scale-110 active:scale-95 transition-all duration-300 shadow-lg cursor-pointer" aria-label="FAQ">
          <HelpCircle className="w-5 h-5" />
        </button>
      </div>

      {/* ══ CONVERSION OVERLAYS ══ */}
      <SocialProofBar />
      <StickyCTA />
    </div>
  );
}
