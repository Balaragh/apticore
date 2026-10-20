import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  X,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Square,
  Sparkles,
  Lightbulb,
  Gauge,
  AlertCircle,
} from 'lucide-react';
import { useLanguage, type SupportedLanguage } from '@/contexts/language-context';
import { useVoice } from '@/contexts/voice-context';
import { createSpeechRecognizer, isSpeechRecognitionSupported } from '@/lib/speech';
import { LanguageSelector } from '@/components/ui/language-selector';
import toast from 'react-hot-toast';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  lang?: SupportedLanguage;
  timestamp: string;
}

const INITIAL_MESSAGES: Record<SupportedLanguage, string> = {
  en: "Hey! Welcome back. Ready to practise together? Ask me any interview question or technical concept.",
  ta: "வணக்கம்! இன்னைக்கு நம்ம சேர்ந்து interview practice பண்ணலாமா? உங்கள் சந்தேகங்களை தயங்காமல் கேளுங்கள்.",
  hi: "नमस्ते! चलिए, आज साथ में इंटरव्यू की प्रैक्टिस करते हैं। कोई भी तकनीकी सवाल या इंटरव्यू टिप्स पूछिए।",
};

const SUGGESTIONS: Record<SupportedLanguage, string[]> = {
  en: [
    'How do I answer: "Tell me about yourself"?',
    'Explain the STAR method in simple terms',
    'Top 5 SQL questions asked to freshers',
    'How to handle nervousness before an interview?',
  ],
  ta: [
    '"Tell me about yourself" கேள்விக்கு எப்படி பதிலளிப்பது?',
    'STAR முறையை எளிமையாக விளக்க முடியுமா?',
    'Freshers-க்கு கேட்கப்படும் முக்கிய SQL கேள்விகள்',
    'நேர்காணலின் போது பயத்தை போக்க என்ன செய்யலாம்?',
  ],
  hi: [
    '"Tell me about yourself" का सहज और सही उत्तर कैसे दें?',
    'STAR विधि को सरल शब्दों में समझाएं',
    'Freshers के लिए प्रमुख 5 SQL प्रश्न',
    'इंटरव्यू के डर और घबराहट को कैसे दूर करें?',
  ],
};

