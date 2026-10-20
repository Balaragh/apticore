import type { SupportedLanguage } from '@/contexts/language-context';

export interface VoiceInfo {
  name: string;
  lang: string;
  voiceURI: string;
  isDefault: boolean;
  isLocalService: boolean;
}

export interface VoiceSpeechOptions {
  lang: SupportedLanguage;
  rate?: number;
  pitch?: number;
  volume?: number;
  onStart?: () => void;
  onSentenceStart?: (sentence: string) => void;
  onEnd?: () => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: string) => void;
  onVoiceUnavailable?: (lang: SupportedLanguage) => void;
}

export interface IVoiceService {
  speak(text: string, options: VoiceSpeechOptions): Promise<void>;
  pause(): void;
  resume(): void;
  stop(): void;
  isSpeaking(): boolean;
  isPaused(): boolean;
  hasVoiceForLanguage(lang: SupportedLanguage): Promise<boolean>;
  getAvailableVoices(): Promise<VoiceInfo[]>;
  detectBestVoice(lang: SupportedLanguage): Promise<SpeechSynthesisVoice | null>;
}

export class BrowserVoiceService implements IVoiceService {
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isCurrentlySpeaking: boolean = false;
  private isCurrentlyPaused: boolean = false;
  private voicesCache: SpeechSynthesisVoice[] = [];
  private voicesLoadedPromise: Promise<SpeechSynthesisVoice[]>;

  constructor() {
    this.voicesLoadedPromise = this.initVoices();
  }

