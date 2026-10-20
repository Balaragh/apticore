import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Sparkles, MessageSquare, Volume2, Mic, MicOff, CheckCircle2,
  AlertCircle, ArrowRight, RefreshCw, ChevronRight, HelpCircle, FileText
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/language-context';
import { useVoice } from '@/contexts/voice-context';
import { createSpeechRecognizer, isSpeechRecognitionSupported, type SpeechRecognitionController } from '@/lib/speech';
import toast from 'react-hot-toast';

interface ProjectQuestion {
  id: string;
  type: 'Architectural' | 'Trade-off' | 'Debugging' | 'Scale';
  question: string;
  modelAnswer: string;
  followUp: string;
}

interface ResumeProject {
  id: string;
  title: string;
  techStack: string[];
  description: string;
  sampleQuestions: ProjectQuestion[];
}

const EXTRACTED_RESUME_PROJECTS: ResumeProject[] = [
  {
    id: 'proj-1',
    title: 'Collaborative E-Commerce SaaS Platform',
    techStack: ['React 19', 'TypeScript', 'Node.js', 'MongoDB', 'Redis', 'Tailwind CSS'],
    description: 'High-throughput storefront with real-time inventory synchronization, sub-100ms search, and Stripe payment webhooks.',
    sampleQuestions: [
      {
        id: 'q1-1',
        type: 'Architectural',
        question: 'Why did you choose MongoDB over a relational database like PostgreSQL for storing your e-commerce product catalog and orders?',
        modelAnswer: 'For product catalogs with dynamic attributes (varying sizes, colors, technical specs by category), MongoDB document schema accommodates polymorphic product data without complex EAV (Entity-Attribute-Value) anti-patterns. However, for orders and payments, transactional guarantees were enforced using MongoDB multi-document ACID transactions with explicit session rollbacks.',
        followUp: 'How did you prevent overselling when two shoppers clicked Checkout on the final inventory item simultaneously?',
      },
      {
        id: 'q1-2',
        type: 'Scale',
        question: 'You mentioned sub-100ms search. How did you structure your caching and database indexing to maintain this under high concurrency?',
        modelAnswer: 'We implemented compound indexing on `{ category: 1, price: 1, stock: -1 }` and introduced Redis for caching the top 20% most queried catalog searches with a 15-minute sliding TTL and cache-aside invalidation on inventory updates.',
        followUp: 'What was your cache stampede mitigation strategy during flash sales?',
      },
      {
        id: 'q1-3',
        type: 'Trade-off',
        question: 'What trade-offs did you encounter when upgrading to React 19 concurrent features compared to React 18?',
        modelAnswer: 'While React 19 Actions and `useTransition` eliminated manual `isSubmitting` and `isPending` state boilerplate, third-party libraries that directly mutated ref values required migration to ensure non-blocking concurrent rendering did not cause visual tearing.',
        followUp: 'How did you profile your component render timings before and after the refactoring?',
      },
    ],
  },
  {
    id: 'proj-2',
    title: 'Real-Time Distributed Chat & Collaboration Tool',
    techStack: ['React', 'TypeScript', 'Socket.IO', 'Express', 'WebRTC', 'Zustand'],
    description: 'Zero-latency workspace communication app with voice channels, end-to-end status broadcasting, and message caching.',
    sampleQuestions: [
      {
        id: 'q2-1',
        type: 'Architectural',
        question: 'Walk me through how your Socket.IO connection handles automatic reconnection and back-pressure when a client suffers packet loss.',
        modelAnswer: 'Socket.IO utilizes engine.io heartbeat pings (every 25s) and fallback polling. For state resumption, we assign monotonic sequence IDs to incoming messages so upon reconnecting, the client issues a `sync_since(last_seq)` request to retrieve dropped packets from Redis streams.',
        followUp: 'How would you scale Socket.IO across multiple Node.js instances behind an NGINX load balancer?',
      },
      {
        id: 'q2-2',
        type: 'Debugging',
        question: 'Describe the toughest memory leak or performance regression you diagnosed in this real-time app.',
        modelAnswer: 'We encountered an event listener leak where unmounted chat room components failed to remove their Socket.IO channel event handlers. Using Chrome DevTools Memory Heap Snapshots, we isolated detached DOM nodes and refactored our subscription hook into a clean `useEffect` cleanup closure with `socket.off()`.',
        followUp: 'What monitoring tools do you use in production to catch heap growth before it crashes the node process?',
      },
    ],
  },
];

