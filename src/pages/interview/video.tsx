import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Settings, Volume2, PhoneOff, ChevronRight,
  ChevronLeft, Sparkles, HelpCircle, Shield, CheckCircle2, AlertCircle,
  FileText, Lightbulb, MessageSquare, Clock, ArrowRight, Play, Maximize2,
  Minimize2, VolumeX, RefreshCw
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { speakQuestion, stopSpeaking } from '@/lib/speech';
import { STARCoach } from '@/components/interview/star-coach';
import { AnswerNotes } from '@/components/interview/answer-notes';
import { PrepChecklist } from '@/components/interview/prep-checklist';
import { DeviceCheckModal } from '@/components/interview/device-check-modal';
import { SelfReviewModal } from '@/components/interview/self-review-modal';
import { AIInterviewerAvatar } from '@/components/interview/ai-interviewer-avatar';
import { useLanguage } from '@/contexts/language-context';
import {
  DEMO_QUESTIONS,
  INTERVIEWER_PERSONAS,
  getQuestionsForConfig,
  type InterviewerPersona,
} from '@/lib/mock-data';
import type {
  InterviewConfig,
  InterviewQuestion,
  InterviewType,
  Difficulty,
  PracticeMode,
} from '@/types';
import toast from 'react-hot-toast';

const ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
  'Custom Role',
];

