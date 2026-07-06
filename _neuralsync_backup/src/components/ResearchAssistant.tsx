import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search, Sparkles, BookOpen, ArrowRight, ExternalLink, Globe, Bot,
  ShieldCheck, AlertCircle, Heart, Mail, Users, TrendingUp, Check
} from 'lucide-react';
import { collection, addDoc, getDocs, query, orderBy, limit, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
}

interface GroundingMetadata {
  webSearchQueries?: string[];
  groundingChunks?: GroundingChunk[];
}

interface ResearchResponse {
  text: string;
  groundingMetadata?: GroundingMetadata | null;
}

interface SavedQuery {
  id: string;
  query: string;
  response: string;
  timestamp: string;
  likes: number;
}

export const ResearchAssistant: React.FC = () => {
  const [searchQueryText, setSearchQueryText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<ResearchResponse | null>(null);

  // Community Feed State
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [likedQueryIds, setLikedQueryIds] = useState<string[]>([]);

  // Newsletter Lead State
  const [email, setEmail] = useState('');
  const [isSubmittingLead, setIsSubmittingLead] = useState(false);
  const [leadSuccess, setLeadSuccess] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);

  const suggestions = [
    'Show me recent studies on 40Hz and cognitive focus.',
    'Is 40Hz gamma entrainment safe for ADHD and memory?',
    'How does binaural beats compared to white noise?',
    'What is the science behind preventing sensory fatigue in entrainment?'
  ];

  // Fetch recent community queries from Firestore
  const fetchCommunityQueries = async () => {
    try {
      const q = query(collection(db, 'research_queries'), orderBy('timestamp', 'desc'), limit(5));
      const querySnapshot = await getDocs(q);
      const items: SavedQuery[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          query: data.query || '',
          response: data.response || '',
          timestamp: data.timestamp || new Date().toISOString(),
          likes: data.likes || 0,
        });
      });
      setSavedQueries(items);
    } catch (err) {
      console.warn('Failed to load community queries (Firestore may be loading or rules are propagating):', err);
    }
  };

  useEffect(() => {
    fetchCommunityQueries();
  }, []);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);
    setError(null);
    setResponse(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: searchQuery }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to analyze request');
      }

      const data: ResearchResponse = await res.json();
      setResponse(data);

      // Save to Firestore (fail-silent)
      try {
        await addDoc(collection(db, 'research_queries'), {
          query: searchQuery,
          response: data.text,
          timestamp: new Date().toISOString(),
          likes: 0,
          isPublic: true,
        });
        fetchCommunityQueries();
      } catch (dbErr) {
        console.warn('Failed to save search result to Firestore:', dbErr);
      }

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'An error occurred while connecting to the science database.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(searchQueryText);
  };

  // Upvote/Like handler
  const handleLike = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (likedQueryIds.includes(id)) return;

    try {
      const docRef = doc(db, 'research_queries', id);
      await updateDoc(docRef, {
        likes: increment(1)
      });

      setLikedQueryIds(prev => [...prev, id]);
      setSavedQueries(prev => prev.map(item => {
        if (item.id === id) {
          return { ...item, likes: item.likes + 1 };
        }
        return item;
      }));
    } catch (err) {
      console.error('Failed to upvote query:', err);
    }
  };

  // Newsletter signup form handler
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setLeadError('Please enter a valid email address.');
      return;
    }

    setIsSubmittingLead(true);
    setLeadError(null);
    setLeadSuccess(false);

    try {
      await addDoc(collection(db, 'leads'), {
        email: email.trim(),
        timestamp: new Date().toISOString(),
      });
      setLeadSuccess(true);
      setEmail('');
    } catch (err: any) {
      console.error('Failed to register lead:', err);
      setLeadError('Could not connect. Please try again in a moment.');
    } finally {
      setIsSubmittingLead(false);
    }
  };

  return (
    <div className="space-y-12 max-w-4xl mx-auto">
      {/* CO-PILOT WORKSPACE CARD */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        id="science-assistant-section"
        className="w-full p-[1px] rounded-2xl bg-gradient-to-r from-[#00f3ff]/25 via-[#bd00ff]/25 to-[#00f3ff]/25 shadow-2xl relative"
      >
        <div className="absolute -top-3 left-6 px-3 py-1 bg-black border border-[#00f3ff]/40 rounded-full text-[10px] font-mono uppercase tracking-widest text-[#00f3ff] flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,243,255,0.2)] z-10">
          <Sparkles className="w-3 h-3 text-[#00f3ff] animate-pulse" />
          Live Google Search Grounded
        </div>

        <div className="bg-black/85 backdrop-blur-xl rounded-2xl p-6 sm:p-10 space-y-8 relative overflow-hidden">
          {/* Ambient background glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#00f3ff]/3 rounded-full blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#bd00ff]/3 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 space-y-8">
            {/* Header */}
            <div className="space-y-2">
              <h4 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-gradient-to-br from-[#00f3ff]/15 to-[#bd00ff]/15 border border-white/10">
                  <Bot className="w-5 h-5 text-[#00f3ff]" />
                </div>
                AI Science Copilot
              </h4>
              <p className="text-gray-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
                Ask any question regarding the neuro-science of brainwaves, 40Hz gamma entrainment, or flow states. Our copilot validates claims in real-time using Google Search to cite official research, papers, and journals.
              </p>
            </div>

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
              <input
                type="text"
                value={searchQueryText}
                onChange={(e) => setSearchQueryText(e.target.value)}
                placeholder="Ask about the effects of 40Hz on memory, focus, or flow states..."
                className="w-full bg-white/5 border border-white/10 rounded-xl px-5 py-4 pr-14 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00f3ff] focus:border-[#00f3ff] transition-all duration-300"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !searchQueryText.trim()}
                className="absolute right-2.5 top-2.5 p-2 rounded-lg bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-black hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 disabled:pointer-events-none transition-all duration-200 cursor-pointer"
                aria-label="Submit search"
              >
                <Search className="w-4 h-4 font-bold" />
              </button>
            </form>

            {/* Suggestion Chips */}
            <div className="space-y-2.5">
              <div className="text-[10px] font-mono uppercase tracking-wider text-gray-500 flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Quick suggestions
              </div>
              <div className="flex flex-wrap gap-2">
                {suggestions.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setSearchQueryText(s);
                      handleSearch(s);
                    }}
                    disabled={isLoading}
                    className="text-left text-xs text-gray-400 glass-card hover:bg-white/[0.06] hover:text-[#00f3ff] hover:border-[#00f3ff]/20 px-3.5 py-2 rounded-lg transition-all duration-200 cursor-pointer select-none"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback Area */}
            <AnimatePresence mode="wait">
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card rounded-xl p-8 flex flex-col items-center justify-center space-y-4"
                >
                  {/* Neural spinner */}
                  <div className="relative w-14 h-14">
                    <div className="absolute inset-0 rounded-full border-2 border-t-[#00f3ff] border-r-transparent border-b-[#bd00ff] border-l-transparent animate-spin" />
                    <div className="absolute inset-2 rounded-full border-2 border-b-[#00f3ff] border-l-transparent border-t-[#bd00ff] border-r-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
                    <div className="absolute inset-4 rounded-full border border-[#00f3ff]/30 border-dashed animate-spin" style={{ animationDuration: '3s' }} />
                  </div>
                  <div className="text-center space-y-1">
                    <p className="text-xs font-mono text-gray-400 uppercase tracking-widest animate-pulse">Running Grounded Query...</p>
                    <p className="text-[10px] text-gray-500 italic">Interrogating global databases & academic indexes via Google Search</p>
                  </div>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="p-4 rounded-xl bg-red-950/20 border border-red-500/30 flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-red-300">Analysis Error</p>
                    <p className="text-xs text-gray-400 leading-relaxed">{error}</p>
                  </div>
                </motion.div>
              )}

              {response && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Google Queries Executed */}
                  {response.groundingMetadata?.webSearchQueries && response.groundingMetadata.webSearchQueries.length > 0 && (
                    <div className="flex flex-wrap gap-2 items-center glass-card rounded-lg px-4 py-2.5 text-xs text-gray-400">
                      <Globe className="w-3.5 h-3.5 text-[#00f3ff] flex-shrink-0" />
                      <span className="font-mono text-[10px] uppercase tracking-wider text-gray-500">Google Search:</span>
                      {response.groundingMetadata.webSearchQueries.map((q, idx) => (
                        <span key={idx} className="font-mono text-[11px] text-[#00f3ff] bg-[#00f3ff]/10 px-2 py-0.5 rounded border border-[#00f3ff]/20">
                          "{q}"
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Main Answer Content */}
                  <div className="p-6 sm:p-8 rounded-xl glass-card space-y-4 relative overflow-hidden">
                    {/* subtle top gradient accent */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff]/20 to-transparent pointer-events-none" />
                    <div className="text-xs font-mono uppercase tracking-widest text-gray-500 flex items-center gap-1.5 border-b border-white/5 pb-3 relative z-10">
                      <Bot className="w-4 h-4 text-[#bd00ff]" /> Scientific Synthesis
                    </div>
                    <div className="text-gray-300 text-sm leading-relaxed space-y-4 whitespace-pre-line font-sans relative z-10">
                      {response.text}
                    </div>
                  </div>

                  {/* Sources and Citations */}
                  {response.groundingMetadata?.groundingChunks && response.groundingMetadata.groundingChunks.length > 0 && (
                    <div className="space-y-3">
                      <div className="text-[10px] font-mono uppercase tracking-widest text-gray-500 flex items-center gap-1.5 px-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Grounded Citations ({response.groundingMetadata.groundingChunks.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {response.groundingMetadata.groundingChunks.map((chunk, idx) => {
                          if (!chunk.web) return null;
                          return (
                            <a
                              key={idx}
                              href={chunk.web.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="group p-3 rounded-lg glass-card hover:border-[#00f3ff]/20 transition-all duration-200 flex items-start gap-2.5 text-left cursor-pointer"
                            >
                              <span className="flex-shrink-0 w-5 h-5 rounded bg-white/5 border border-white/10 text-gray-400 text-[10px] font-mono flex items-center justify-center group-hover:bg-[#00f3ff]/10 group-hover:border-[#00f3ff]/20 group-hover:text-[#00f3ff] transition-all duration-200">
                                {idx + 1}
                              </span>
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <p className="text-xs font-medium text-gray-300 group-hover:text-white transition-colors duration-200 truncate">
                                  {chunk.web.title}
                                </p>
                                <p className="text-[10px] font-mono text-gray-500 truncate">
                                  {chunk.web.uri}
                                </p>
                              </div>
                              <ExternalLink className="w-3 h-3 text-gray-500 group-hover:text-[#00f3ff] flex-shrink-0 mt-1 transition-colors duration-200" />
                            </a>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Conversion CTA Bridge */}
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[#00f3ff]/5 to-[#bd00ff]/5 border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="text-left space-y-0.5">
                      <p className="text-xs font-semibold text-white">Experience These Grounded Benefits Risk-Free</p>
                      <p className="text-[11px] text-gray-400 leading-normal">Get instant high-fidelity audio assets of the 40Hz Neural On-Ramp™ Protocol.</p>
                    </div>
                    <button
                      onClick={() => document.getElementById('checkout-section')?.scrollIntoView({ behavior: 'smooth' })}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white text-black hover:bg-gray-100 text-xs font-semibold hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                    >
                      Get Protocol
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* LIVE COMMUNITY DISCOVERIES FEED */}
      {savedQueries.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          className="w-full glass-card rounded-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#bd00ff]/5 rounded-full blur-3xl pointer-events-none" />

          <div className="flex items-center justify-between border-b border-white/5 pb-4">
            <div className="space-y-1">
              <h5 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#00f3ff]" />
                Community Discoveries Feed
              </h5>
              <p className="text-[11px] text-gray-500">Live search questions being validated by high-performance researchers globally.</p>
            </div>
            <div className="flex items-center gap-1 bg-[#00f3ff]/10 text-[#00f3ff] border border-[#00f3ff]/20 px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider">
              <TrendingUp className="w-3 h-3" />
              Live Feed
            </div>
          </div>

          <div className="space-y-4 max-h-[380px] overflow-y-auto pr-2 custom-scrollbar">
            {savedQueries.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: idx * 0.06 }}
                onClick={() => {
                  setSearchQueryText(item.query);
                  setResponse({ text: item.response, groundingMetadata: null });
                  document.getElementById('science-assistant-section')?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="group p-4 glass-card rounded-xl transition-all duration-200 text-left cursor-pointer flex justify-between items-start gap-4"
              >
                <div className="space-y-1.5 flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-medium text-gray-200 group-hover:text-white transition-colors">
                    "{item.query}"
                  </p>
                  <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                    {item.response}
                  </p>
                  <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest pt-1">
                    {new Date(item.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {/* Like Button */}
                <button
                  onClick={(e) => handleLike(item.id, e)}
                  disabled={likedQueryIds.includes(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono transition-all duration-200 cursor-pointer ${
                    likedQueryIds.includes(item.id)
                      ? 'bg-[#bd00ff]/20 border-[#bd00ff]/30 text-[#bd00ff]'
                      : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${likedQueryIds.includes(item.id) ? 'fill-[#bd00ff] text-[#bd00ff]' : ''}`} />
                  <span>{item.likes}</span>
                </button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* LEAD CAPTURE & RESEARCH NEWSLETTER CARD */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="w-full rounded-2xl glass-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 relative overflow-hidden"
      >
        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-48 h-48 bg-[#00f3ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-2 text-left max-w-md relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-[#00f3ff]/10 rounded-lg border border-[#00f3ff]/20">
              <Mail className="w-4 h-4 text-[#00f3ff]" />
            </div>
            <h5 className="text-sm font-semibold text-white uppercase tracking-wider">Join the Research Circle</h5>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            Get exclusive early access to high-fidelity audio assets, custom brainwave protocol generators, and a <strong>25% discount launch coupon</strong>. No spam, only neuroscience.
          </p>
        </div>

        <div className="w-full md:w-auto flex-shrink-0 min-w-[280px] sm:min-w-[360px] relative z-10">
          {leadSuccess ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-4 rounded-xl bg-[#00f3ff]/10 border border-[#00f3ff]/30 flex items-center gap-3 text-left"
            >
              <div className="p-1 bg-[#00f3ff] text-black rounded-full flex-shrink-0">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-white">Welcome to the Inner Circle</p>
                <p className="text-[10px] text-gray-400">Coupon and 40Hz Audio research list has been dispatched to your inbox!</p>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="space-y-2 text-left">
              <div className="flex gap-2">
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-[#00f3ff] w-full"
                  disabled={isSubmittingLead}
                />
                <button
                  type="submit"
                  disabled={isSubmittingLead}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-[#00f3ff] to-[#bd00ff] text-black hover:scale-105 active:scale-95 text-xs font-semibold select-none flex items-center gap-1 transition-all duration-200 cursor-pointer"
                >
                  {isSubmittingLead ? 'Joining...' : 'Join'}
                </button>
              </div>
              {leadError && (
                <p className="text-[10px] text-red-400 pl-1">{leadError}</p>
              )}
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
};
