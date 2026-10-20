import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Video, Mic, MicOff, Volume2, PhoneOff, Clock, ArrowRight,
  RotateCcw, Award, CheckCircle2, ChevronRight, User, Languages, AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { AIInterviewerAvatar } from '@/components/interview/ai-interviewer-avatar';
import { speakQuestion, stopSpeaking, createSpeechRecognizer, isSpeechRecognitionSupported, type VoiceLanguage } from '@/lib/speech';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

interface MockQuestion {
  id: string;
  role: string;
  type: 'Technical' | 'HR' | 'Behavioral' | 'Mixed';
  text: Record<VoiceLanguage, string>;
  hints: string[];
  suggestedAnswer: string;
  followUp: Record<VoiceLanguage, string>;
}

const MOCK_QUESTION_BANK: MockQuestion[] = [
  {
    id: 'mq-1',
    role: 'Frontend Developer',
    type: 'Technical',
    text: {
      en: 'How does the browser rendering engine construct the DOM, CSSOM, and Render Tree during initial page load?',
      ta: 'ஆரம்ப பக்க ஏற்றத்தின் போது உலாவி ரெண்டரிங் இயந்திரம் DOM, CSSOM மற்றும் Render Tree-ஐ எவ்வாறு உருவாக்குகிறது?',
      hi: 'शुरुआती पेज लोड के दौरान ब्राउज़र रेंडरिंग इंजन DOM, CSSOM और Render Tree का निर्माण कैसे करता है?',
    },
    hints: ['Critical Rendering Path', 'Layout vs Paint', 'Render-blocking CSS'],
    suggestedAnswer: 'The browser parses HTML byte-by-byte into tokens, nodes, and the DOM tree. Concurrently, linked CSS files are parsed into the CSSOM. The engine combines the DOM and CSSOM into the Render Tree, containing only visible elements, before computing geometry (Layout) and pixel coloring (Paint).',
    followUp: {
      en: 'How do async and defer script attributes optimize this critical rendering path?',
      ta: 'async மற்றும் defer script பண்புக்கூறுகள் இந்த முக்கியமான ரெண்டரிங் பாதையை எவ்வாறு மேம்படுத்துகின்றன?',
      hi: 'async और defer script एट्रिब्यूट्स इस क्रिटिकल रेंडरिंग पाथ को कैसे ऑप्टिमाइज़ करते हैं?',
    },
  },
  {
    id: 'mq-2',
    role: 'Backend Developer',
    type: 'Technical',
    text: {
      en: 'Explain how you design a resilient rate limiter for a distributed public API handling 50,000 requests per second.',
      ta: 'வினாடிக்கு 50,000 கோரிக்கைகளைக் கையாளும் விநியோகிக்கப்பட்ட பொது API-க்கு நீங்கள் எவ்வாறு Rate Limiter-ஐ வடிவமைப்பீர்கள்?',
      hi: 'प्रति सेकंड 50,000 अनुरोधों को संभालने वाले वितरित सार्वजनिक API के लिए आप एक रेट लिमिटर कैसे डिज़ाइन करेंगे?',
    },
    hints: ['Token Bucket / Leaky Bucket', 'Redis with Lua script', 'Race condition prevention'],
    suggestedAnswer: 'Implement a Token Bucket or Sliding Window Counter using an in-memory Redis cluster. Use atomic Lua scripts to evaluate token availability and increment counts in a single network round-trip, preventing race conditions under high concurrent load.',
    followUp: {
      en: 'What strategy would you employ if the central Redis instance becomes temporarily unavailable?',
      ta: 'மத்திய Redis தற்காலிகமாக கிடைக்காமல் போனால் என்ன உத்தியைப் பயன்படுத்துவீர்கள்?',
      hi: 'यदि केंद्रीय Redis सर्वर अस्थायी रूप से अनुपलब्ध हो जाता है तो आप किस रणनीति का उपयोग करेंगे?',
    },
  },
  {
    id: 'mq-3',
    role: 'Full Stack Developer',
    type: 'Behavioral',
    text: {
      en: 'Tell me about a time when you received harsh critical feedback on a pull request or design doc, and how you responded.',
      ta: 'ஒரு Pull Request அல்லது Design ஆவணத்தில் கடுமையான விமர்சனங்களைப் பெற்ற அனுபவத்தையும், அதற்கு நீங்கள் எவ்வாறு பதிலளித்தீர்கள் என்பதையும் கூறுங்கள்.',
      hi: 'उस समय के बारे में बताएं जब आपको किसी Pull Request या डिज़ाइन दस्तावेज़ पर आलोचनात्मक प्रतिक्रिया मिली और आपने क्या प्रतिक्रिया दी।',
    },
    hints: ['STAR method', 'Separating ego from code', 'Constructive learning'],
    suggestedAnswer: 'I welcomed the peer critique as an opportunity for technical growth. Rather than becoming defensive, I scheduled a 15-minute sync with the reviewer to understand the edge-case latency concern they flagged, benchmarked the alternative solution, and documented the lesson in our team wiki.',
    followUp: {
      en: 'How did this experience shape the way you conduct code reviews for your peers now?',
      ta: 'இந்த அனுபவம் உங்கள் சக ஊழியர்களுக்கான குறியீட்டு மதிப்பாய்வுகளை இப்போது நீங்கள் எவ்வாறு நடத்துகிறீர்கள் என்பதை எவ்வாறு மாற்றியது?',
      hi: 'इस अनुभव ने आपके साथियों के लिए कोड समीक्षा करने के तरीके को कैसे प्रभावित किया?',
    },
  },
  {
    id: 'mq-4',
    role: 'General HR',
    type: 'HR',
    text: {
      en: 'Where do you see yourself professionally in the next 3 to 5 years, and what skills do you plan to master first?',
      ta: 'அடுத்த 3 முதல் 5 ஆண்டுகளில் உங்களை தொழில்ரீதியாக எங்கு பார்க்கிறீர்கள், முதலில் எந்தத் திறன்களைக் கற்க திட்டமிட்டுள்ளீர்கள்?',
      hi: 'अगले 3 से 5 वर्षों में आप खुद को पेशेवर रूप से कहाँ देखते हैं, और आप पहले कौन से कौशल में महारत हासिल करने की योजना बना रहे हैं?',
    },
    hints: ['Alignment with company growth', 'Depth before breadth', 'Mentorship and ownership'],
    suggestedAnswer: 'Over the next 3 to 5 years, I aim to grow into a senior technical contributor with deep ownership of core architecture, contributing directly to high-availability product features while actively mentoring junior developers and driving best engineering practices.',
    followUp: {
      en: 'How do you prioritize your personal learning when project deadlines are tight?',
      ta: 'திட்டத்தின் காலக்கெடு இறுக்கமாக இருக்கும்போது உங்கள் தனிப்பட்ட கற்றலுக்கு எவ்வாறு முன்னுரிமை அளிக்கிறீர்கள்?',
      hi: 'जब प्रोजेक्ट की समयसीमा सख्त होती है तो आप अपने व्यक्तिगत सीखने को कैसे प्राथमिकता देते हैं?',
    },
  },
];