export default function VideoInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  // Mode: 'setup' (configuration & device check) or 'call' (live video workspace)
  const [viewState, setViewState] = useState<'setup' | 'call'>('setup');

  // Setup configuration state
  const [selectedRole, setSelectedRole] = useState<string>('Frontend Developer');
  const [customRole, setCustomRole] = useState<string>('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>('medium');
  const [selectedType, setSelectedType] = useState<InterviewType>('mixed');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('sarah');
  const [practiceMode, setPracticeMode] = useState<PracticeMode>('video');

  // Active call state
  const [activeQuestions, setActiveQuestions] = useState<InterviewQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [timeRemainingSeconds, setTimeRemainingSeconds] = useState<number>(15 * 60);
  const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState<boolean>(false);

  // UI state
  const [showDeviceModal, setShowDeviceModal] = useState<boolean>(false);
  const [showEndConfirmModal, setShowEndConfirmModal] = useState<boolean>(false);
  const [showSelfReviewModal, setShowSelfReviewModal] = useState<boolean>(false);
  const [activeSideTab, setActiveSideTab] = useState<'notes' | 'star' | 'hints'>('notes');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);
  const [pipPosition, setPipPosition] = useState<'bottom-right' | 'top-right' | 'bottom-left'>('bottom-right');
  const [showHints, setShowHints] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Media Devices hook for webcam & microphone
  const {
    stream,
    isCameraActive,
    isMicMuted,
    cameraPermission,
    micPermission,
    errorMessage,
    errorType,
    audioLevel,
    isInitializing,
    startMedia,
    stopMedia,
    toggleCamera,
    toggleMic,
    clearError,
  } = useMediaDevices();

  // Active Persona
  const activePersona: InterviewerPersona =
    INTERVIEWER_PERSONAS.find((p) => p.id === selectedPersonaId) || INTERVIEWER_PERSONAS[0];

  // Current question in call
  const currentQuestion: InterviewQuestion | undefined = activeQuestions[currentIdx];

  // Pre-load from URL or session config if passed
  useEffect(() => {
    const roleParam = searchParams.get('role');
    const typeParam = searchParams.get('type') as InterviewType;
    if (roleParam) setSelectedRole(roleParam);
    if (typeParam) setSelectedType(typeParam);

    const savedConfig = sessionStorage.getItem('apticore_active_config');
    if (savedConfig) {
      try {
        const parsed: InterviewConfig = JSON.parse(savedConfig);
        if (parsed.role) setSelectedRole(parsed.role);
        if (parsed.type) setSelectedType(parsed.type);
        if (parsed.difficulty) setSelectedDifficulty(parsed.difficulty);
        if (parsed.questionCount) setQuestionCount(parsed.questionCount);
      } catch {}
    }
  }, [searchParams]);

  // Bind video stream to candidate video preview
  useEffect(() => {
    if (candidateVideoRef.current && stream) {
      candidateVideoRef.current.srcObject = stream;
      candidateVideoRef.current.play().catch((err) => {
        console.warn('Candidate video autoplay notice:', err);
      });
    }
  }, [stream, isCameraActive, viewState]);

  // Timer countdown and elapsed in live call
  useEffect(() => {
    if (viewState !== 'call' || isTimerPaused) return;

    callTimerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setTimeRemainingSeconds((prev) => {
        if (prev <= 1) {
          toast('Scheduled interview duration has ended. You can complete your review.', { icon: '⏳' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [viewState, isTimerPaused]);

  // Stop TTS when question changes or leaves call
  useEffect(() => {
    stopSpeaking();
    setIsSpeakingQuestion(false);
  }, [currentIdx, viewState]);

  // Clean up media on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopMedia();
    };
  }, [stopMedia]);

  // Start interview call workspace
  const handleStartInterview = async () => {
    const effectiveRole = selectedRole === 'Custom Role' && customRole.trim() ? customRole.trim() : selectedRole;

    const config: InterviewConfig = {
      role: effectiveRole,
      technologies: [effectiveRole],
      difficulty: selectedDifficulty,
      type: selectedType,
      questionCount,
      timePerQuestion: Math.round((durationMinutes * 60) / questionCount),
      mode: practiceMode,
      durationMinutes,
      interviewerId: selectedPersonaId,
    };

    // Prepare questions
    const generated = getQuestionsForConfig(config);
    setActiveQuestions(generated);
    setCurrentIdx(0);
    setElapsedSeconds(0);
    setTimeRemainingSeconds(durationMinutes * 60);

    // Save session in sessionStorage (no credentials)
    sessionStorage.setItem('apticore_active_config', JSON.stringify(config));

    // Request camera & mic if not active yet (explicit user click)
    if (!stream && practiceMode === 'video') {
      await startMedia({ video: true, audio: true });
    }

    setViewState('call');
    toast.success(`Video interview started with ${activePersona.name}!`);
  };

  // Toggle Read Question Out Loud
  const handleToggleSpeak = () => {
    if (!currentQuestion) return;

    if (isSpeakingQuestion) {
      stopSpeaking();
      setIsSpeakingQuestion(false);
    } else {
      setIsSpeakingQuestion(true);
      speakQuestion(
        currentQuestion.text,
        () => {
          setIsSpeakingQuestion(false);
        },
        language
      );
    }
  };

  // Navigate Questions
  const handleNextQuestion = () => {
    if (currentIdx < activeQuestions.length - 1) {
      setCurrentIdx((prev) => prev + 1);
      setShowHints(false);
    } else {
      setShowEndConfirmModal(true);
    }
  };

  const handlePrevQuestion = () => {
    if (currentIdx > 0) {
      setCurrentIdx((prev) => prev - 1);
      setShowHints(false);
    }
  };

  // Answer change
  const handleAnswerChange = (text: string) => {
    if (!currentQuestion) return;
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: text,
    }));
  };

  // End Interview Session
  const handleConfirmEndSession = () => {
    setShowEndConfirmModal(false);
    stopSpeaking();
    stopMedia(); // Immediately stop camera & microphone tracks
    setShowSelfReviewModal(true);
  };

  // Toggle Fullscreen
  const handleToggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ─────────────────────────────────────────────
  // RENDER: SETUP VIEW
  // ─────────────────────────────────────────────
  if (viewState === 'setup') {
    return (
      <div className="max-w-6xl mx-auto space-y-8 pb-16">
        {/* Real Live Interview Switcher Banner */}
        <div className="bg-[#F5F1E8] border border-surface-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#202020] text-white flex items-center justify-center shrink-0">
              <Video size={16} />
            </div>
            <div>
              <p className="font-bold text-[#202020]">
                Conducting a live interview with a real candidate or hiring manager?
              </p>
              <p className="text-surface-600">
                Switch to Live Corporate Interview Rooms with real-time WebRTC peer-to-peer video, waiting room admission, and official scoring.
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => navigate('/interview/schedule')}
            className="bg-[#202020] hover:bg-accent-700 text-white shrink-0 shadow-xs"
          >
            Go to Live Rooms
          </Button>
        </div>

        {/* Top Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 border border-accent-200/50 dark:border-accent-800/40">
                <Video size={13} className="text-accent-600" />
                Live Video Practice Simulation
              </span>
              <span className="text-xs text-surface-400">Local Browser Camera</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white mt-1.5">
              Video Interview Training Studio
            </h1>
            <p className="text-sm text-surface-500 mt-1 max-w-2xl">
              Simulate realistic video calls with role-specific interviewers, live camera feedback, audio input metering, STAR answering coach, and post-interview self-evaluation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeviceModal(true)}
              leftIcon={<Settings size={15} />}
            >
              Device Check
            </Button>
            <Button
              size="md"
              onClick={handleStartInterview}
              leftIcon={<Play size={16} />}
              className="shadow-md shadow-accent-600/20"
            >
              Launch Video Session
            </Button>
          </div>
        </div>

        {/* Setup Grid: 2 Columns */}
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left Column: Configuration Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. Practice Mode Selection */}
            <Card padding="md">
              <h3 className="text-sm font-bold text-navy-800 dark:text-white mb-3 flex items-center gap-2">
                <Sparkles size={16} className="text-accent-500" />
                Choose Practice Mode
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'video',
                    title: 'Video Practice',
                    desc: 'Realistic call with webcam & audio feedback',
                    badge: 'Recommended',
                  },
                  {
                    id: 'mock',
                    title: 'Timed Mock',
                    desc: 'Structured timed multi-question exam',
                    badge: 'Standard',
                  },
                  {
                    id: 'question',
                    title: 'One-by-One',
                    desc: 'Step-by-step with immediate coaching',
                    badge: 'Focused',
                  },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setPracticeMode(mode.id as PracticeMode)}
                    className={`p-3.5 rounded-xl border text-left transition-all relative ${
                      practiceMode === mode.id
                        ? 'border-accent-600 bg-accent-50/60 dark:bg-accent-900/20 ring-1 ring-accent-600'
                        : 'border-surface-200 dark:border-navy-700 hover:border-surface-300 dark:hover:border-navy-600 bg-surface-50/40 dark:bg-navy-900'
                    }`}
                  >
                    <span className="text-[10px] font-semibold text-accent-700 dark:text-accent-400 uppercase tracking-wide">
                      {mode.badge}
                    </span>
                    <h4 className="text-xs sm:text-sm font-bold text-navy-800 dark:text-white mt-0.5">
                      {mode.title}
                    </h4>
                    <p className="text-[11px] text-surface-500 mt-1 leading-snug">
                      {mode.desc}
                    </p>
                  </button>
                ))}
              </div>
            </Card>

            {/* 2. Job Role Selection */}
            <Card padding="md">
              <h3 className="text-sm font-bold text-navy-800 dark:text-white mb-3">
                Target Engineering Role
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setSelectedRole(role)}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-left transition-all ${
                      selectedRole === role
                        ? 'border-accent-600 bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-semibold'
                        : 'border-surface-200 dark:border-navy-700 text-navy-800 dark:text-surface-200 hover:border-surface-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>

              {selectedRole === 'Custom Role' && (
                <div className="mt-3">
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter custom role title (e.g. iOS Engineer, DevOps Specialist)"
                    className="w-full text-xs p-2.5 rounded-lg border border-surface-300 dark:border-navy-700 bg-surface-50 dark:bg-navy-950 text-navy-800 dark:text-white"
                  />
                </div>
              )}
            </Card>

            {/* 3. Interview Type & Difficulty */}
            <div className="grid sm:grid-cols-2 gap-4">
              <Card padding="md">
                <h3 className="text-sm font-bold text-navy-800 dark:text-white mb-2.5">
                  Interview Round Type
                </h3>
                <div className="space-y-1.5">
                  {[
                    { id: 'technical', label: 'Technical Depth' },
                    { id: 'behavioral', label: 'Behavioral & STAR' },
                    { id: 'hr', label: 'HR & Screening' },
                    { id: 'mixed', label: 'Mixed Round (All)' },
                  ].map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedType(t.id as InterviewType)}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium transition-colors ${
                        selectedType === t.id
                          ? 'border-accent-600 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 font-semibold'
                          : 'border-surface-200 dark:border-navy-700 text-surface-600 dark:text-surface-300'
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              </Card>

              <Card padding="md">
                <h3 className="text-sm font-bold text-navy-800 dark:text-white mb-2.5">
                  Experience Difficulty
                </h3>
                <div className="space-y-1.5">
                  {[
                    { id: 'easy', label: 'Beginner / Junior' },
                    { id: 'medium', label: 'Intermediate / Mid-Level' },
                    { id: 'hard', label: 'Advanced / Senior' },
                  ].map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setSelectedDifficulty(d.id as Difficulty)}
                      className={`w-full p-2.5 rounded-lg border text-left text-xs font-medium transition-colors ${
                        selectedDifficulty === d.id
                          ? 'border-accent-600 bg-accent-50 dark:bg-accent-900/20 text-accent-700 dark:text-accent-300 font-semibold'
                          : 'border-surface-200 dark:border-navy-700 text-surface-600 dark:text-surface-300'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              </Card>
            </div>

            {/* 4. Questions & Duration */}
            <Card padding="md">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-navy-800 dark:text-white block mb-1.5">
                    Number of Questions: {questionCount}
                  </label>
                  <input
                    type="range"
                    min={3}
                    max={10}
                    value={questionCount}
                    onChange={(e) => setQuestionCount(Number(e.target.value))}
                    className="w-full accent-accent-600"
                  />
                  <div className="flex justify-between text-[10px] text-surface-400 mt-1">
                    <span>3 Quick</span>
                    <span>5 Standard</span>
                    <span>10 Full Round</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-navy-800 dark:text-white block mb-1.5">
                    Duration: {durationMinutes} Minutes
                  </label>
                  <input
                    type="range"
                    min={5}
                    max={30}
                    step={5}
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full accent-accent-600"
                  />
                  <div className="flex justify-between text-[10px] text-surface-400 mt-1">
                    <span>5m</span>
                    <span>15m Standard</span>
                    <span>30m Full</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 5. Interviewer Persona */}
            <Card padding="md">
              <h3 className="text-sm font-bold text-navy-800 dark:text-white mb-2.5">
                Select Interviewer Persona
              </h3>
              <div className="grid sm:grid-cols-3 gap-3">
                {INTERVIEWER_PERSONAS.map((persona) => (
                  <button
                    key={persona.id}
                    type="button"
                    onClick={() => setSelectedPersonaId(persona.id)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      selectedPersonaId === persona.id
                        ? 'border-accent-600 bg-accent-50/50 dark:bg-accent-900/20 ring-1 ring-accent-600'
                        : 'border-surface-200 dark:border-navy-700 hover:border-surface-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full overflow-hidden mb-2 border border-surface-200 dark:border-navy-700">
                      <img src={persona.avatar} alt={persona.name} className="w-full h-full object-cover" />
                    </div>
                    <p className="text-xs font-bold text-navy-800 dark:text-white">{persona.name}</p>
                    <p className="text-[10px] text-accent-600 dark:text-accent-400">{persona.role}</p>
                    <p className="text-[10px] text-surface-500 mt-1 leading-snug">{persona.style}</p>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Right Column: Camera / Equipment Readiness & Checklist (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Camera Preview Card */}
            <Card padding="md">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-navy-800 dark:text-white flex items-center gap-1.5">
                  <Video size={16} className="text-accent-500" />
                  Local Camera Preview
                </h3>
                <span className={`text-[11px] font-medium ${isCameraActive ? 'text-emerald-500' : 'text-surface-400'}`}>
                  {isCameraActive ? '● Camera Active' : '○ Disabled'}
                </span>
              </div>

              {/* Video container */}
              <div className="relative aspect-video rounded-xl bg-navy-950 border border-navy-800 overflow-hidden flex items-center justify-center">
                {stream && isCameraActive ? (
                  <video
                    ref={candidateVideoRef}
                    autoPlay
                    playsInline
                    muted
                    onLoadedMetadata={(e) => {
                      (e.target as HTMLVideoElement).play().catch(() => {});
                    }}
                    className="w-full h-full object-cover -scale-x-100"
                  />
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <VideoOff size={36} className="mx-auto text-navy-600" />
                    <p className="text-xs text-navy-400">
                      Camera preview is off
                    </p>
                    <p className="text-[11px] text-navy-500 max-w-xs">
                      Click below to enable your camera for a realistic interview simulation.
                    </p>
                  </div>
                )}

                {/* Bottom overlay status */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-navy-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-xs text-white">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px]">You (Candidate)</span>
                    {audioLevel > 5 && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </div>
                  <button
                    onClick={toggleCamera}
                    disabled={!stream}
                    className="text-xs text-accent-400 hover:text-accent-300 disabled:opacity-40"
                  >
                    {isCameraActive ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-3 flex items-center gap-2">
                {!stream ? (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => startMedia({ video: true, audio: true })}
                    isLoading={isInitializing}
                    leftIcon={<Video size={14} />}
                  >
                    Enable Camera & Mic
                  </Button>
                ) : (
                  <div className="w-full flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 size={14} /> Devices connected
                    </span>
                    <button
                      onClick={() => setShowDeviceModal(true)}
                      className="text-accent-600 underline text-[11px]"
                    >
                      Calibrate
                    </button>
                  </div>
                )}
              </div>
            </Card>

            {/* Preparation Checklist */}
            <PrepChecklist compact />

            {/* Launch Big Card */}
            <div className="p-5 rounded-2xl bg-linear-to-br from-navy-900 to-navy-950 text-white border border-navy-800 shadow-xl space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold text-base">Ready for Your Session?</h4>
                  <p className="text-xs text-surface-400 mt-1 leading-relaxed">
                    Practice answering {questionCount} questions in {durationMinutes} minutes with {activePersona.name}.
                  </p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-accent-600 flex items-center justify-center font-bold text-white shrink-0">
                  <Play size={18} />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  size="lg"
                  className="w-full shadow-lg shadow-accent-600/30"
                  onClick={handleStartInterview}
                  rightIcon={<ArrowRight size={18} />}
                >
                  Start Video Interview
                </Button>
              </div>

              <p className="text-[11px] text-surface-400 text-center">
                Local simulation • Accessible with or without camera
              </p>
            </div>
          </div>
        </div>

        {/* Device Check Modal */}
        <DeviceCheckModal
          isOpen={showDeviceModal}
          onClose={() => setShowDeviceModal(false)}
          onConfirmReady={() => {
            setShowDeviceModal(false);
            toast.success('Equipment verified! You can launch whenever ready.');
          }}
        />
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // RENDER: LIVE VIDEO CALL WORKSPACE
  // ─────────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className={`relative min-h-[88vh] flex flex-col bg-navy-950 text-white rounded-2xl border border-navy-800 overflow-hidden shadow-2xl ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none h-screen' : ''
      }`}
    >
      {/* 1. Video Call Top Bar */}
      <header className="h-14 px-4 sm:px-6 bg-navy-900/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs sm:text-sm font-bold tracking-tight text-white">
                {selectedRole} Practice Call
              </h2>
              <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300 border border-accent-400/30">
                Practice Simulation
              </span>
            </div>
            <p className="text-[10px] text-surface-400">
              Interviewer: {activePersona.name} • {activePersona.role}
            </p>
          </div>
        </div>

        {/* Center Progress & Timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 rounded-lg bg-navy-800 border border-white/10">
            <Clock size={13} className="text-accent-400" />
            <span className="text-surface-300">Elapsed:</span>
            <span className="font-mono text-white font-bold">{formatTimer(elapsedSeconds)}</span>
            <span className="text-surface-500 text-[10px]">|</span>
            <span className="text-surface-300 font-mono text-[11px]">
              Left: {formatTimer(timeRemainingSeconds)}
            </span>
          </div>

          <div className="hidden md:flex items-center gap-1.5 text-xs text-surface-300">
            <span className="font-bold text-white">
              {currentIdx + 1}
            </span>
            <span>of</span>
            <span className="font-bold text-white">
              {activeQuestions.length}
            </span>
          </div>
        </div>

        {/* Right Action Icons */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className={`p-2 rounded-lg text-xs font-medium transition-colors border ${
              isSidePanelOpen
                ? 'bg-accent-600 border-accent-500 text-white'
                : 'bg-navy-800 border-white/10 text-surface-300 hover:text-white'
            }`}
            title="Toggle notes & STAR companion drawer"
          >
            <FileText size={16} />
          </button>

          <button
            onClick={handleToggleFullscreen}
            className="p-2 rounded-lg bg-navy-800 border border-white/10 text-surface-300 hover:text-white transition-colors"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </header>

      {/* 2. Main Call Stage Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left / Center Video Stage */}
        <div className="flex-1 flex flex-col p-4 relative overflow-hidden">
          {/* Main Stage: Large Interviewer Area */}
          <div className="flex-1 relative rounded-2xl bg-linear-to-b from-navy-900 to-navy-950 border border-white/10 overflow-hidden flex flex-col justify-between p-6">
            {/* Background Subtle Gradient Core */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)] pointer-events-none" />

            {/* Top row: Topic Pill & Read Aloud Button */}
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs px-2.5 py-1 rounded-full bg-accent-600/30 text-accent-300 border border-accent-500/30 font-semibold">
                  {currentQuestion?.topic || 'Core Engineering'}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-surface-200 capitalize">
                  {currentQuestion?.type || 'technical'}
                </span>
                <span className="text-xs px-2.5 py-1 rounded-full bg-white/10 text-surface-300 capitalize">
                  Difficulty: {currentQuestion?.difficulty || 'medium'}
                </span>
              </div>

              {/* Voice Read Aloud Toggle */}
              <button
                type="button"
                onClick={handleToggleSpeak}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isSpeakingQuestion
                    ? 'bg-accent-600 text-white animate-pulse'
                    : 'bg-navy-800/80 hover:bg-navy-700 text-surface-200 border border-white/10'
                }`}
                title="Read question aloud using speech synthesis"
              >
                {isSpeakingQuestion ? <Volume2 size={14} /> : <Volume2 size={14} />}
                <span>{isSpeakingQuestion ? 'Speaking...' : 'Read Aloud'}</span>
              </button>
            </div>

            {/* Center Stage: Animated Realistic AI Interviewer Video Avatar */}
            <div className="relative z-10 my-auto flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
              <div className="w-full h-72 sm:h-80">
                <AIInterviewerAvatar
                  persona={activePersona}
                  isSpeaking={isSpeakingQuestion}
                  onToggleVoice={handleToggleSpeak}
                  topic={currentQuestion?.topic || selectedRole}
                />
              </div>

              {/* Prominent Question Presentation Card */}
              <div className="w-full p-4 sm:p-5 rounded-2xl bg-navy-900/90 backdrop-blur-md border border-white/15 shadow-xl text-left space-y-3">
                <div className="flex items-center justify-between text-xs text-surface-400">
                  <span className="font-semibold text-accent-300 uppercase tracking-wider text-[11px]">
                    Question {currentIdx + 1} of {activeQuestions.length}
                  </span>
                  <span className="text-[11px]">
                    Target: ~{Math.round((durationMinutes * 60) / activeQuestions.length / 60)} mins
                  </span>
                </div>

                <p className="text-sm sm:text-base font-medium text-white leading-relaxed">
                  {currentQuestion?.text}
                </p>

                {/* Optional Hint Dropdown */}
                {currentQuestion?.hints && currentQuestion.hints.length > 0 && (
                  <div className="pt-2 border-t border-white/10">
                    <button
                      onClick={() => setShowHints(!showHints)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      <Lightbulb size={13} />
                      {showHints ? 'Hide Guidance Hints' : 'Show Guidance Hints'}
                    </button>
                    {showHints && (
                      <ul className="mt-2 text-xs text-surface-300 list-disc list-inside space-y-1 bg-navy-950/60 p-2.5 rounded-lg border border-amber-500/20">
                        {currentQuestion.hints.map((hint, idx) => (
                          <li key={idx}>{hint}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Question Progress Dots */}
            <div className="relative z-10 flex items-center justify-between pt-2">
              <span className="text-[11px] text-surface-400">
                Mode: {practiceMode === 'video' ? 'Webcam Practice' : 'Text Fallback'}
              </span>

              <div className="flex items-center gap-1.5">
                {activeQuestions.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIdx(i)}
                    className={`h-2 rounded-full transition-all ${
                      i === currentIdx
                        ? 'w-6 bg-accent-500'
                        : answers[activeQuestions[i]?.id]
                        ? 'w-2 bg-emerald-500'
                        : 'w-2 bg-navy-700'
                    }`}
                    title={`Question ${i + 1}`}
                  />
                ))}
              </div>

              <span className="text-[11px] text-surface-400">
                {Object.keys(answers).length} answered
              </span>
            </div>
          </div>

          {/* Picture-In-Picture Candidate Webcam Panel */}
          <div
            className={`absolute z-30 w-44 sm:w-56 aspect-video rounded-xl bg-navy-900 border border-white/20 overflow-hidden video-pip-shadow transition-all duration-300 ${
              pipPosition === 'bottom-right' ? 'bottom-20 right-6' :
              pipPosition === 'top-right' ? 'top-6 right-6' : 'bottom-20 left-6'
            }`}
          >
            {stream && isCameraActive ? (
              <video
                ref={candidateVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className="w-full h-full object-cover -scale-x-100"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center bg-navy-950 text-navy-400">
                <VideoOff size={22} className="mb-1" />
                <span className="text-[10px]">Camera Inactive</span>
                <button
                  onClick={toggleCamera}
                  className="mt-1 text-[10px] text-accent-400 underline"
                >
                  Enable Video
                </button>
              </div>
            )}

            {/* PiP Overlay Label */}
            <div className="absolute bottom-1 inset-x-1 px-2 py-0.5 rounded bg-navy-950/80 backdrop-blur-sm flex items-center justify-between text-[10px] text-white">
              <span className="truncate">You</span>
              <div className="flex items-center gap-1">
                {audioLevel > 5 ? (
                  <Mic size={11} className="text-emerald-400 animate-pulse" />
                ) : isMicMuted ? (
                  <MicOff size={11} className="text-rose-400" />
                ) : (
                  <Mic size={11} className="text-surface-400" />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Companion Drawer (Answer Notes, STAR Coach, Hints) */}
        <AnimatePresence>
          {isSidePanelOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="w-96 border-l border-white/10 bg-navy-900/95 backdrop-blur-md flex flex-col shrink-0 overflow-hidden z-20"
            >
              {/* Tab Selector */}
              <div className="grid grid-cols-3 border-b border-white/10 p-2 gap-1 bg-navy-950/40 text-xs">
                {[
                  { id: 'notes', label: 'Answer Notes', icon: FileText },
                  { id: 'star', label: 'STAR Coach', icon: Sparkles },
                  { id: 'hints', label: 'Key Points', icon: Lightbulb },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSideTab(tab.id as any)}
                    className={`py-1.5 px-2 rounded-lg font-medium flex items-center justify-center gap-1.5 transition-colors ${
                      activeSideTab === tab.id
                        ? 'bg-accent-600 text-white'
                        : 'text-surface-400 hover:text-white hover:bg-navy-800'
                    }`}
                  >
                    <tab.icon size={13} />
                    <span className="truncate">{tab.label}</span>
                  </button>
                ))}
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {activeSideTab === 'notes' && currentQuestion && (
                  <div className="space-y-3">
                    <p className="text-xs text-surface-400">
                      Write or dictate notes for this answer. This will be preserved in your training summary.
                    </p>
                    <AnswerNotes
                      questionId={currentQuestion.id}
                      initialValue={answers[currentQuestion.id] || ''}
                      onChange={handleAnswerChange}
                      minRows={10}
                    />
                  </div>
                )}

                {activeSideTab === 'star' && currentQuestion && (
                  <div className="space-y-3">
                    <STARCoach
                      onApplyStar={(text) => handleAnswerChange(text)}
                      sampleGuide={currentQuestion.sampleStarGuide}
                    />
                  </div>
                )}

                {activeSideTab === 'hints' && currentQuestion && (
                  <div className="space-y-4">
                    <div className="p-3.5 rounded-xl bg-navy-950/60 border border-white/10 space-y-2">
                      <h4 className="text-xs font-bold text-accent-300 flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-emerald-400" />
                        Expected Key Points
                      </h4>
                      <ul className="text-xs text-surface-300 space-y-1.5 list-disc list-inside">
                        {currentQuestion.expectedPoints?.map((pt, i) => (
                          <li key={i}>{pt}</li>
                        )) || (
                          <li className="text-surface-500 italic">No specific checklist points provided.</li>
                        )}
                      </ul>
                    </div>

                    <div className="p-3.5 rounded-xl bg-navy-950/60 border border-white/10 space-y-2">
                      <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                        <Lightbulb size={14} />
                        Tips for High-Scoring Delivery
                      </h4>
                      <p className="text-xs text-surface-400 leading-relaxed">
                        • State your high-level thesis in the first 20 seconds.<br />
                        • Call out trade-offs explicitly (e.g. latency vs consistency, memory vs CPU).<br />
                        • Ask clarifying questions where appropriate for open-ended queries.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* 3. Floating Bottom Video Controls Bar */}
      <footer className="h-18 px-6 bg-navy-900/90 backdrop-blur-md border-t border-white/10 flex items-center justify-between z-20 shrink-0">
        {/* Left: Device Controls */}
        <div className="flex items-center gap-2">
          {/* Mic Button */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
              isMicMuted
                ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                : 'bg-navy-800 border-white/15 text-white hover:bg-navy-700'
            }`}
            title={isMicMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
            <span className="hidden sm:inline text-xs font-medium">
              {isMicMuted ? 'Muted' : 'Mic On'}
            </span>
          </button>

          {/* Camera Button */}
          <button
            type="button"
            onClick={toggleCamera}
            className={`p-3 rounded-xl border flex items-center gap-2 transition-all ${
              !isCameraActive
                ? 'bg-rose-600/20 border-rose-500/40 text-rose-400'
                : 'bg-navy-800 border-white/15 text-white hover:bg-navy-700'
            }`}
            title={isCameraActive ? 'Turn off camera' : 'Turn on camera'}
          >
            {!isCameraActive ? <VideoOff size={18} /> : <Video size={18} />}
            <span className="hidden sm:inline text-xs font-medium">
              {isCameraActive ? 'Camera On' : 'Camera Off'}
            </span>
          </button>

          {/* Device settings modal trigger */}
          <button
            type="button"
            onClick={() => setShowDeviceModal(true)}
            className="p-3 rounded-xl bg-navy-800 border border-white/15 text-surface-300 hover:text-white transition-colors"
            title="Device settings"
          >
            <Settings size={18} />
          </button>
        </div>

        {/* Center: Question Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevQuestion}
            disabled={currentIdx === 0}
            leftIcon={<ChevronLeft size={16} />}
            className="text-white border-white/20 hover:bg-white/10"
          >
            Prev
          </Button>

          <Button
            size="sm"
            onClick={handleNextQuestion}
            rightIcon={<ChevronRight size={16} />}
            className="bg-accent-600 hover:bg-accent-700 text-white"
          >
            {currentIdx < activeQuestions.length - 1 ? 'Next Question' : 'Finish Round'}
          </Button>
        </div>

        {/* Right: End Session Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowEndConfirmModal(true)}
            className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold flex items-center gap-2 transition-all shadow-md shadow-rose-900/30"
          >
            <PhoneOff size={16} />
            <span className="hidden sm:inline">End Interview</span>
          </button>
        </div>
      </footer>

      {/* Confirmation Modal Before Ending Session */}
      <Modal
        isOpen={showEndConfirmModal}
        onClose={() => setShowEndConfirmModal(false)}
        title="Wrap Up Video Interview?"
      >
        <div className="space-y-4">
          <p className="text-sm text-surface-600 dark:text-surface-300">
            Are you sure you want to end this interview practice session? Your camera and microphone will be turned off immediately, and you will be taken to your self-review summary.
          </p>

          <div className="p-3 rounded-xl bg-surface-50 dark:bg-navy-800 border border-surface-200 dark:border-navy-700 text-xs space-y-1">
            <p className="font-semibold text-navy-800 dark:text-white">Session Status:</p>
            <p className="text-surface-500">
              Answered {Object.keys(answers).length} of {activeQuestions.length} questions • Elapsed {formatTimer(elapsedSeconds)}
            </p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndConfirmModal(false)}
            >
              Continue Practicing
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmEndSession}
            >
              Yes, End Session
            </Button>
          </div>
        </div>
      </Modal>

      {/* Device Calibration Modal */}
      <DeviceCheckModal
        isOpen={showDeviceModal}
        onClose={() => setShowDeviceModal(false)}
        onConfirmReady={() => {
          setShowDeviceModal(false);
          toast.success('Equipment settings updated');
        }}
      />

      {/* Post-Interview Self-Review Modal */}
      <SelfReviewModal
        isOpen={showSelfReviewModal}
        onClose={() => setShowSelfReviewModal(false)}
        sessionId={`session-${Date.now()}`}
        role={selectedRole}
        questions={activeQuestions}
        answers={answers}
        elapsedSeconds={elapsedSeconds}
      />
    </div>
  );
}
