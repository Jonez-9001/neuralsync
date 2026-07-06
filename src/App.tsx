import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { motion } from 'motion/react';
import { Check, AlertCircle, Sparkles, Cpu, ShieldCheck, ArrowDown, Menu, X, Lock, Zap, Infinity, HelpCircle } from 'lucide-react';
import AudioSimulator from './components/AudioSimulator';
import FaqSection from './components/FaqSection';
import { ResearchAssistant } from './components/ResearchAssistant';

// TYPE DEFINITIONS FOR ARCHITECTURE SAFETY
interface ScrollState {
  globalProgress: number;
  checkoutProgress: number;
}

interface ThreeBackgroundProps {
  scrollState: React.RefObject<ScrollState>;
}

// COMPONENT 1: Vanilla Three.js Matrix (Architecture Override)
const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ scrollState }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentMount = mountRef.current;
    if (!currentMount) return;

    // Clear any leftover canvases from React Strict Mode double-render cycle
    while (currentMount.firstChild) {
      currentMount.removeChild(currentMount.firstChild);
    }

    // 1. Scene Construction
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentMount.appendChild(renderer.domElement);

    // 2. Float Matrix
    const floatGroup = new THREE.Group();
    scene.add(floatGroup);

    // 3. Neural Core Shader Architecture
    const coreGeometry = new THREE.TorusKnotGeometry(1, 0.3, 256, 64);
    
    const uniforms = {
      uTime: { value: 0 },
      uColor: { value: new THREE.Color("#bd00ff") },
      uEmissive: { value: new THREE.Color("#00f3ff") },
      uDistort: { value: 0.6 },
      uSpeed: { value: 2.5 }
    };

    const coreMaterial = new THREE.ShaderMaterial({
      uniforms: uniforms,
      wireframe: true,
      transparent: true,
      vertexShader: `
        uniform float uTime;
        uniform float uDistort;
        uniform float uSpeed;
        varying vec3 vNormal;

        void main() {
          vNormal = normal;
          vec3 pos = position;
          
          // Liquid morphing physics
          float noise = sin(pos.x * 3.0 + uTime * uSpeed) * cos(pos.y * 3.0 + uTime * uSpeed) * sin(pos.z * 3.0 + uTime * uSpeed);
                        
          pos += normal * noise * uDistort;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform vec3 uEmissive;
        varying vec3 vNormal;
        
        void main() {
          vec3 normalVal = normalize(vNormal);
          float intensity = pow(0.6 - dot(normalVal, vec3(0.0, 0.0, 1.0)), 2.0);
          vec3 finalColor = mix(uColor, uEmissive, intensity * 2.0);
          gl_FragColor = vec4(finalColor, 0.9);
        }
      `
    });

    const coreMesh = new THREE.Mesh(coreGeometry, coreMaterial);
    coreMesh.scale.set(1.5, 1.5, 1.5);
    floatGroup.add(coreMesh);

    // 4. Particle Field Distribution
    const particleCount = 2500;
    const particlesGeometry = new THREE.BufferGeometry();
    const posArray = new Float32Array(particleCount * 3);
    
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 12;
    }
    
    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.06,
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    floatGroup.add(particlesMesh);

    // 5. Execution Loop
    let animationFrameId: number;
    
    const animate = (time: number) => {
      const t = time / 1000;
      
      // Interpolate Shader properties based on Scroll State
      const { checkoutProgress } = scrollState.current;
      
      // GSAP power2.out equivalent math
      const easeOut = 1 - Math.pow(1 - checkoutProgress, 2);
      
      uniforms.uTime.value = t;
      uniforms.uDistort.value = 0.6 - (0.6 * easeOut); // 0.6 -> 0.0
      uniforms.uSpeed.value = 2.5 - (2.0 * easeOut);   // 2.5 -> 0.5

      // Internal Rotation
      coreMesh.rotation.x = t * 0.2;
      coreMesh.rotation.y = t * 0.3;

      // Float Oscillation
      floatGroup.position.y = Math.sin(t * 2.0) * 0.3;
      
      // Particle Drift
      particlesMesh.rotation.y = t * 0.05;

      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };

    animationFrameId = requestAnimationFrame(animate);

    // 6. Viewport Constraints
    const handleResize = () => {
      if (!currentMount) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      renderer.setSize(width, height);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    };

    window.addEventListener('resize', handleResize);

    // 7. GC / Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      if (currentMount && renderer.domElement) {
        if (currentMount.contains(renderer.domElement)) {
          currentMount.removeChild(renderer.domElement);
        }
      }
      coreGeometry.dispose();
      coreMaterial.dispose();
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      renderer.dispose();
    };
  }, [scrollState]);

  return <div ref={mountRef} className="w-full h-full" id="three-webgl-canvas" />;
};