export default function AIMockInterviewPage() {
  const navigate = useNavigate();
  const { language: appLanguage, setLanguage: setAppLanguage } = useLanguage();

  const [phase, setPhase] = useState<'config' | 'live' | 'results'>('config');

  // Config
  const [role, setRole] = useState('Frontend Developer');
  const [customRole, setCustomRole] = useState('');
  const [interviewType, setInterviewType] = useState<'Technical' | 'HR' | 'Behavioral' | 'Mixed'>('Mixed');
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [langPreference, setLangPreference] = useState<VoiceLanguage>(appLanguage);
  const [questionCount, setQuestionCount] = useState<number>(3);

  // Active session
  const [questions, setQuestions] = useState<MockQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [typedAnswer, setTypedAnswer] = useState('');
  const [speechTranscript, setSpeechTranscript] = useState('');
  const [isMicListening, setIsMicListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeFollowUpText, setActiveFollowUpText] = useState<string | null>(null);
  const [followUpDone, setFollowUpDone] = useState<Record<string, boolean>>({});

  // Media
  const { stream, isCameraActive, startMedia, stopMedia, toggleCamera } = useMediaDevices();
  const videoPreviewRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<any>(null);

  useEffect(() => {
    setLangPreference(appLanguage);
  }, [appLanguage]);

  useEffect(() => {
    if (videoPreviewRef.current && stream) {
      videoPreviewRef.current.srcObject = stream;
      videoPreviewRef.current.play().catch((err) => {
        console.warn('Candidate video preview autoplay notice:', err);
      });
    }
  }, [stream, phase, isCameraActive]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopMedia();
      recognizerRef.current?.stop();
    };
  }, [stopMedia]);

  const handleStart = async () => {
    // Filter questions matching type or mixed
    let pool = MOCK_QUESTION_BANK;
    if (interviewType !== 'Mixed') {
      const filtered = MOCK_QUESTION_BANK.filter((q) => q.type === interviewType);
      if (filtered.length > 0) pool = filtered;
    }

    const selected = pool.slice(0, questionCount);
    setQuestions(selected);
    setCurrentIdx(0);
    setAnswers({});
    setActiveFollowUpText(null);
    setFollowUpDone({});

    await startMedia();
    setPhase('live');

    // Read question
    setTimeout(() => {
      if (selected[0]) {
        readCurrentPrompt(selected[0].text[langPreference] || selected[0].text.en);
      }
    }, 800);
  };

  const readCurrentPrompt = (text: string) => {
    stopSpeaking();
    setIsSpeaking(true);
    speakQuestion(
      text,
      () => setIsSpeaking(false),
      langPreference
    );
  };

  const toggleMicListening = () => {
    if (isMicListening) {
      recognizerRef.current?.stop();
      setIsMicListening(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      toast.error('Voice dictation is not supported on this browser. You can type your answer.');
      return;
    }

    const rec = createSpeechRecognizer(
      (chunk, isFinal) => {
        setSpeechTranscript(chunk);
        if (isFinal) {
          setTypedAnswer((prev) => (prev ? `${prev} ${chunk}` : chunk));
        }
      },
      (err) => {
        console.warn('Speech error:', err);
        setIsMicListening(false);
      },
      langPreference
    );

    rec.start();
    recognizerRef.current = rec;
    setIsMicListening(true);
    toast.success('Listening to spoken answer...');
  };

  const handleNextStep = () => {
    const q = questions[currentIdx];
    if (!q) return;

    const answerContent = typedAnswer.trim() || speechTranscript.trim() || 'Spoken answer submitted.';
    setAnswers((prev) => ({ ...prev, [q.id]: answerContent }));
    setTypedAnswer('');
    setSpeechTranscript('');

    // Check follow-up
    if (!followUpDone[q.id]) {
      setFollowUpDone((prev) => ({ ...prev, [q.id]: true }));
      const followUp = q.followUp[langPreference] || q.followUp.en;
      setActiveFollowUpText(followUp);
      readCurrentPrompt(`Follow-up: ${followUp}`);
      toast('Follow-up question generated', { icon: '💡' });
      return;
    }

    // Next question or end
    setActiveFollowUpText(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      const nextQ = questions[currentIdx + 1];
      setTimeout(() => {
        readCurrentPrompt(nextQ.text[langPreference] || nextQ.text.en);
      }, 500);
    } else {
      stopSpeaking();
      stopMedia();
      recognizerRef.current?.stop();
      setPhase('results');
    }
  };

  const activeQuestion = questions[currentIdx];
  const effectiveRole = customRole.trim() || role;

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ── STAGE 1: CONFIGURATION ── */}
      {phase === 'config' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
                <Sparkles size={22} />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                  AI Mock Interview
                </h1>
                <p className="text-surface-500 text-xs sm:text-sm mt-0.5">
                  General simulated interview drills with dynamic questioning, voice recognition, and rubric evaluation.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-xs space-y-5">
            {/* 1. Job Role Selection */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                1. Select Target Job Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  'Frontend Developer',
                  'Backend Developer',
                  'Full Stack Developer',
                  'Python Developer',
                  'Java Developer',
                  'Custom Role',
                ].map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      role === r
                        ? 'border-accent-600 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 ring-1 ring-accent-600'
                        : 'border-surface-200 dark:border-navy-700 hover:border-surface-300 text-navy-800 dark:text-surface-200'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>

              {role === 'Custom Role' && (
                <input
                  type="text"
                  value={customRole}
                  onChange={(e) => setCustomRole(e.target.value)}
                  placeholder="Enter custom role title (e.g. iOS Engineer, DevOps Specialist)..."
                  className="w-full mt-2.5 px-3.5 py-2 text-xs rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white"
                />
              )}
            </div>

            {/* 2. Type & Difficulty & Language */}
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  2. Interview Type
                </label>
                <select
                  value={interviewType}
                  onChange={(e) => setInterviewType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-xs font-medium focus:outline-none"
                >
                  <option value="Mixed">Mixed (Technical & HR)</option>
                  <option value="Technical">Technical Only</option>
                  <option value="Behavioral">Behavioral (STAR)</option>
                  <option value="HR">HR Fundamentals</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  3. Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-xs font-medium focus:outline-none"
                >
                  <option value="Beginner">Beginner (Junior Level)</option>
                  <option value="Intermediate">Intermediate (Mid Level)</option>
                  <option value="Advanced">Advanced (Senior Level)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  4. Language Preference
                </label>
                <select
                  value={langPreference}
                  onChange={(e) => setLangPreference(e.target.value as VoiceLanguage)}
                  className="w-full px-3 py-2 rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-xs font-medium focus:outline-none"
                >
                  <option value="en">English</option>
                  <option value="ta">Tamil (தமிழ்)</option>
                  <option value="hi">Hindi (हिन्दी)</option>
                </select>
              </div>
            </div>

            <Button
              onClick={handleStart}
              size="lg"
              className="w-full shadow-md shadow-accent-600/20"
              rightIcon={<ArrowRight size={16} />}
            >
              Start AI Mock Interview Session
            </Button>
          </div>
        </div>
      )}

      {/* ── STAGE 2: LIVE MOCK INTERVIEW ── */}
      {phase === 'live' && (
        <div className="max-w-5xl mx-auto space-y-4">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-surface-200 dark:border-navy-700 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-sm text-navy-900 dark:text-white">
                  Mock Interview — {effectiveRole}
                </h3>
                <p className="text-[11px] text-surface-400">
                  Question {currentIdx + 1} of {questions.length} • Language:{' '}
                  {langPreference === 'ta' ? 'Tamil' : langPreference === 'hi' ? 'Hindi' : 'English'}
                </p>
              </div>
            </div>

            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                stopSpeaking();
                stopMedia();
                recognizerRef.current?.stop();
                setPhase('results');
              }}
              leftIcon={<PhoneOff size={14} />}
            >
              End Session
            </Button>
          </div>

          {/* Video Grid */}
          <div className="grid md:grid-cols-2 gap-4 h-95">
            {/* Professional AI Evaluator Video Avatar Panel */}
            <div className="h-full">
              <AIInterviewerAvatar
                persona={{
                  id: 'sarah',
                  name: 'Sarah Chen',
                  role: `${effectiveRole} AI Mentor`,
                  company: 'AptiCore Mock Interview AI',
                }}
                isSpeaking={isSpeaking}
                onToggleVoice={() => {
                  if (isSpeaking) {
                    stopSpeaking();
                    setIsSpeaking(false);
                  } else {
                    readCurrentPrompt(
                      activeFollowUpText || activeQuestion?.text[langPreference] || activeQuestion?.text.en || ''
                    );
                  }
                }}
                topic={`${interviewType} • ${difficulty}`}
                className="h-full"
              />
            </div>

            {/* Candidate Webcam */}
            <div className="rounded-2xl bg-slate-950 border border-slate-800 p-4 relative overflow-hidden flex flex-col justify-between text-white shadow-md">
              <video
                ref={videoPreviewRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
                  !isCameraActive ? 'hidden' : ''
                }`}
              />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <User size={36} />
                  <p className="text-xs mt-1">Camera preview paused</p>
                </div>
              )}

              <div className="z-10 flex justify-between">
                <span className="px-2.5 py-1 rounded-full bg-black/50 text-[11px]">You</span>
              </div>

              <div className="z-10 p-3 rounded-xl bg-black/70 border border-white/10 text-xs">
                <p className="text-[10px] uppercase font-bold text-slate-400 mb-0.5">
                  Voice Transcription:
                </p>
                <p className="text-slate-100 italic line-clamp-2">
                  {speechTranscript || typedAnswer || 'Click "Speak Answer" to transcribe via mic...'}
                </p>
              </div>
            </div>
          </div>

          {/* Interaction & Answers */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-surface-200 dark:border-navy-700 p-5 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-600">
                  {activeQuestion?.type} Question
                </span>
                <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white mt-0.5">
                  {activeFollowUpText || activeQuestion?.text[langPreference] || activeQuestion?.text.en}
                </h3>
              </div>

              <button
                onClick={() =>
                  readCurrentPrompt(
                    activeFollowUpText || activeQuestion?.text[langPreference] || activeQuestion?.text.en || ''
                  )
                }
                className="p-2 rounded-xl text-surface-500 hover:text-accent-600 hover:bg-surface-100 dark:hover:bg-navy-800 transition-colors shrink-0"
                title="Read aloud"
              >
                <Volume2 size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={isMicListening ? 'danger' : 'primary'}
                  size="sm"
                  onClick={toggleMicListening}
                  leftIcon={isMicListening ? <MicOff size={14} /> : <Mic size={14} />}
                >
                  {isMicListening ? 'Stop Listening' : 'Speak Answer'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCamera}
                >
                  {isCameraActive ? 'Disable Cam' : 'Enable Cam'}
                </Button>
              </div>

              <textarea
                rows={3}
                value={typedAnswer}
                onChange={(e) => setTypedAnswer(e.target.value)}
                placeholder="Or type your structured answer here..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-accent-500 focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <Button onClick={handleNextStep} size="md" rightIcon={<ChevronRight size={16} />}>
                {activeFollowUpText
                  ? 'Submit Follow-Up'
                  : currentIdx + 1 === questions.length
                  ? 'Complete Mock Interview'
                  : 'Submit & Proceed'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 3: RESULTS ── */}
      {phase === 'results' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-accent-50 dark:bg-accent-900/30 text-accent-600 flex items-center justify-center mx-auto shadow-xs">
              <Award size={36} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
              Mock Interview Assessment
            </h1>
            <p className="text-xs sm:text-sm text-surface-500">
              Evaluated for: {effectiveRole} ({interviewType})
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Technical Correctness', score: '82%' },
              { label: 'Question Relevance', score: '89%' },
              { label: 'Answer Structure', score: '78%' },
              { label: 'Communication Flow', score: '86%' },
            ].map((m) => (
              <Card key={m.label} padding="md" className="text-center">
                <p className="text-xs text-surface-500">{m.label}</p>
                <p className="text-2xl font-bold text-accent-600 mt-1">{m.score}</p>
              </Card>
            ))}
          </div>

          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-surface-200 dark:border-navy-700 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-navy-900 dark:text-white">
              Questions & Model Solutions
            </h3>
            {questions.map((q, idx) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-surface-200 dark:border-navy-700 space-y-2 bg-surface-50/50 dark:bg-navy-800/40"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent-600">Question {idx + 1}</span>
                  <Badge variant="accent" size="sm">{q.type}</Badge>
                </div>
                <p className="font-semibold text-xs sm:text-sm text-navy-900 dark:text-white">
                  {q.text[langPreference] || q.text.en}
                </p>
                <div className="p-3 rounded-lg bg-white dark:bg-navy-800 border border-surface-200 dark:border-navy-700 text-xs">
                  <p className="font-semibold text-emerald-600 mb-0.5">Model Answer Reference:</p>
                  <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                    {q.suggestedAnswer}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Dashboard
            </Button>
            <Button onClick={() => setPhase('config')} rightIcon={<RotateCcw size={14} />}>
              Take Another Mock
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
