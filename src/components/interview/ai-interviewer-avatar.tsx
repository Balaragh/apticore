import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Bot, ShieldCheck } from 'lucide-react';
import type { InterviewerPersona } from '@/lib/mock-data';

export interface AIInterviewerAvatarProps {
  persona?: InterviewerPersona | {
    id: string;
    name: string;
    role: string;
    company: string;
    style?: string;
    avatar?: string;
  };
  isSpeaking: boolean;
  onToggleVoice?: () => void;
  isVoiceMuted?: boolean;
  topic?: string;
  className?: string;
}

// Preset visual themes and avatar illustrations for each persona
const PERSONA_STYLES: Record<
  string,
  {
    hairColor: string;
    skinTone: string;
    shirtColor: string;
    jacketColor: string;
    glasses?: boolean;
    tie?: boolean;
    hairStyle: 'short-curly' | 'long-straight' | 'short-parted' | 'classic';
  }
> = {
  sarah: {
    hairColor: '#1E293B',
    skinTone: '#FCD34D',
    shirtColor: '#FFFFFF',
    jacketColor: '#0F172A',
    glasses: true,
    hairStyle: 'long-straight',
  },
  david: {
    hairColor: '#475569',
    skinTone: '#FED7AA',
    shirtColor: '#E2E8F0',
    jacketColor: '#1E293B',
    tie: true,
    hairStyle: 'short-parted',
  },
  alex: {
    hairColor: '#0F172A',
    skinTone: '#FDBA74',
    shirtColor: '#38BDF8',
    jacketColor: '#1E1B4B',
    glasses: false,
    hairStyle: 'short-curly',
  },
  jonathan: {
    hairColor: '#64748B',
    skinTone: '#FDE68A',
    shirtColor: '#F8FAFC',
    jacketColor: '#1E293B',
    tie: true,
    hairStyle: 'classic',
  },
};