export default function ResumePracticePage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { speak, stop, isSpeaking } = useVoice();

  const [selectedProjectId, setSelectedProjectId] = useState<string>('proj-1');
  const [activeQuestionIdx, setActiveQuestionIdx] = useState<number>(0);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isMicListening, setIsMicListening] = useState<boolean>(false);
  const [showModelAnswer, setShowModelAnswer] = useState<boolean>(false);
  const [activeFollowUp, setActiveFollowUp] = useState<string | null>(null);

  const recognizerRef = useRef<SpeechRecognitionController | null>(null);

  useEffect(() => {
    return () => {
      stop();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  const selectedProject =
    EXTRACTED_RESUME_PROJECTS.find((p) => p.id === selectedProjectId) ||
    EXTRACTED_RESUME_PROJECTS[0];

  const activeQuestion =
    selectedProject.sampleQuestions[activeQuestionIdx] ||
    selectedProject.sampleQuestions[0];

  const handleReadAloud = (text: string) => {
    if (isSpeaking) {
      stop();
    } else {
      speak(text, language);
      toast.success(language === 'ta' ? 'கேள்வி வாசிக்கப்படுகிறது...' : language === 'hi' ? 'प्रश्न बोला जा रहा है...' : 'Reading question aloud...');
    }
  };

  const toggleMic = () => {
    if (!isMicListening) {
      if (!isSpeechRecognitionSupported()) {
        toast.error('Speech recognition is not supported in this browser. Please type your response.');
        return;
      }

      setIsMicListening(true);
      toast.success(language === 'ta' ? 'மைக்ரோஃபோன் கேட்கிறது...' : language === 'hi' ? 'माइक्रोफ़ोन सुन रहा है...' : 'Microphone listening... Speak your project defense answer.');

      recognizerRef.current = createSpeechRecognizer(
        (chunk, isFinal) => {
          if (isFinal) {
            setUserAnswer((prev) => (prev ? `${prev} ${chunk.trim()}` : chunk.trim()));
          }
        },
        (err) => {
          setIsMicListening(false);
          toast.error(err);
        },
        language
      );

      recognizerRef.current.start();
    } else {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsMicListening(false);
      toast(language === 'ta' ? 'மைக்ரோஃபோன் நிறுத்தப்பட்டது.' : language === 'hi' ? 'माइक्रोफ़ोन रुका।' : 'Microphone stopped.', { icon: '🛑' });
    }
  };

  const handleSubmitAnswer = () => {
    if (!userAnswer.trim()) {
      toast.error('Please enter or dictate an answer before submitting for evaluation.');
      return;
    }

    setShowModelAnswer(true);
    setActiveFollowUp(activeQuestion.followUp);
    toast.success('Answer evaluated! Review the exemplar benchmark and follow-up.');
  };

  const handleNextQuestion = () => {
    setShowModelAnswer(false);
    setActiveFollowUp(null);
    setUserAnswer('');
    stop();

    if (activeQuestionIdx < selectedProject.sampleQuestions.length - 1) {
      setActiveQuestionIdx((prev) => prev + 1);
    } else {
      toast.success('Completed all practice questions for this resume project!');
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans text-[#172033]">
      {/* 1. Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              {t('resumePractice.title', 'Resume-Grounded Question Practice')}
            </h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-600/10 text-accent-600 border border-accent-600/20">
              Extracted Project Grills
            </span>
          </div>
          <p className="text-[#64748B] text-sm mt-1">
            {t('resumePractice.subtitle', 'Drill into technical questions specifically tailored to the projects, frameworks, and achievements listed on your resume.')}
          </p>
        </div>

        <Button
          variant="outline"
          onClick={() => navigate('/resume')}
          className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
        >
          {t('resume.title', 'View Resume Report')}
        </Button>
      </div>

      {/* 2. Select Project from Resume */}
      <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-3">
        <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B]">
          Select Extracted Project to Practice:
        </label>
        <div className="grid md:grid-cols-2 gap-3">
          {EXTRACTED_RESUME_PROJECTS.map((proj) => {
            const isSelected = selectedProjectId === proj.id;
            return (
              <div
                key={proj.id}
                onClick={() => {
                  setSelectedProjectId(proj.id);
                  setActiveQuestionIdx(0);
                  setShowModelAnswer(false);
                  setActiveFollowUp(null);
                  setUserAnswer('');
                }}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                  isSelected
                    ? 'border-accent-600 bg-accent-600/5 ring-1 ring-accent-600 shadow-xs'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="font-bold text-sm text-[#172033]">
                    {proj.title}
                  </h4>
                  {isSelected && (
                    <span className="text-[10px] font-bold text-accent-600 bg-accent-600/10 px-2 py-0.5 rounded-full border border-accent-600/20">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                  {proj.description}
                </p>
                <div className="flex flex-wrap gap-1 mt-2.5">
                  {proj.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="text-[10px] px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B]"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Interactive Question Defense Card */}
      <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="accent" size="sm">
                {activeQuestion.type} Question
              </Badge>
              <span className="text-xs text-[#64748B]">
                Question {activeQuestionIdx + 1} of {selectedProject.sampleQuestions.length}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#172033] leading-snug">
              {activeFollowUp ? activeFollowUp : activeQuestion.question}
            </h3>
          </div>

          <button
            onClick={() =>
              handleReadAloud(activeFollowUp ? activeFollowUp : activeQuestion.question)
            }
            className={`p-2 rounded-xl transition-colors shrink-0 ${
              isSpeaking ? 'text-accent-600 bg-accent-600/10 animate-pulse' : 'text-[#64748B] hover:text-accent-600 hover:bg-[#F8FAFC]'
            }`}
            title="Read Question Aloud"
          >
            <Volume2 size={18} />
          </button>
        </div>

        {/* Answer Input */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#172033]">
              Your Technical Answer:
            </span>
            <button
              onClick={toggleMic}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
                isMicListening
                  ? 'bg-error-600 text-white animate-pulse'
                  : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] hover:bg-[#E2E8F0]'
              }`}
            >
              {isMicListening ? <MicOff size={13} /> : <Mic size={13} className="text-accent-600" />}
              <span>{isMicListening ? t('interviewSession.listening', 'Listening...') : t('interviewSession.voiceDictation', 'Voice Dictation')}</span>
            </button>
          </div>

          <textarea
            rows={4}
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Structure your answer with context, design trade-offs, architecture decisions, and measured results..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#172033] text-xs sm:text-sm focus:ring-2 focus:ring-accent-600 focus:outline-none placeholder-[#64748B]"
          />
        </div>

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowModelAnswer(!showModelAnswer)}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
          >
            {showModelAnswer ? 'Hide Model Answer' : 'Peek Model Answer'}
          </Button>

          <Button
            onClick={handleSubmitAnswer}
            size="md"
            rightIcon={<ArrowRight size={15} />}
            className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold shadow-xs"
          >
            {t('resumePractice.gradeAnswer', 'Evaluate Answer')}
          </Button>
        </div>

        {/* 4. Model Answer & Follow-up Breakdown */}
        {showModelAnswer && (
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3 mt-4">
            <div>
              <p className="text-xs font-bold text-success-600 flex items-center gap-1 mb-1">
                <CheckCircle2 size={14} />
                {t('resumePractice.exemplarAnswer', 'Recommended Exemplar Answer')}:
              </p>
              <p className="text-xs text-[#172033] leading-relaxed">
                {activeQuestion.modelAnswer}
              </p>
            </div>

            {activeQuestion.followUp && (
              <div className="pt-2 border-t border-[#E2E8F0] text-xs">
                <p className="font-bold text-accent-600 mb-0.5">
                  Probable Follow-Up Scrutiny:
                </p>
                <p className="text-[#64748B]">
                  "{activeQuestion.followUp}"
                </p>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <Button size="sm" onClick={handleNextQuestion} className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
                {t('interviewSession.nextQuestion', 'Next Question')} →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
