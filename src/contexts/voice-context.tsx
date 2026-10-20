import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from 'react';
import { voiceService, type IVoiceService } from '@/services/voice.service';
import { useLanguage, type SupportedLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';
export type MicPermissionState = 'prompt' | 'granted' | 'denied' | 'unsupported';

export interface VoiceContextType {
  voiceService: IVoiceService;
  speak: (text: string, lang?: SupportedLanguage, customCaption?: string) => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  repeat: () => void;
  isSpeaking: boolean;
  isPaused: boolean;
  isMuted: boolean;
  toggleMute: () => void;
  voiceEnabled: boolean;
  setVoiceEnabled: (enabled: boolean) => void;
  speechRate: number;
  setSpeechRate: (rate: number) => void;
  currentCaption: string | null;
  voiceState: VoiceState;
  setVoiceState: (state: VoiceState) => void;
  micPermission: MicPermissionState;
  requestMicPermission: () => Promise<boolean>;
  lastSpokenText: string | null;
  voiceNotice: string | null;
  clearVoiceNotice: () => void;
}

const VoiceContext = createContext<VoiceContextType | null>(null);

const STORAGE_KEY_VOICE_ENABLED = 'apticore_voice_enabled';
const STORAGE_KEY_VOICE_RATE = 'apticore_voice_rate';
const STORAGE_KEY_VOICE_MUTED = 'apticore_voice_muted';

export function VoiceProvider({ children }: { children: ReactNode }) {
  const { language, t } = useLanguage();

  const [voiceEnabled, setVoiceEnabledState] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE_ENABLED);
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [speechRate, setSpeechRateState] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_VOICE_RATE);
      return saved ? parseFloat(saved) : 0.95;
    } catch {
      return 0.95;
    }
  });

  const [isMuted, setIsMutedState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_VOICE_MUTED) === 'true';
    } catch {
      return false;
    }
  });

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentCaption, setCurrentCaption] = useState<string | null>(null);
  const [lastSpokenText, setLastSpokenText] = useState<string | null>(null);
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [micPermission, setMicPermission] = useState<MicPermissionState>('prompt');
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  // Sync mic permission state
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          setMicPermission(result.state as MicPermissionState);
          result.onchange = () => {
            setMicPermission(result.state as MicPermissionState);
          };
        })
        .catch(() => {
          setMicPermission('prompt');
        });
    }
  }, []);

  const clearVoiceNotice = () => setVoiceNotice(null);

  const setVoiceEnabled = (enabled: boolean) => {
    setVoiceEnabledState(enabled);
    if (!enabled) {
      voiceService.stop();
      setIsSpeaking(false);
      setIsPaused(false);
      setCurrentCaption(null);
    }
    try {
      localStorage.setItem(STORAGE_KEY_VOICE_ENABLED, String(enabled));
    } catch {}
  };

  const setSpeechRate = (rate: number) => {
    setSpeechRateState(rate);
    try {
      localStorage.setItem(STORAGE_KEY_VOICE_RATE, String(rate));
    } catch {}
  };

  const toggleMute = () => {
    setIsMutedState((prev) => {
      const next = !prev;
      if (next) {
        voiceService.stop();
        setIsSpeaking(false);
      }
      try {
        localStorage.setItem(STORAGE_KEY_VOICE_MUTED, String(next));
      } catch {}
      return next;
    });
  };

  const stop = useCallback(() => {
    voiceService.stop();
    setIsSpeaking(false);
    setIsPaused(false);
    setCurrentCaption(null);
    setVoiceState((prev) => (prev === 'speaking' ? 'idle' : prev));
  }, []);

  const pause = useCallback(() => {
    voiceService.pause();
    setIsPaused(true);
  }, []);

  const resume = useCallback(() => {
    voiceService.resume();
    setIsPaused(false);
  }, []);

  const speak = useCallback(
    async (text: string, targetLang?: SupportedLanguage, customCaption?: string): Promise<void> => {
      if (!voiceEnabled || isMuted) {
        // Voice is disabled/muted: show caption temporarily if requested, then resolve
        if (customCaption || text) {
          setCurrentCaption(customCaption || text);
          setTimeout(() => setCurrentCaption(null), 4000);
        }
        return;
      }

      const activeLang = targetLang || language;
      setLastSpokenText(text);
      clearVoiceNotice();

      await voiceService.speak(text, {
        lang: activeLang,
        rate: speechRate,
        volume: 1.0,
        pitch: 1.05,
        onStart: () => {
          setIsSpeaking(true);
          setIsPaused(false);
          setVoiceState('speaking');
          setCurrentCaption(customCaption || text);
        },
        onSentenceStart: (sentence) => {
          setCurrentCaption(sentence);
        },
        onEnd: () => {
          setIsSpeaking(false);
          setIsPaused(false);
          setVoiceState('idle');
          setTimeout(() => setCurrentCaption(null), 2500);
        },
        onVoiceUnavailable: (langCode) => {
          const notice =
            langCode === 'ta'
              ? 'உங்கள் சாதனத்தில் தமிழ் குரல் தொகுப்பு நிறுவப்படவில்லை. நேரடி உரைக் குறிப்புகள் இயக்கப்பட்டுள்ளன.'
              : langCode === 'hi'
              ? 'आपके सिस्टम में हिंदी वॉयस पैकेज उपलब्ध नहीं है। स्क्रीन पर लाइव टेक्स्ट कैप्शन दिखाए जा रहे हैं।'
              : 'Voice synthesis is not installed for this language. Showing text captions.';
          setVoiceNotice(notice);
          setCurrentCaption(text);
          setIsSpeaking(true);
          setVoiceState('speaking');
          setTimeout(() => {
            setIsSpeaking(false);
            setVoiceState('idle');
            setTimeout(() => setCurrentCaption(null), 2000);
          }, 3500);
        },
        onError: (err) => {
          console.warn('Voice error:', err);
          setIsSpeaking(false);
          setVoiceState('idle');
          setCurrentCaption(null);
        },
      });
    },
    [voiceEnabled, isMuted, language, speechRate]
  );

  const repeat = useCallback(() => {
    if (lastSpokenText) {
      speak(lastSpokenText);
    }
  }, [lastSpokenText, speak]);

  const requestMicPermission = async (): Promise<boolean> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setMicPermission('unsupported');
      toast.error(t('voice.micDenied'));
      return false;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop stream immediately once permission is verified
      stream.getTracks().forEach((track) => track.stop());
      setMicPermission('granted');
      toast.success(t('voice.micAllowed'));
      return true;
    } catch (err) {
      setMicPermission('denied');
      toast.error(t('voice.micDenied'));
      return false;
    }
  };

  return (
    <VoiceContext.Provider
      value={{
        voiceService,
        speak,
        pause,
        resume,
        stop,
        repeat,
        isSpeaking,
        isPaused,
        isMuted,
        toggleMute,
        voiceEnabled,
        setVoiceEnabled,
        speechRate,
        setSpeechRate,
        currentCaption,
        voiceState,
        setVoiceState,
        micPermission,
        requestMicPermission,
        lastSpokenText,
        voiceNotice,
        clearVoiceNotice,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const context = useContext(VoiceContext);
  if (!context) {
    throw new Error('useVoice must be used within a VoiceProvider');
  }
  return context;
}