export function AIInterviewerAvatar({
  persona,
  isSpeaking,
  onToggleVoice,
  isVoiceMuted = false,
  topic,
  className = '',
}: AIInterviewerAvatarProps) {
  const personaId = persona?.id || 'sarah';
  const style = PERSONA_STYLES[personaId] || PERSONA_STYLES.sarah;
  const personaName = persona?.name || 'Sarah Chen';
  const personaRole = persona?.role || 'Staff Software Engineer';
  const personaCompany = persona?.company || 'Tech Platforms';

  // Natural blinking cycle: blinks every 3 to 4.5 seconds
  const [isBlinking, setIsBlinking] = useState(false);
  useEffect(() => {
    let blinkTimer: NodeJS.Timeout;
    const triggerBlink = () => {
      setIsBlinking(true);
      setTimeout(() => {
        setIsBlinking(false);
        const nextInterval = 2800 + Math.random() * 2000;
        blinkTimer = setTimeout(triggerBlink, nextInterval);
      }, 140);
    };

    blinkTimer = setTimeout(triggerBlink, 2500);
    return () => clearTimeout(blinkTimer);
  }, []);

  // Natural mouth movement animation cycle while speaking
  // Cycles through realistic mouth shapes:
  // 0: neutral/smile, 1: slightly open, 2: wide vowel, 3: round 'oh', 4: small parted
  const [mouthShape, setMouthShape] = useState<number>(0);
  useEffect(() => {
    if (!isSpeaking) {
      setMouthShape(0);
      return;
    }

    const shapes = [1, 2, 3, 4, 1, 3, 2];
    let idx = 0;
    const interval = setInterval(() => {
      idx = (idx + 1) % shapes.length;
      setMouthShape(shapes[idx]);
    }, 130);

    return () => clearInterval(interval);
  }, [isSpeaking]);

  return (
    <div
      className={`relative w-full h-full min-h-70 rounded-2xl overflow-hidden bg-linear-to-b from-navy-900 via-navy-950 to-slate-950 border border-white/10 shadow-xl flex flex-col justify-between ${className}`}
    >
      {/* ── Corporate Office Ambient Backdrop ── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft studio bokeh light gradients */}
        <div className="absolute -top-1/4 left-1/4 w-96 h-96 bg-accent-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(30,41,59,0.4)_0%,rgba(15,23,42,0.95)_100%)]" />

        {/* Ambient subtle conference room grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, white 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* ── Header Overlay Bar ── */}
      <div className="relative z-10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Honest Transparent Avatar Badge */}
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-900/80 backdrop-blur-md border border-white/15 text-[11px] font-medium text-slate-200">
            <Bot size={13} className="text-accent-400" />
            <span>AI Interviewer Avatar</span>
          </span>

          {topic && (
            <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-slate-300">
              {topic}
            </span>
          )}
        </div>

        {/* Speaking Status Badge */}
        <div className="flex items-center gap-2">
          <AnimatePresence mode="wait">
            {isSpeaking ? (
              <motion.div
                key="speaking"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-semibold text-emerald-300"
              >
                <div className="flex items-center gap-0.5 h-3">
                  <span className="w-1 bg-emerald-400 rounded-full h-2 animate-pulse" />
                  <span className="w-1 bg-emerald-400 rounded-full h-3.5 animate-pulse" style={{ animationDelay: '150ms' }} />
                  <span className="w-1 bg-emerald-400 rounded-full h-2.5 animate-pulse" style={{ animationDelay: '300ms' }} />
                </div>
                <span>Speaking</span>
              </motion.div>
            ) : (
              <motion.div
                key="listening"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-navy-800/60 border border-white/10 text-[11px] text-slate-400"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                <span>Listening to Candidate</span>
              </motion.div>
            )}
          </AnimatePresence>

          {onToggleVoice && (
            <button
              onClick={onToggleVoice}
              className={`p-1.5 rounded-lg border transition-colors ${
                isVoiceMuted
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300'
                  : 'bg-navy-800/80 border-white/10 text-slate-300 hover:text-white'
              }`}
              title={isVoiceMuted ? 'Unmute voice' : 'Mute voice'}
            >
              {isVoiceMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
            </button>
          )}
        </div>
      </div>

      {/* ── Center Stage: Animated Realistic Avatar ── */}
      <div className="relative z-10 my-auto flex flex-col items-center justify-center p-4">
        {/* Breathing & Micro-sway Motion Container */}
        <motion.div
          animate={{
            y: isSpeaking ? [0, -3, 0] : [0, -1.5, 0],
            rotate: isSpeaking ? [0, 0.4, -0.4, 0] : [0, 0.2, 0],
          }}
          transition={{
            duration: isSpeaking ? 2.5 : 4.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative flex items-center justify-center"
        >
          {/* Audio Reactive Glow Halo */}
          {isSpeaking && (
            <motion.div
              animate={{
                scale: [1, 1.08, 1],
                opacity: [0.35, 0.65, 0.35],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="absolute -inset-4 rounded-full bg-linear-to-tr from-accent-500/30 to-emerald-400/25 blur-xl pointer-events-none"
            />
          )}

          {/* Avatar Canvas / SVG Frame */}
          <div className="relative w-44 h-44 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-white/20 shadow-2xl bg-linear-to-b from-slate-800 to-slate-900">
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full select-none"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id={`skin_${personaId}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={style.skinTone} />
                  <stop offset="100%" stopColor="#D97706" stopOpacity="0.8" />
                </linearGradient>
                <linearGradient id={`suit_${personaId}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor={style.jacketColor} />
                  <stop offset="100%" stopColor="#020617" />
                </linearGradient>
                <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
                  <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Background Backdrop Disc inside frame */}
              <circle cx="100" cy="100" r="100" fill="#0F172A" />

              {/* ── Shoulders & Corporate Jacket ── */}
              <path
                d="M30 200 C30 155, 60 142, 100 142 C140 142, 170 155, 170 200 Z"
                fill={`url(#suit_${personaId})`}
              />

              {/* Shirt Collar V-neck */}
              <path d="M85 142 L100 170 L115 142 Z" fill={style.shirtColor} />

              {/* Tie (if applicable) */}
              {style.tie && (
                <path d="M96 150 L104 150 L102 195 L98 195 Z" fill="#DC2626" />
              )}

              {/* Jacket Lapels */}
              <path d="M55 200 L85 142 L72 142 L42 200 Z" fill="#1E293B" opacity="0.6" />
              <path d="M145 200 L115 142 L128 142 L158 200 Z" fill="#1E293B" opacity="0.6" />

              {/* Neck */}
              <path d="M86 115 H114 V148 H86 Z" fill={style.skinTone} />
              {/* Neck Shadow under chin */}
              <path d="M86 115 Q100 126 114 115 V122 Q100 132 86 122 Z" fill="#000000" opacity="0.15" />

              {/* ── Head / Face Base ── */}
              <ellipse cx="100" cy="85" rx="36" ry="44" fill={style.skinTone} filter="url(#softShadow)" />

              {/* Ears */}
              <ellipse cx="62" cy="85" rx="5" ry="9" fill={style.skinTone} />
              <ellipse cx="138" cy="85" rx="5" ry="9" fill={style.skinTone} />

              {/* ── Hair Style ── */}
              {style.hairStyle === 'long-straight' && (
                <>
                  {/* Long hair behind shoulders */}
                  <path d="M56 80 C50 110, 48 150, 52 170 C58 170, 68 145, 66 110 Z" fill={style.hairColor} />
                  <path d="M144 80 C150 110, 152 150, 148 170 C142 170, 132 145, 134 110 Z" fill={style.hairColor} />
                  {/* Crown hair */}
                  <path
                    d="M60 75 C60 40, 78 36, 100 36 C122 36, 140 40, 140 75 C132 60, 120 54, 100 54 C80 54, 68 60, 60 75 Z"
                    fill={style.hairColor}
                  />
                </>
              )}

              {style.hairStyle === 'short-parted' && (
                <path
                  d="M62 75 C62 42, 78 35, 100 35 C125 35, 138 45, 138 72 C134 52, 124 48, 106 48 C85 48, 70 56, 62 75 Z"
                  fill={style.hairColor}
                />
              )}

              {style.hairStyle === 'short-curly' && (
                <path
                  d="M60 75 C58 45, 75 34, 100 34 C125 34, 142 45, 140 75 C134 55, 122 50, 100 50 C78 50, 66 55, 60 75 Z"
                  fill={style.hairColor}
                />
              )}

              {style.hairStyle === 'classic' && (
                <path
                  d="M62 72 C62 42, 80 36, 100 36 C120 36, 138 42, 138 72 C132 54, 120 48, 100 48 C80 48, 68 54, 62 72 Z"
                  fill={style.hairColor}
                />
              )}

              {/* Eyebrows */}
              <path d="M78 68 Q88 64 94 67" stroke={style.hairColor} strokeWidth="2.5" strokeLinecap="round" />
              <path d="M122 68 Q112 64 106 67" stroke={style.hairColor} strokeWidth="2.5" strokeLinecap="round" />

              {/* ── Eyes (with Natural Blink Animation) ── */}
              {isBlinking ? (
                // Blinking closed eye line
                <>
                  <path d="M78 78 Q85 81 92 78" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                  <path d="M108 78 Q115 81 122 78" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
                </>
              ) : (
                // Open eyes
                <>
                  <ellipse cx="85" cy="77" rx="6.5" ry="4.5" fill="#FFFFFF" />
                  <ellipse cx="115" cy="77" rx="6.5" ry="4.5" fill="#FFFFFF" />
                  {/* Iris */}
                  <circle cx="85" cy="77" r="3" fill="#1E293B" />
                  <circle cx="115" cy="77" r="3" fill="#1E293B" />
                  {/* Catchlight */}
                  <circle cx="86" cy="76" r="1" fill="#FFFFFF" />
                  <circle cx="116" cy="76" r="1" fill="#FFFFFF" />
                </>
              )}

              {/* Glasses (Sarah / Tech Evaluators) */}
              {style.glasses && (
                <g stroke="#334155" strokeWidth="2" fill="none">
                  {/* Left frame */}
                  <rect x="75" y="70" width="20" height="15" rx="3" />
                  {/* Right frame */}
                  <rect x="105" y="70" width="20" height="15" rx="3" />
                  {/* Bridge */}
                  <path d="M95 76 H105" />
                  {/* Temples */}
                  <path d="M75 75 L63 73" />
                  <path d="M125 75 L137 73" />
                </g>
              )}

              {/* Nose */}
              <path d="M98 83 L96 93 H104" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />

              {/* ── Mouth / Lip-Sync States ── */}
              {mouthShape === 0 && (
                // Neutral gentle welcoming smile
                <path d="M88 107 Q100 114 112 107" stroke="#991B1B" strokeWidth="2.5" strokeLinecap="round" />
              )}

              {mouthShape === 1 && (
                // Slightly open (soft consonants)
                <path d="M89 106 Q100 112 111 106 Q100 115 89 106 Z" fill="#7F1D1D" stroke="#991B1B" strokeWidth="1" />
              )}

              {mouthShape === 2 && (
                // Wide open (vowels: 'ah', 'eh')
                <ellipse cx="100" cy="108" rx="10" ry="6" fill="#7F1D1D" stroke="#991B1B" strokeWidth="1.5">
                  {/* Teeth hint */}
                  <path d="M93 105 Q100 106 107 105" stroke="#FFFFFF" strokeWidth="2" />
                </ellipse>
              )}

              {mouthShape === 3 && (
                // Round 'O' shape (vowels: 'oh', 'oo')
                <ellipse cx="100" cy="108" rx="6" ry="7" fill="#7F1D1D" stroke="#991B1B" strokeWidth="1.5" />
              )}

              {mouthShape === 4 && (
                // Parted teeth/dental ('th', 's')
                <path d="M90 107 Q100 111 110 107 Q100 112 90 107 Z" fill="#FFFFFF" stroke="#991B1B" strokeWidth="1.5" />
              )}
            </svg>
          </div>
        </motion.div>

        {/* Persona Details Overlay */}
        <div className="mt-3 text-center">
          <h3 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            {personaName}
            <span className="text-[11px] font-normal text-slate-400">({personaCompany})</span>
          </h3>
          <p className="text-xs text-accent-400 font-medium">{personaRole}</p>
        </div>
      </div>

      {/* ── Footer Overlay Bar ── */}
      <div className="relative z-10 px-4 py-2.5 bg-navy-950/80 backdrop-blur-md border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <ShieldCheck size={13} className="text-emerald-400" />
          <span className="text-[11px] text-slate-300">
            AptiCore Evaluator AI • Real-Time Voice Simulation
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <span>Avatar Feed Active</span>
        </div>
      </div>
    </div>
  );
}
