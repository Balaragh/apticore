/**
 * Multilingual interviewer voice simulation and candidate speech recognition.
 * Seamlessly supports English (en-IN), Tamil (ta-IN), and Hindi (hi-IN).
 */

import { voiceService } from '@/services/voice.service';
import type { SupportedLanguage } from '@/contexts/language-context';

export type VoiceLanguage = SupportedLanguage;

const LANG_CODE_MAP: Record<VoiceLanguage, string> = {
  en: 'en-IN',
  ta: 'ta-IN',
  hi: 'hi-IN',
};

/**
 * Reads interview questions and assistant responses aloud with natural pacing.
 */
export function speakQuestion(
  text: string,
  onEnd?: () => void,
  lang: VoiceLanguage = 'en',
  rate: number = 0.95
): () => void {
  voiceService.speak(text, {
    lang,
    rate,
    pitch: 1.05,
    onEnd,
    onError: () => onEnd?.(),
  });

  return () => {
    voiceService.stop();
  };
}

export function stopSpeaking(): void {
  voiceService.stop();
}

/**
 * Check browser support for SpeechRecognition.
 */
export function isSpeechRecognitionSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}

export interface SpeechRecognitionController {
  start: () => void;
  stop: () => void;
  isListening: boolean;
}

/**
 * Speech Recognition wrapper with language support (en-IN, ta-IN, hi-IN)
 */
export function createSpeechRecognizer(
  onTranscript: (chunk: string, isFinal: boolean) => void,
  onError?: (err: string) => void,
  lang: VoiceLanguage = 'en'
): SpeechRecognitionController {
  if (!isSpeechRecognitionSupported()) {
    return {
      start: () => onError?.('Speech recognition is not supported in this browser. Please use Chrome or Edge, or type your response.'),
      stop: () => {},
      isListening: false,
    };
  }

  const SpeechRecognitionClass =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  const recognizer = new SpeechRecognitionClass();

  recognizer.continuous = true;
  recognizer.interimResults = true;
  recognizer.lang = LANG_CODE_MAP[lang] || 'en-IN';

  let listening = false;

  recognizer.onresult = (event: any) => {
    let finalChunk = '';
    let interimChunk = '';

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      if (event.results[i].isFinal) {
        finalChunk += event.results[i][0].transcript;
      } else {
        interimChunk += event.results[i][0].transcript;
      }
    }

    if (finalChunk) {
      onTranscript(finalChunk, true);
    } else if (interimChunk) {
      onTranscript(interimChunk, false);
    }
  };

  recognizer.onerror = (e: any) => {
    listening = false;
    if (e.error === 'not-allowed') {
      onError?.('Microphone permission was denied. Please allow microphone access in your browser bar.');
    } else if (e.error === 'no-speech') {
      // User paused, silent timeout is normal
    } else {
      onError?.(`Speech recognition error: ${e.error || 'transient issue'}`);
    }
  };

  recognizer.onend = () => {
    listening = false;
  };

  return {
    start: () => {
      try {
        listening = true;
        recognizer.start();
      } catch (err) {
        console.warn('Recognition start failed:', err);
      }
    },
    stop: () => {
      try {
        listening = false;
        recognizer.stop();
      } catch {}
    },
    get isListening() {
      return listening;
    },
  };
}
