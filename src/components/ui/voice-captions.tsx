import { motion, AnimatePresence } from 'framer-motion';
import {
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  AlertCircle,
  X,
  Gauge,
} from 'lucide-react';
import { useVoice } from '@/contexts/voice-context';
import { useLanguage } from '@/contexts/language-context';

export function VoiceCaptionsOverlay() {
  const {
    currentCaption,
    isSpeaking,
    isPaused,
    isMuted,
    toggleMute,
    pause,
    resume,
    stop,
    repeat,
    speechRate,
    setSpeechRate,
    voiceNotice,
    clearVoiceNotice,
  } = useVoice();
  const { t } = useLanguage();

  if (!currentCaption && !isSpeaking && !voiceNotice) {
    return null;
  }

  const cycleSpeed = () => {
    if (speechRate === 0.8) setSpeechRate(1.0);
    else if (speechRate === 1.0) setSpeechRate(1.2);
    else setSpeechRate(0.8);
  };

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-2xl w-[92%] sm:w-auto font-sans pointer-events-auto">
      <AnimatePresence>
        {/* Voice Unavailable Notice */}
        {voiceNotice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="mb-2 p-3 bg-amber-50 border border-amber-200 rounded-xl shadow-md text-xs text-amber-900 flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-2">
              <AlertCircle size={15} className="text-amber-600 shrink-0" />
              <span>{voiceNotice}</span>
            </div>
            <button
              onClick={clearVoiceNotice}
              className="p-1 hover:bg-amber-100 rounded text-amber-700"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* Live Audio & Captions Bar */}
        {(currentCaption || isSpeaking) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white/95 backdrop-blur-md border border-[#E2E8F0] shadow-xl rounded-2xl p-3 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-3 text-[#172033]"
          >
            {/* Live Indicator + Waveform */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-8 h-8 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center shrink-0">
                <Sparkles size={16} className={isSpeaking && !isPaused ? 'animate-spin' : ''} />
              </div>
              <div className="flex items-center gap-1">
                <span className="w-1.5 h-3.5 bg-accent-600 rounded-full animate-pulse" />
                <span className="w-1.5 h-5 bg-accent-600 rounded-full animate-pulse delay-75" />
                <span className="w-1.5 h-2.5 bg-accent-600 rounded-full animate-pulse delay-150" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-accent-700 hidden sm:inline">
                {t('voice.speaking')}
              </span>
            </div>

            {/* Caption Text */}
            <div className="flex-1 min-w-0 sm:max-w-md">
              <p className="text-xs sm:text-sm font-medium text-[#172033] line-clamp-2 leading-relaxed">
                "{currentCaption}"
              </p>
            </div>

            {/* Interactive Audio Controls */}
            <div className="flex items-center gap-1.5 shrink-0 border-t sm:border-t-0 sm:border-l border-[#E2E8F0] pt-2 sm:pt-0 sm:pl-3">
              {/* Play / Pause */}
              <button
                type="button"
                onClick={isPaused ? resume : pause}
                className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#172033] transition-colors"
                title={isPaused ? t('voice.resume') : t('voice.pause')}
              >
                {isPaused ? <Play size={15} /> : <Pause size={15} />}
              </button>

              {/* Repeat */}
              <button
                type="button"
                onClick={repeat}
                className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#172033] transition-colors"
                title={t('voice.repeat')}
              >
                <RotateCcw size={15} />
              </button>

              {/* Stop */}
              <button
                type="button"
                onClick={stop}
                className="p-1.5 rounded-lg bg-[#F8FAFC] hover:bg-rose-50 text-rose-600 transition-colors"
                title={t('voice.stop')}
              >
                <Square size={14} />
              </button>

              {/* Mute / Unmute */}
              <button
                type="button"
                onClick={toggleMute}
                className={`p-1.5 rounded-lg transition-colors ${
                  isMuted
                    ? 'bg-rose-100 text-rose-700'
                    : 'bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[#172033]'
                }`}
                title={isMuted ? t('voice.unmute') : t('voice.mute')}
              >
                {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>

              {/* Speed Rate Toggle */}
              <button
                type="button"
                onClick={cycleSpeed}
                className="px-2 py-1 rounded-lg bg-[#F8FAFC] hover:bg-[#E2E8F0] text-[11px] font-bold text-accent-700 transition-colors flex items-center gap-1"
                title="Change Speaking Speed"
              >
                <Gauge size={12} />
                <span>{speechRate}x</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