// COMPONENT 2: Main Architectural Entry Point
export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const checkoutRef = useRef<HTMLElement>(null);
  
  // Shared state bridge between DOM scroll and WebGL loop
  const scrollState = useRef<ScrollState>({ globalProgress: 0, checkoutProgress: 0 });
  
  // State for safety and validation
  const [legalAgreed, setLegalAgreed] = useState(false);
  const [showDisclaimerWarning, setShowDisclaimerWarning] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Native mathematics replacing GSAP ScrollTrigger
    const handleScroll = () => {
      // 1. Global Timeline (Parallax Transform)
      const scrollY = window.scrollY;
      const maxScroll = document.body.scrollHeight - window.innerHeight;
      const globalProgress = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0;
      scrollState.current.globalProgress = globalProgress;
      
      if (canvasContainerRef.current) {
        const currentScale = 1 + (0.6 * globalProgress); // 1.0 -> 1.6
        const currentX = -25 * globalProgress;           // 0 -> -25vw
        canvasContainerRef.current.style.transform = `translate3d(${currentX}vw, 0, 0) scale(${currentScale})`;
      }

      // 2. Checkout Section Timeline (Material Distortion Smoothing)
      if (checkoutRef.current) {
        const rect = checkoutRef.current.getBoundingClientRect();
        const startScroll = window.innerHeight; // Top of section hits bottom of viewport
        const endScroll = window.innerHeight / 2 - rect.height / 2; // Center of section hits center of viewport
        
        if (startScroll !== endScroll) {
          const localProgress = (startScroll - rect.top) / (startScroll - endScroll);
          scrollState.current.checkoutProgress = Math.max(0, Math.min(1, localProgress));
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll);
    handleScroll(); 

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div ref={containerRef} className="relative w-full min-h-screen bg-black text-white font-sans overflow-x-hidden selection:bg-[#00f3ff]/30 selection:text-white">
      
      {/* 3D Canvas Background */}
      <div 
        ref={canvasContainerRef} 
        className="fixed top-0 left-0 w-full h-screen pointer-events-none z-0"
        style={{ willChange: 'transform' }}
        id="bg-3d-stage"
      >
        <ThreeBackground scrollState={scrollState} />
      </div>

      {/* Glowing atmospheric dust effect */}
      <div className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(circle_at_center,rgba(189,0,255,0.05)_0%,rgba(0,0,0,0)_70%)]" />

      {/* Top Header Navigation bar */}
      <header className="fixed top-0 left-0 w-full z-50 px-6 py-4 md:px-12 flex justify-between items-center backdrop-blur-md bg-black/30 border-b border-white/5">
        <div className="flex items-center gap-2 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] animate-pulse" />
          <span className="font-display font-semibold tracking-wider uppercase text-sm">NeuralSync 40</span>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase text-gray-300">
          <button 
            onClick={() => document.getElementById('science-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#00f3ff] transition-colors cursor-pointer"
          >
            Science
          </button>
          <button 
            onClick={() => document.getElementById('research-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#00f3ff] text-[#00f3ff]/90 border border-[#00f3ff]/20 bg-[#00f3ff]/5 px-2 py-1 rounded transition-colors cursor-pointer"
          >
            Research AI
          </button>
          <button 
            onClick={() => document.getElementById('interactive-simulator-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#00f3ff] transition-colors cursor-pointer"
          >
            Simulator
          </button>
          <button 
            onClick={() => document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#bd00ff] transition-colors cursor-pointer font-bold text-[#bd00ff]"
          >
            Get Protocol
          </button>
          <button 
            onClick={() => document.getElementById('trust-backing-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#00f3ff] transition-colors cursor-pointer"
          >
            Testimonials
          </button>
          <button 
            onClick={() => document.getElementById('faq-support-section')?.scrollIntoView({ behavior: 'smooth' })}
            className="hover:text-[#00f3ff] transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </nav>

        <div className="flex items-center gap-4">
          <span className="hidden sm:flex px-2.5 py-1 rounded bg-white/5 border border-white/10 items-center gap-1.5 text-xs font-mono text-gray-400">
            <Cpu className="w-3 h-3 text-[#00f3ff]" />
            Smart-Ramp v1.4
          </span>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-gray-300 hover:text-white focus:outline-none cursor-pointer"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 flex flex-col items-center justify-center space-y-8 font-display text-xl tracking-widest uppercase md:hidden">
          <button 
            onClick={() => {
              window.scrollTo({ top: 0, behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            Home
          </button>
          <button 
            onClick={() => {
              document.getElementById('science-section')?.scrollIntoView({ behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="text-gray-400 hover:text-[#00f3ff] transition-colors cursor-pointer"
          >
            Science
          </button>
          <button 
            onClick={() => {
              document.getElementById('research-section')?.scrollIntoView({ behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="text-[#00f3ff]/90 hover:text-white border border-[#00f3ff]/20 bg-[#00f3ff]/5 px-4 py-1.5 rounded transition-colors cursor-pointer"
          >
            Research AI
          </button>
          <button 
            onClick={() => {
              document.getElementById('interactive-simulator-section')?.scrollIntoView({ behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="text-gray-400 hover:text-[#00f3ff] transition-colors cursor-pointer"
          >
            Simulator
          </button>
          <button 
            onClick={() => {
              document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="text-[#bd00ff] font-bold hover:text-white transition-colors cursor-pointer"
          >
            Get Protocol
          </button>
          <button 
            onClick={() => {
              document.getElementById('trust-backing-section')?.scrollIntoView({ behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="text-gray-400 hover:text-[#00f3ff] transition-colors cursor-pointer"
          >
            Testimonials
          </button>
          <button 
            onClick={() => {
              document.getElementById('faq-support-section')?.scrollIntoView({ behavior: 'smooth' });
              setMobileMenuOpen(false);
            }}
            className="text-gray-400 hover:text-white transition-colors cursor-pointer"
          >
            FAQ
          </button>
        </div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10 w-full">
        
        {/* HERO SECTION */}
        <section className="min-h-screen flex flex-col items-center justify-center px-4 relative">
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-[#00f3ff] tracking-wider uppercase mb-2"
            >
              <Sparkles className="w-3.5 h-3.5" /> Early Access Protocol Now Active
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
              className="font-display text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] via-[#8553ff] to-[#bd00ff] drop-shadow-[0_0_30px_rgba(0,243,255,0.25)]"
              id="main-title"
            >
              NEURALSYNC 40
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.5 }}
              className="text-lg sm:text-2xl tracking-widest text-[#00f3ff] uppercase font-light font-display"
              id="main-subtitle"
            >
              The Neural On-Ramp™ Protocol
            </motion.p>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.5, delay: 0.7 }}
              className="max-w-xl mx-auto text-gray-400 text-sm sm:text-base leading-relaxed"
            >
              Unlock continuous, deep cognitive flow states without the standard mental fatigue. 40Hz auditory sequencing engineered for precision focus.
            </motion.p>
          </div>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 0.8, y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-gray-500 font-mono text-[10px] tracking-widest uppercase cursor-pointer"
            onClick={() => {
              const scienceSection = document.getElementById('science-section');
              if (scienceSection) {
                scienceSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            Scroll to Analyze
            <ArrowDown className="w-4 h-4 text-[#00f3ff] mt-1" />
          </motion.div>
        </section>

        {/* SECURITY & TRUST STRIP */}
        <section className="relative z-10 w-full border-y border-white/5 bg-black/20 backdrop-blur-sm py-8">
          <div className="max-w-6xl mx-auto px-6 flex flex-col sm:flex-row justify-center items-center gap-8 sm:gap-16 md:gap-24 text-xs font-mono text-gray-500 uppercase tracking-widest">
            <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300">
              <Lock className="w-4 h-4 text-gray-400" />
              <span>256-Bit SSL Encryption</span>
            </div>
            <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300">
              <Zap className="w-4 h-4 text-gray-400" />
              <span>Instant Delivery</span>
            </div>
            <div className="flex items-center gap-3 opacity-40 hover:opacity-100 transition-opacity duration-300">
              <Infinity className="w-4 h-4 text-gray-400" />
              <span>Lifetime Access</span>
            </div>
          </div>
        </section>

        {/* THE SCIENCE & FEATURES SECTION - HUD STYLE */}
        <section id="science-section" className="min-h-screen relative z-10 flex flex-col items-center justify-center px-4 sm:px-10 py-32 overflow-hidden">
          {/* Section Header */}
          <div className="text-center mb-20">
            <h2 className="text-sm font-mono text-[#00f3ff] tracking-[0.3em] uppercase mb-4">Core Architecture</h2>
            <h3 className="text-3xl sm:text-5xl font-bold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
              Engineered for <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00f3ff] to-[#bd00ff]">Precision Focus</span>
            </h3>
          </div>

          {/* Cyberpunk Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto w-full">
            
            {/* Card 1 */}
            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-[#00f3ff]/40 to-transparent hover:from-[#00f3ff] transition-all duration-500">
              <div className="absolute inset-0 bg-[#00f3ff]/0 group-hover:bg-[#00f3ff]/10 blur-xl transition-all duration-500 rounded-2xl"></div>
              <div className="relative h-full bg-black/60 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="text-[#00f3ff] font-mono text-xs mb-4 tracking-widest border border-[#00f3ff]/30 inline-block px-3 py-1 rounded-full">01 / SWEEP</div>
                  <h4 className="text-2xl font-bold text-white mb-4">The 40Hz Gamma Sweep</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    40Hz is the operating frequency of cognitive integration. Our sweep locks your sensory inputs into high-harmony states without the jarring entry.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-[#bd00ff]/40 to-transparent hover:from-[#bd00ff] transition-all duration-500 transform md:-translate-y-8">
              <div className="absolute inset-0 bg-[#bd00ff]/0 group-hover:bg-[#bd00ff]/10 blur-xl transition-all duration-500 rounded-2xl"></div>
              <div className="relative h-full bg-black/60 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="text-[#bd00ff] font-mono text-xs mb-4 tracking-widest border border-[#bd00ff]/30 inline-block px-3 py-1 rounded-full">02 / SHOCK</div>
                  <h4 className="text-2xl font-bold text-white mb-4">Preventing Neural Shock</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    By starting the entrainment at a resting 10Hz Alpha state and smoothly bridging up, we bypass the resistance that dictates standard audio fatigue.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative p-[1px] rounded-2xl bg-gradient-to-b from-[#00f3ff]/40 to-transparent hover:from-[#00f3ff] transition-all duration-500">
              <div className="absolute inset-0 bg-[#00f3ff]/0 group-hover:bg-[#00f3ff]/10 blur-xl transition-all duration-500 rounded-2xl"></div>
              <div className="relative h-full bg-black/60 backdrop-blur-2xl p-6 sm:p-10 rounded-2xl border border-white/5 flex flex-col justify-between">
                <div>
                  <div className="text-[#00f3ff] font-mono text-xs mb-4 tracking-widest border border-[#00f3ff]/30 inline-block px-3 py-1 rounded-full">03 / FATIGUE</div>
                  <h4 className="text-2xl font-bold text-white mb-4">Zero Sensory Fatigue</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">
                    Traditional binaural beats sound harsh. Our protocol uses organic, layered soundscapes to soften the wave, allowing for hours of listening with absolute safety.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* RESEARCH ASSISTANT SECTION */}
        <section id="research-section" className="relative z-10 py-16 px-4 sm:px-10">
          <ResearchAssistant />
        </section>

        {/* INTERACTIVE PLAYGROUND / SIMULATOR SECTION */}
        <section id="interactive-simulator-section" className="min-h-screen flex items-center justify-center lg:justify-end px-4 sm:px-12 md:px-20 py-24">
          <div className="w-full max-w-2xl">
            <AudioSimulator />
          </div>
        </section>

        {/* CHECKOUT SECTION */}
        <section ref={checkoutRef} id="checkout-section" className="min-h-screen flex items-center justify-center lg:justify-end px-4 sm:px-12 md:px-20 pb-20 pt-10">
          <div className="w-full max-w-2xl bg-black/80 p-6 sm:p-10 rounded-2xl backdrop-blur-xl border border-[#00f3ff]/40 shadow-[0_0_50px_rgba(0,243,255,0.15)]">
            
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="font-display text-3xl sm:text-4xl font-bold text-white" id="checkout-heading">Access the Protocol</h2>
                <p className="text-gray-400 text-xs sm:text-sm mt-1">Acquire high-fidelity physical audio assets instantly.</p>
              </div>
              <div className="text-right">
                <div className="text-3xl sm:text-4xl font-mono text-[#00f3ff] font-bold">$19.00</div>
                <div className="text-gray-500 text-[10px] uppercase font-mono tracking-wider">USD One-Time</div>
              </div>
            </div>
            
            <div className="bg-white/5 p-5 sm:p-6 rounded-xl mb-6 border border-white/10 space-y-4">
              <h3 className="text-sm font-semibold text-gray-200 tracking-wider uppercase font-mono flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#bd00ff]" /> What Is Included:
              </h3>
              <ul className="text-gray-300 space-y-3 text-xs sm:text-sm">
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f3ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">NeuralSync 40 - Master Protocol</span>
                    <span className="block text-xs text-gray-400 mt-0.5">60-minute ultra-high-fidelity mastering session (WAV & FLAC formats).</span>
                  </div>
                </li>
                <li className="flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#00f3ff] flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-white">The Deep Work Protocol Guidebook</span>
                    <span className="block text-xs text-gray-400 mt-0.5">Companion blueprint on optimal session duration, volume controls, and setups.</span>
                  </div>
                </li>
              </ul>
            </div>

            <p className="text-xs sm:text-sm text-gray-400 mb-6 italic bg-purple-950/20 border border-[#bd00ff]/20 rounded-lg p-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#bd00ff] animate-ping" />
              <span>Use discount code <strong className="text-[#bd00ff] font-mono font-semibold">BETA50</strong> for 50% off early access pricing.</span>
            </p>

            {/* Functional Legal Shield */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-4 sm:p-5 mb-6 space-y-3">
              <div className="flex items-start cursor-pointer">
                <input 
                  type="checkbox" 
                  id="epilepsy-warning" 
                  className="w-5 h-5 accent-[#bd00ff] mr-3 cursor-pointer mt-0.5 flex-shrink-0 rounded border-white/10" 
                  checked={legalAgreed}
                  onChange={(e) => {
                    setLegalAgreed(e.target.checked);
                    if (e.target.checked) {
                      setShowDisclaimerWarning(false);
                    }
                  }}
                />
                <label htmlFor="epilepsy-warning" className="text-xs text-gray-400 leading-relaxed cursor-pointer select-none">
                  I confirm that <strong className="text-white">I do not have a history of epilepsy or seizures</strong>, and understand that binaural beats and entrainment frequencies are designed for safe mental exercise only.
                </label>
              </div>
            </div>

            {/* Validation Message Display */}
            {showDisclaimerWarning && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-2"
                id="disclaimer-warning"
              >
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>You must agree to the medical disclaimer before you can access the protocol.</span>
              </motion.div>
            )}

            {/* Integrated Gumroad Checkout Button */}
            <a 
              href={legalAgreed ? "https://jonesy1238.gumroad.com/l/gxgtm" : "#"}
              target={legalAgreed ? "_blank" : "_self"}
              rel="noopener noreferrer"
              className={`block w-full py-4 text-center font-bold font-display text-lg rounded-xl transition-all duration-300 select-none ${
                legalAgreed 
                  ? "bg-gradient-to-r from-[#00f3ff] via-[#8553ff] to-[#bd00ff] text-white hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow-[0_0_25px_rgba(0,243,255,0.3)] hover:shadow-[0_0_35px_rgba(189,0,255,0.5)]" 
                  : "bg-gray-800 text-gray-500 cursor-not-allowed"
              }`}
              onClick={(e) => {
                if (!legalAgreed) {
                  e.preventDefault();
                  setShowDisclaimerWarning(true);
                }
              }}
              id="checkout-action-button"
            >
              Get the Protocol
            </a>
          </div>
        </section>

        {/* TESTIMONIALS - TERMINAL STYLE */}
        <section id="trust-backing-section" className="min-h-screen relative z-10 flex flex-col items-center justify-center px-4 sm:px-10 py-20">
          <div className="w-full max-w-5xl">
            <div className="flex items-center gap-4 mb-12">
              <div className="h-[1px] w-12 bg-[#bd00ff]"></div>
              <h3 className="text-sm font-mono text-[#bd00ff] tracking-[0.2em] uppercase">User Telemetry</h3>
              <div className="h-[1px] flex-grow bg-gradient-to-r from-[#bd00ff] to-transparent"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Testimonial Block 1 */}
              <div className="border-l-2 border-[#00f3ff] pl-6 py-2 hover:border-[#bd00ff] transition-colors duration-300">
                <p className="text-gray-300 italic mb-4">"The 40Hz transition completely eliminated my usual afternoon brain fog. I've never experienced deep work synchronization this quickly."</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#00f3ff] to-black border border-[#00f3ff]/50"></div>
                  <div>
                    <div className="text-white font-bold text-sm">Dr. Elena Rostova</div>
                    <div className="text-[#00f3ff] font-mono text-[10px] uppercase">Cognitive Researcher</div>
                  </div>
                </div>
              </div>

              {/* Testimonial Block 2 */}
              <div className="border-l-2 border-[#bd00ff] pl-6 py-2 hover:border-[#00f3ff] transition-colors duration-300">
                <p className="text-gray-300 italic mb-4">"Absolutely unreal state of flow. The difference in my cognitive stamina is night and day. I leave the protocol on for hours."</p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#bd00ff] to-black border border-[#bd00ff]/50"></div>
                  <div>
                    <div className="text-white font-bold text-sm">Marcus Vance</div>
                    <div className="text-[#bd00ff] font-mono text-[10px] uppercase">Senior Engineer</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section id="faq-support-section" className="py-24 px-4 sm:px-12 md:px-20 bg-black/60">
          <FaqSection />
        </section>

        {/* FLOATING HELP BUTTON */}
        <button
          onClick={() => document.getElementById('faq-support-section')?.scrollIntoView({ behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 p-3.5 rounded-full bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-black hover:scale-110 hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] active:scale-95 transition-all duration-300 shadow-lg border border-white/15 select-none flex items-center justify-center cursor-pointer group"
          id="floating-help-btn"
          aria-label="FAQ & Help"
          title="Go to FAQ"
        >
          <HelpCircle className="w-5.5 h-5.5 transition-transform group-hover:rotate-12" />
        </button>

      </div>
    </div>
  );
}