  private initVoices(): Promise<SpeechSynthesisVoice[]> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return Promise.resolve([]);
    }

    return new Promise((resolve) => {
      const existing = window.speechSynthesis.getVoices();
      if (existing.length > 0) {
        this.voicesCache = existing;
        return resolve(existing);
      }

      window.speechSynthesis.onvoiceschanged = () => {
        const loaded = window.speechSynthesis.getVoices();
        this.voicesCache = loaded;
        resolve(loaded);
      };

      // Fallback timeout in case onvoiceschanged does not fire
      setTimeout(() => {
        const fallback = window.speechSynthesis.getVoices();
        this.voicesCache = fallback;
        resolve(fallback);
      }, 400);
    });
  }

  public async getAvailableVoices(): Promise<VoiceInfo[]> {
    const rawVoices = await this.voicesLoadedPromise;
    return rawVoices.map((v) => ({
      name: v.name,
      lang: v.lang,
      voiceURI: v.voiceURI,
      isDefault: v.default,
      isLocalService: v.localService,
    }));
  }

  public async hasVoiceForLanguage(lang: SupportedLanguage): Promise<boolean> {
    const voice = await this.detectBestVoice(lang);
    return voice !== null;
  }

  public async detectBestVoice(lang: SupportedLanguage): Promise<SpeechSynthesisVoice | null> {
    const voices = await this.voicesLoadedPromise;
    if (voices.length === 0) return null;

    if (lang === 'ta') {
      // Look for Tamil voices
      return (
        voices.find((v) => v.lang.toLowerCase().startsWith('ta')) ||
        voices.find((v) => v.name.toLowerCase().includes('tamil') || v.name.toLowerCase().includes('valluvar')) ||
        null
      );
    }

    if (lang === 'hi') {
      // Look for Hindi voices
      return (
        voices.find((v) => v.lang.toLowerCase().startsWith('hi')) ||
        voices.find(
          (v) =>
            v.name.toLowerCase().includes('hindi') ||
            v.name.toLowerCase().includes('kalpana') ||
            v.name.toLowerCase().includes('swara') ||
            v.name.toLowerCase().includes('madhur') ||
            v.name.toLowerCase().includes('hemant')
        ) ||
        null
      );
    }

    // English: Prefer warm, pleasant Indian English or natural voices
    const indianEnglish = voices.find(
      (v) =>
        v.lang.toLowerCase() === 'en-in' ||
        v.name.toLowerCase().includes('india') ||
        v.name.toLowerCase().includes('neerja') ||
        v.name.toLowerCase().includes('prabhat')
    );
    if (indianEnglish) return indianEnglish;

    const naturalEnglish = voices.find(
      (v) =>
        v.lang.toLowerCase().startsWith('en') &&
        (v.name.includes('Natural') ||
          v.name.includes('Samantha') ||
          v.name.includes('Jenny') ||
          v.name.includes('Google') ||
          v.name.includes('Victoria'))
    );
    if (naturalEnglish) return naturalEnglish;

    return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;
  }

  /**
   * Breaks text into natural sentences with micro-pauses for friendly, warm delivery.
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .replace(/([.?!।])\s*(?=[A-Z0-9\u0B80-\u0BFF\u0900-\u097F])/g, '$1|')
      .split('|')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  public async speak(text: string, options: VoiceSpeechOptions): Promise<void> {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      options.onError?.('Speech synthesis is not supported on this device.');
      options.onEnd?.();
      return;
    }

    this.stop();

    const selectedVoice = await this.detectBestVoice(options.lang);
    const hasNativeVoice = selectedVoice !== null;

    if (!hasNativeVoice && options.lang !== 'en') {
      // Specific voice is missing in user's operating system/browser
      options.onVoiceUnavailable?.(options.lang);
      // Simulate caption playback with timed transitions so user receives the experience
      this.simulateCaptions(text, options);
      return;
    }

    const sentences = this.splitIntoSentences(text);
    if (sentences.length === 0) {
      options.onEnd?.();
      return;
    }

    this.isCurrentlySpeaking = true;
    this.isCurrentlyPaused = false;
    options.onStart?.();

    let currentIndex = 0;

    const speakNextSentence = () => {
      if (!this.isCurrentlySpeaking || currentIndex >= sentences.length) {
        this.isCurrentlySpeaking = false;
        this.isCurrentlyPaused = false;
        options.onEnd?.();
        return;
      }

      const sentence = sentences[currentIndex];
      options.onSentenceStart?.(sentence);

      const utterance = new SpeechSynthesisUtterance(sentence);
      utterance.rate = options.rate ?? 0.95; // Warm, comfortable speaking speed
      utterance.pitch = options.pitch ?? 1.05; // Slightly pleasant reassuring pitch
      utterance.volume = options.volume ?? 1.0;

      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
      } else {
        utterance.lang = options.lang === 'ta' ? 'ta-IN' : options.lang === 'hi' ? 'hi-IN' : 'en-IN';
      }

      utterance.onend = () => {
        currentIndex++;
        // Natural pleasant pause between sentences (120ms)
        setTimeout(() => {
          if (this.isCurrentlySpeaking) {
            speakNextSentence();
          }
        }, 120);
      };

      utterance.onerror = (e) => {
        if (e.error === 'interrupted' || e.error === 'canceled') {
          return;
        }
        console.warn('SpeechSynthesis error:', e);
        currentIndex++;
        speakNextSentence();
      };

      this.currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    };

    speakNextSentence();
  }

  private simulateCaptions(text: string, options: VoiceSpeechOptions) {
    const sentences = this.splitIntoSentences(text);
    options.onStart?.();
    let idx = 0;

    const interval = setInterval(() => {
      if (idx >= sentences.length) {
        clearInterval(interval);
        options.onEnd?.();
        return;
      }
      options.onSentenceStart?.(sentences[idx]);
      idx++;
    }, 2800);
  }

  public pause(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isCurrentlySpeaking) {
      window.speechSynthesis.pause();
      this.isCurrentlyPaused = true;
    }
  }

  public resume(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window && this.isCurrentlyPaused) {
      window.speechSynthesis.resume();
      this.isCurrentlyPaused = false;
    }
  }

  public stop(): void {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      this.isCurrentlySpeaking = false;
      this.isCurrentlyPaused = false;
      this.currentUtterance = null;
    }
  }

  public isSpeaking(): boolean {
    return this.isCurrentlySpeaking;
  }

  public isPaused(): boolean {
    return this.isCurrentlyPaused;
  }
}

// Global singleton voice service
export const voiceService: IVoiceService = new BrowserVoiceService();