export function AIAssistantModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const { language, t } = useLanguage();
  const {
    speak,
    stop,
    pause,
    resume,
    repeat,
    isSpeaking,
    isPaused,
    isMuted,
    toggleMute,
    speechRate,
    setSpeechRate,
    currentCaption,
    voiceNotice,
    requestMicPermission,
  } = useVoice();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: 'init',
      sender: 'assistant',
      text: INITIAL_MESSAGES[language],
      lang: language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognizer, setRecognizer] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Update initial message when language changes if only 1 message exists
  useEffect(() => {
    setMessages((prev) => {
      if (prev.length <= 1) {
        return [
          {
            id: 'init',
            sender: 'assistant',
            text: INITIAL_MESSAGES[language],
            lang: language,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          },
        ];
      }
      return prev;
    });
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentCaption]);

  // Clean up speech and mic on close
  useEffect(() => {
    if (!isOpen) {
      stop();
      recognizer?.stop();
      setIsListening(false);
    }
  }, [isOpen, recognizer, stop]);

  // Toggle Voice Input
  const toggleListening = async () => {
    if (isListening) {
      recognizer?.stop();
      setIsListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      toast.error('Voice input is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    const hasPermission = await requestMicPermission();
    if (!hasPermission) return;

    const rec = createSpeechRecognizer(
      (chunk, isFinal) => {
        if (isFinal) {
          setInputText((prev) => (prev ? `${prev} ${chunk}` : chunk));
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListening(false);
        toast.error(err);
      },
      language
    );

    rec.start();
    setRecognizer(rec);
    setIsListening(true);
    toast.success(
      language === 'ta'
        ? 'மைக் ஆன் செய்யப்பட்டுள்ளது. தமிழில் பேசுங்கள்...'
        : language === 'hi'
        ? 'माइक ऑन है। हिंदी में बोलिए...'
        : 'Microphone active. Speak your question...'
    );
  };

  const cycleSpeed = () => {
    if (speechRate === 0.8) setSpeechRate(1.0);
    else if (speechRate === 1.0) setSpeechRate(1.2);
    else setSpeechRate(0.8);
  };

  const handleSend = (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    stop();

    const userMsg: ChatMessage = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text,
      lang: language,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsProcessing(true);

    // Warm, friendly delayed reply
    setTimeout(() => {
      setIsProcessing(false);
      const responseText = generateFriendlyAssistantResponse(text, language);
      const botMsg: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: 'assistant',
        text: responseText,
        lang: language,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, botMsg]);

      // Speak using friendly voice
      speak(responseText, language);
    }, 450);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/40 backdrop-blur-xs z-50 lg:hidden"
            onClick={onClose}
          />

          {/* Assistant Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0.5 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 w-full sm:w-115 bg-white shadow-2xl z-50 border-l border-[#E2E8F0] flex flex-col font-sans"
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent-600 text-white flex items-center justify-center shadow-xs">
                  <Bot size={22} />
                </div>
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-[#172033] flex items-center gap-2">
                    {t('header.aiAssistant')}
                    <span className="w-2 h-2 rounded-full bg-success-600 animate-pulse" />
                  </h3>
                  <p className="text-[11px] text-[#64748B]">
                    Warm, friendly mentor in English, தமிழ் & हिन्दी
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Reusable Language Selector */}
                <LanguageSelector variant="segmented" />

                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-[#E2E8F0] transition-colors"
                  aria-label="Close Assistant"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Voice Notice (if TTS is missing for selected language) */}
            {voiceNotice && (
              <div className="p-2.5 px-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-600 shrink-0" />
                <span className="flex-1 leading-snug">{voiceNotice}</span>
              </div>
            )}

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-white">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    m.sender === 'user' ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                      m.sender === 'user'
                        ? 'bg-accent-600 text-white rounded-br-xs shadow-xs'
                        : 'bg-[#F8FAFC] text-[#172033] rounded-bl-xs border border-[#E2E8F0]'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.text}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    <span className="text-[10px] text-[#64748B]">{m.timestamp}</span>
                    {m.sender === 'assistant' && (
                      <button
                        onClick={() => speak(m.text, language)}
                        className="text-[#64748B] hover:text-accent-600 transition-colors"
                        title={t('voice.play')}
                      >
                        <Volume2 size={13} />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Processing / Typing Indicator */}
              {isProcessing && (
                <div className="flex items-center gap-2 text-xs text-[#64748B] p-2 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] w-fit">
                  <span className="w-2 h-2 rounded-full bg-accent-600 animate-ping" />
                  <span>{t('voice.processing')}</span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Live Voice Captions Bar if Speaking */}
            {isSpeaking && currentCaption && (
              <div className="px-4 py-2.5 bg-accent-600/5 border-t border-accent-600/20 flex items-center justify-between gap-3 text-xs text-[#172033]">
                <div className="flex items-center gap-2 min-w-0">
                  <Sparkles size={14} className="text-accent-600 shrink-0 animate-spin" />
                  <p className="truncate font-medium italic text-accent-800">
                    "{currentCaption}"
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={isPaused ? resume : pause}
                    className="p-1 hover:bg-white rounded text-accent-700"
                    title={isPaused ? t('voice.resume') : t('voice.pause')}
                  >
                    {isPaused ? <Play size={13} /> : <Pause size={13} />}
                  </button>
                  <button
                    onClick={repeat}
                    className="p-1 hover:bg-white rounded text-accent-700"
                    title={t('voice.repeat')}
                  >
                    <RotateCcw size={13} />
                  </button>
                  <button
                    onClick={stop}
                    className="p-1 hover:bg-white rounded text-rose-600"
                    title={t('voice.stop')}
                  >
                    <Square size={12} />
                  </button>
                </div>
              </div>
            )}

            {/* Voice Audio Toolbar */}
            <div className="px-4 py-2 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between text-xs text-[#64748B]">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${
                    isMuted
                      ? 'bg-rose-100 text-rose-700 font-semibold'
                      : 'hover:bg-[#E2E8F0] text-[#172033]'
                  }`}
                  title={isMuted ? t('voice.unmute') : t('voice.mute')}
                >
                  {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                  <span>{isMuted ? 'Muted' : 'Voice On'}</span>
                </button>

                <button
                  type="button"
                  onClick={cycleSpeed}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-[#E2E8F0] text-accent-700 font-bold transition-colors"
                  title="Speaking Pace"
                >
                  <Gauge size={13} />
                  <span>{speechRate}x</span>
                </button>
              </div>

              <span className="text-[10px] font-mono text-[#64748B]">
                {language.toUpperCase()} • {language === 'ta' ? 'தமிழ்' : language === 'hi' ? 'हिन्दी' : 'Natural Voice'}
              </span>
            </div>

            {/* Quick Suggestions */}
            <div className="px-4 py-2 border-t border-[#E2E8F0] bg-white">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-[#64748B] mb-1.5 flex items-center gap-1">
                <Lightbulb size={12} className="text-warning-600" />
                {language === 'ta' ? 'பரிந்துரைக்கப்பட்ட தலைப்புகள்' : language === 'hi' ? 'सुझाए गए प्रश्न' : 'Suggested Topics'}
              </p>
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {SUGGESTIONS[language].map((s) => (
                  <button
                    key={s}
                    onClick={() => handleSend(s)}
                    className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-[#F8FAFC] border border-[#E2E8F0] hover:border-accent-600 text-[#172033] transition-all shadow-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Input Bar */}
            <div className="p-3.5 border-t border-[#E2E8F0] bg-[#F8FAFC]">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl border transition-all ${
                    isListening
                      ? 'bg-rose-500 text-white border-rose-600 animate-pulse'
                      : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                  }`}
                  title={isListening ? 'Stop listening' : 'Speak aloud'}
                >
                  {isListening ? <MicOff size={16} /> : <Mic size={16} className="text-accent-600" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? t('voice.listening')
                      : language === 'ta'
                      ? 'கேள்வியைத் தட்டச்சு செய்யவும் அல்லது பேசவும்...'
                      : language === 'hi'
                      ? 'प्रश्न टाइप करें या बोलकर पूछें...'
                      : 'Ask anything about interviews, STAR, or code...'
                  }
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-[#E2E8F0] bg-white text-[#172033] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-accent-600"
                />

                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="p-2.5 rounded-xl bg-accent-600 text-white hover:bg-accent-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-xs"
                >
                  <Send size={16} />
                </button>
              </form>
              <p className="text-[10px] text-[#64748B] text-center mt-2">
                AptiCore provides friendly, warm encouragement. Technical terms (React, Node, SQL, API) are preserved.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Friendly, natural assistant response generator tailored to nervous freshers.
 */
function generateFriendlyAssistantResponse(query: string, lang: SupportedLanguage): string {
  const q = query.toLowerCase();

  if (lang === 'ta') {
    if (q.includes('tell me about yourself') || q.includes('அறிமுகம்')) {
      return `நல்ல கேள்வி! 'Tell me about yourself' கேள்விக்கு எளிமையாக 3 பகுதிகளில் பதிலளியுங்கள்:\n\n1. நிகழ்காலம்: உங்கள் தற்போதைய படிப்பு மற்றும் நீங்கள் விரும்பும் தொழில்நுட்பங்கள் (React, Node.js, Python).\n2. கடந்தகாலம்: நீங்கள் கல்லூரியில் செய்த 1-2 சிறந்த Projects மற்றும் கற்றுக் கொண்ட அனுபவங்கள்.\n3. எதிர்காலம்: இந்த நிறுவனத்தில் சேர்ந்து எப்படி பங்களிக்க விரும்புகிறீர்கள் என்பது.\n\nபதிலை 60 முதல் 90 வினாடிகளில் முடிப்பது சிறந்தது. கவலைப்படாமல் நிதானமாக பேசுங்கள்!`;
    }
    if (q.includes('star') || q.includes('முறை')) {
      return `STAR முறை ரொம்ப எளிமையானது! இது நடத்தை சார்ந்த (Behavioral) கேள்விகளுக்கு உதவும்:\n\n• S (சூழ்நிலை): நீங்கள் எதிர்கொண்ட சவால் என்ன?\n• T (பணி): நீங்கள் முடிக்க வேண்டிய குறிப்பிட்ட பொறுப்பு என்ன?\n• A (செயல்பாடு): நீங்கள் எடுத்த தனித்துவமான தொழில்நுட்ப நடவடிக்கைகள் (Tools, Code, Architecture).\n• R (முடிவு): இதன் மூலம் கிடைத்த அளவிடக்கூடிய வெற்றி (எ.கா: 30% வேகம் அதிகரித்தது).\n\nஇதை பின்பற்றினால் இன்டர்வியூவர் உங்கள் திறமையை உடனடியாக பாராட்டுவார்!`;
    }
    if (q.includes('பயம்') || q.includes('பதட்டம்') || q.includes('nervous') || q.includes('fear')) {
      return `நேர்காணலின் போது பயம் வருவது முற்றிலும் இயல்பானது தான்! கவலைப்படாதீங்க. இந்த 3 எளிய வழிகளைப் பின்பற்றுங்கள்:\n\n1. ஆழமாக மூச்சை உள்ளிழுத்து மெதுவாக விடுங்கள். அமைதியாக பேச தொடங்குங்கள்.\n2. இன்டர்வியூ என்பது பரீட்சை அல்ல; இருவர் பேசும் கலந்துரையாடல் மட்டுமே.\n3. பதில் தெரியவில்லை என்றால், ‘I am not fully familiar with this, but from my understanding...’ என்று நேர்மையாக சொல்லலாம்.\n\nநீங்கள் நன்றாகவே தயாராகியுள்ளீர்கள், உங்கள் மீது நம்பிக்கை வையுங்கள்!`;
    }
    if (q.includes('sql') || q.includes('database')) {
      return `Freshers-க்கு அடிக்கடி கேட்கப்படும் முக்கியமான SQL கேள்விகள்:\n\n1. Clustered vs Non-Clustered Index வித்தியாசம்.\n2. Inner Join மற்றும் Left Join பயன்பாடு.\n3. Group By உடன் Having Clause எப்படி வேலை செய்கிறது?\n4. ACID பண்புகள் (Atomicity, Consistency, Isolation, Durability).\n5. Second Highest Salary கண்டுபிடிக்கும் எளிய Query.\n\nஇவற்றின் அடிப்படைக் கருத்துகளை தெளிவாகத் தெரிந்து கொண்டாலே போதும்!`;
    }
    return `நல்ல முயற்சி! AptiCore-இல் உங்கள் நேர்காணல் தயார்நிலைக்கு முழு உதவிகள் உள்ளன. Practice Courses, AI Video Interview, மற்றும் Aptitude டெஸ்ட் மூலம் உங்கள் திறமைகளை பரிசோதிக்கலாம். வேறு ஏதேனும் சந்தேகம் இருந்தால் தாராளமாகக் கேளுங்கள், நான் உதவ தயாராக இருக்கிறேன்!`;
  }

  if (lang === 'hi') {
    if (q.includes('tell me about yourself') || q.includes('परिचय')) {
      return `बहुत बढ़िया सवाल! 'Tell me about yourself' का उत्तर देते समय घबराएं नहीं। बस यह 3 बातें याद रखें:\n\n1. Present: आपकी पढ़ाई और मुख्य कौशल (जैसे React, Java, या Python)।\n2. Past: आपने कॉलेज में कौन सा अच्छा प्रोजेक्ट बनाया और क्या सीखा।\n3. Future: आप इस कंपनी और रोल में क्यों शामिल होना चाहते हैं।\n\nउत्तर को 60 से 90 सेकंड में पूरा करें। मुस्कुराते हुए और आत्मविश्वास के साथ बोलें!`;
    }
    if (q.includes('star') || q.includes('विधि')) {
      return `STAR विधि बहुत ही सरल और प्रभावशाली तरीका है:\n\n• S - Situation: समस्या या चुनौती का संदर्भ क्या था?\n• T - Task: आपका व्यक्तिगत लक्ष्य क्या था?\n• A - Action: आपने व्यक्तिगत रूप से क्या समाधान निकाला और कौन से टूल्स चुने?\n• R - Result: परिणाम क्या रहा (जैसे: लोडिंग स्पीड 35% बढ़ गई)।\n\nजब भी कोई अनुभव आधारित प्रश्न आए, इस ढांचे में उत्तर दें। इंटरव्यूअर काफी प्रभावित होंगे!`;
    }
    if (q.includes('डर') || q.includes('घबराहट') || q.includes('nervous') || q.includes('fear')) {
      return `इंटरव्यू से पहले थोड़ी घबराहट होना पूरी तरह स्वाभाविक है! चिंता मत कीजिए, इन बातों का ध्यान रखें:\n\n1. गहरी सांस लें और पानी पिएं। शांत दिमाग से उत्तर दें।\n2. याद रखें, इंटरव्यूअर आपको छांटने नहीं बल्कि आपकी ताकत देखने बैठा है।\n3. अगर किसी प्रश्न का उत्तर नहीं आता, तो ईमानदारी से कहें: ‘I haven't worked with this yet, but I'm eager to learn.’\n\nआपकी मेहनत ज़रूर रंग लाएगी, खुद पर पूरा भरोसा रखिए!`;
    }
    if (q.includes('sql') || q.includes('database')) {
      return `Freshers के लिए सबसे ज्यादा पूछे जाने वाले SQL प्रश्न:\n\n1. Indexing और Query Optimization कैसे काम करता है?\n2. Inner Join और Outer Joins में मुख्य अंतर।\n3. WHERE और HAVING क्लॉज का उपयोग।\n4. ACID गुण (Atomicity, Consistency, Isolation, Durability)।\n5. DENSE_RANK या Subquery से Second Highest Salary निकालना।\n\nइन्हें अच्छे से समझ लें, आप आसानी से उत्तर दे पाएंगे!`;
    }
    return `नमस्ते! आपकी तैयारी बहुत अच्छी चल रही है। AptiCore में आप Practice Courses, AI Mock Interview और Aptitude Tests से अभ्यास कर सकते हैं। क्या आप किसी खास तकनीकी विषय या कोडिंग सवाल पर बात करना चाहते हैं? मैं आपकी पूरी मदद करूँगा।`;
  }

  // English (friendly, warm, conversational)
  if (q.includes('tell me about yourself') || q.includes('introduce')) {
    return `Great question! When answering "Tell me about yourself", keep it simple, warm, and structured in 3 parts:\n\n1. Present: Share your current focus and the tech you love building with (e.g., "I'm a computer science graduate who loves frontend engineering with React and TypeScript").\n2. Past: Mention 1 or 2 key projects where you solved a real problem.\n3. Future: Share why this specific company and role excites you.\n\nKeep your answer right around 60 to 90 seconds. Smile, speak at a calm pace, and you'll do great!`;
  }
  if (q.includes('star') || q.includes('method') || q.includes('framework')) {
    return `The STAR method is super helpful and easy to remember for behavioral questions:\n\n• S - Situation: Briefly set the scene and what challenge your team faced.\n• T - Task: What was your specific goal or assignment?\n• A - Action: What did YOU personally do? Mention the tools, code, or ideas you contributed.\n• R - Result: Conclude with a clear positive outcome (e.g., "We delivered on time and improved load speed by 25%").\n\nSpend most of your time on the Action and Result parts. You've got this!`;
  }
  if (q.includes('nervous') || q.includes('anxiety') || q.includes('afraid') || q.includes('scared') || q.includes('confidence')) {
    return `It is completely normal to feel nervous before an interview! Here are 3 friendly tips to help you stay calm:\n\n1. Take a slow, deep breath before answering each question. It's okay to take 3 seconds to gather your thoughts.\n2. Treat the interview as a collaborative technical chat, not an interrogation.\n3. If you don't know an answer, simply say: "I haven't encountered that specific scenario yet, but here is how I would approach figuring it out..."\n\nBe proud of how far you've come. You are ready!`;
  }
  if (q.includes('sql') || q.includes('database')) {
    return `Here are the top 5 SQL topics every fresher should review:\n\n1. Indexing: Why indexes speed up SELECT queries and the trade-off with INSERT/UPDATE.\n2. Joins: The visual difference between Inner, Left, and Full Outer Joins.\n3. Aggregations: Using GROUP BY alongside HAVING for filtered metrics.\n4. ACID Properties: What ensures database transactions remain reliable.\n5. Finding the Second Highest Salary using either a subquery or DENSE_RANK().\n\nKeep your explanations straightforward with real-world examples!`;
  }

  return `Hey! That's a good attempt and a great question. At AptiCore, we are here to make your interview preparation enjoyable and stress-free. You can try a Mock Interview, upload your Resume to practice project questions, or review core concepts. What would you like to explore together next?`;
}
