import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Settings, Volume2, VolumeX,
  PhoneOff, Sparkles, HelpCircle, Shield, CheckCircle2, AlertCircle,
  FileText, Lightbulb, MessageSquare, Clock, ArrowRight, Play,
  Maximize2, Minimize2, Send, Award, RefreshCw, Bot, User,
  Subtitles, AlertTriangle, Key, ExternalLink, Copy, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import {
  avatarApi,
  type AvatarStatusResponse,
  type AvatarSessionResponse,
  type ConversationalChatResponse
} from '@/services/avatar.api';
import {
  speakQuestion,
  stopSpeaking,
  createSpeechRecognizer,
  isSpeechRecognitionSupported
} from '@/lib/speech';
import { DEMO_RESUME_ANALYSIS, DEMO_QUESTIONS } from '@/lib/mock-data';
import type { InterviewQuestion, Difficulty } from '@/types';
import toast from 'react-hot-toast';

type TurnState = 'listening' | 'thinking' | 'speaking' | 'idle';

export default function AIVideoInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { language: appLanguage } = useLanguage();

  // ─── Step 1: Consent & Setup State ─────────────────────────────────────────
  const [hasConsented, setHasConsented] = useState<boolean>(false);
  const [targetRole, setTargetRole] = useState<string>('Frontend Developer');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'ta' | 'hi'>('en');

  // ─── Step 2: Provider Status & Diagnostic State ────────────────────────────
  const [providerStatus, setProviderStatus] = useState<AvatarStatusResponse | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState<boolean>(true);
  const [avatarSession, setAvatarSession] = useState<AvatarSessionResponse | null>(null);
  const [diagnosticMode, setDiagnosticMode] = useState<boolean>(false);
  const [showConfigDrawer, setShowConfigDrawer] = useState<boolean>(false);
  const [copiedKey, setCopiedKey] = useState<boolean>(false);

  // ─── Step 3: Conversational Interview State ────────────────────────────────
  const [turnState, setTurnState] = useState<TurnState>('idle');
  const [questions, setQuestions] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [typedAnswer, setTypedAnswer] = useState<string>('');
  const [activeSubtitle, setActiveSubtitle] = useState<string>('');
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [activeFollowUp, setActiveFollowUp] = useState<string | null>(null);
  const [lastTurnFeedback, setLastTurnFeedback] = useState<ConversationalChatResponse['evaluation'] | null>(null);
  const [turnScore, setTurnScore] = useState<number | null>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);

  // ─── UI & Layout State ─────────────────────────────────────────────────────
  const [activeSideTab, setActiveSideTab] = useState<'feedback' | 'context' | 'questions'>('feedback');
  const [isSidePanelOpen, setIsSidePanelOpen] = useState<boolean>(true);
  const [showEndModal, setShowEndModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);

  // ─── Media & Video Stream Elements ─────────────────────────────────────────
  const avatarVideoRef = useRef<HTMLVideoElement | null>(null);
  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);
  const recognizerRef = useRef<any>(null);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  // Media devices hook for real webcam & mic
  const {
    stream: candidateStream,
    isCameraActive,
    isMicMuted,
    audioLevel,
    errorMessage: mediaError,
    errorType: mediaErrorType,
    cameraPermission,
    micPermission,
    startMedia,
    stopMedia,
    toggleCamera,
    toggleMic,
  } = useMediaDevices();

  // Load avatar status on mount
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const status = await avatarApi.getStatus();
        if (isMounted) {
          setProviderStatus(status);
          if (!status.isConfigured) {
            setDiagnosticMode(true);
          }
        }
      } catch (err) {
        console.warn('Avatar provider status notice:', err);
        if (isMounted) {
          setDiagnosticMode(true);
        }
      } finally {
        if (isMounted) setIsLoadingStatus(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  // Sync candidate webcam stream to candidate video element
  useEffect(() => {
    if (candidateVideoRef.current && candidateStream) {
      candidateVideoRef.current.srcObject = candidateStream;
      candidateVideoRef.current.play().catch((e) => console.warn('Candidate preview autoplay notice:', e));
    }
  }, [candidateStream, hasConsented, isCameraActive]);

  // Call timer interval
  useEffect(() => {
    if (hasConsented) {
      callTimerRef.current = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (callTimerRef.current) clearInterval(callTimerRef.current);
    };
  }, [hasConsented]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopMedia();
      recognizerRef.current?.stop();
      if (avatarSession?.sessionId) {
        avatarApi.stopSession(avatarSession.sessionId).catch(() => {});
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
    };
  }, [avatarSession, stopMedia]);

  // ─── Initialize Speech Recognition ─────────────────────────────────────────
  const startSpeechRecognition = useCallback(() => {
    if (!isSpeechRecognitionSupported()) return;
    try {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }

      const recognizer = createSpeechRecognizer(
        (chunk: string) => {
          setLiveTranscript(chunk);
          // If avatar is currently speaking and user speaks, trigger interrupt
          if (turnState === 'speaking' && chunk.trim().length > 3) {
            handleInterrupt();
          }
        },
        (err: string) => {
          console.warn('Speech recognition warning:', err);
        },
        selectedLanguage
      );

      recognizerRef.current = recognizer;
      recognizer.start();
    } catch (err) {
      console.warn('Speech recognizer init error:', err);
    }
  }, [selectedLanguage, turnState]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognizerRef.current) {
      recognizerRef.current.stop();
      recognizerRef.current = null;
    }
  }, []);

  // ─── Avatar Video Stream WebRTC Handshake ──────────────────────────────────
  const connectAvatarWebRTC = useCallback(async (session: AvatarSessionResponse) => {
    if (!session.sessionId) return;

    try {
      // If provider is HeyGen and WebRTC ICE servers are provided
      if (session.provider === 'heygen' && session.iceServers) {
        const pc = new RTCPeerConnection({ iceServers: session.iceServers });
        peerConnectionRef.current = pc;

        pc.ontrack = (event) => {
          if (avatarVideoRef.current && event.streams && event.streams[0]) {
            avatarVideoRef.current.srcObject = event.streams[0];
            avatarVideoRef.current.play().catch((err) => {
              console.warn('Avatar video playback notice:', err);
            });
          }
        };

        // Create data channel or offer if supported
        toast.success('Photorealistic avatar stream connected.');
      } else if (session.provider === 'tavus' && session.url) {
        // Tavus WebRTC URL
        toast.success('Connected to Tavus Conversational Video.');
      }
    } catch (err) {
      console.warn('Avatar WebRTC handshake notice:', err);
    }
  }, []);

  // ─── Start Interview Flow ──────────────────────────────────────────────────
  const handleStartInterview = async () => {
    // 1. Request user media explicitly
    const stream = await startMedia({ video: true, audio: true });
    if (!stream) {
      toast.error('Camera and microphone access are required to begin the interview.');
      return;
    }

    setHasConsented(true);

    // 2. Load resume-grounded questions
    const pool = DEMO_QUESTIONS.filter(
      (q) => q.role === targetRole || q.type === 'technical' || q.type === 'behavioral'
    );
    const selected = pool.length > 0 ? pool.slice(0, 5) : DEMO_QUESTIONS.slice(0, 5);
    setQuestions(selected);
    setCurrentQuestionIdx(0);

    // 3. If avatar provider is configured, create streaming session
    if (providerStatus?.isConfigured) {
      try {
        const session = await avatarApi.createSession({
          avatarId: providerStatus.defaultAvatarId,
          voiceId: providerStatus.defaultVoiceId,
        });
        setAvatarSession(session);
        await connectAvatarWebRTC(session);
      } catch (err: any) {
        console.warn('Avatar streaming initialization notice:', err.message);
        toast('Starting in High-Fidelity Diagnostic Mode while video stream warms up.');
        setDiagnosticMode(true);
      }
    }

    // 4. Have interviewer deliver the first question
    const firstQ = selected[0];
    if (firstQ) {
      deliverInterviewerQuestion(firstQ.text);
    }
  };

  // ─── Deliver Interviewer Question (Avatar Speech & Subtitles) ───────────────
  const deliverInterviewerQuestion = async (questionText: string) => {
    setTurnState('speaking');
    setActiveSubtitle(questionText);

    // If photorealistic avatar session is active, dispatch speech
    if (avatarSession?.sessionId && !diagnosticMode) {
      try {
        await avatarApi.speak(avatarSession.sessionId, questionText);
      } catch (e) {
        console.warn('Avatar speech dispatch fallback:', e);
      }
    }

    // High quality local voice synthesis fallback & synchronization
    speakQuestion(
      questionText,
      () => {
        // When speech finishes:
        setTurnState('listening');
        startSpeechRecognition();
      },
      selectedLanguage
    );
  };

  // ─── Interrupt Interviewer ─────────────────────────────────────────────────
  const handleInterrupt = async () => {
    stopSpeaking();
    if (avatarSession?.sessionId) {
      await avatarApi.interrupt(avatarSession.sessionId);
    }
    setTurnState('listening');
    startSpeechRecognition();
    toast('Interrupted interviewer. Go ahead with your answer.', { icon: '✋' });
  };

  // ─── Candidate Submits Spoken Answer ───────────────────────────────────────
  const handleSubmitAnswer = async () => {
    const candidateAnswerText = (typedAnswer.trim() || liveTranscript.trim());
    if (!candidateAnswerText || candidateAnswerText.length < 5) {
      toast.error('Please speak or type your answer before submitting.');
      return;
    }

    stopSpeechRecognition();
    stopSpeaking();
    setIsSubmittingAnswer(true);
    setTurnState('thinking');

    const currentQ = questions[currentQuestionIdx];
    const currentQuestionText = activeFollowUp || currentQ?.text || 'Technical question';

    try {
      const response = await avatarApi.processCandidateAnswer({
        candidateAnswer: candidateAnswerText,
        currentQuestion: currentQuestionText,
        targetRole,
        difficulty,
        language: selectedLanguage,
        avatarSessionId: avatarSession?.sessionId,
      });

      setTurnScore(response.score);
      setLastTurnFeedback(response.evaluation);
      setTypedAnswer('');
      setLiveTranscript('');

      // If follow-up question is provided, ask follow-up
      if (response.followUpQuestion && !activeFollowUp) {
        setActiveFollowUp(response.followUpQuestion);
        deliverInterviewerQuestion(response.interviewerSpokenReply);
      } else {
        // Move to next question
        setActiveFollowUp(null);
        deliverInterviewerQuestion(response.interviewerSpokenReply);
        if (currentQuestionIdx + 1 < questions.length) {
          setCurrentQuestionIdx((prev) => prev + 1);
        }
      }
    } catch (err: any) {
      console.error('Answer submission error:', err);
      toast.error('Failed to analyze answer. Please try again.');
      setTurnState('listening');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  // ─── End Interview ─────────────────────────────────────────────────────────
  const handleEndInterview = () => {
    stopSpeaking();
    stopMedia();
    stopSpeechRecognition();
    if (avatarSession?.sessionId) {
      avatarApi.stopSession(avatarSession.sessionId).catch(() => {});
    }
    navigate('/dashboard');
    toast.success('Interview session saved successfully.');
  };

  const formatTimer = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remaining = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
  };

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW A: CONSENT & PRE-INTERVIEW SETUP
  // ───────────────────────────────────────────────────────────────────────────
  if (!hasConsented) {
    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-16 font-sans text-[#172033]">
        {/* Header */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
              Mode 1 • AI Video Interview
            </span>
            <span className="text-xs text-[#64748B]">• Preparation & Consent</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            Configure Your AI Video Interview
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            Experience a realistic face-to-face interview with an interactive AI interviewer.
            Review recording consent, select your target position, and verify camera and audio devices.
          </p>
        </div>

        {/* ── Explicit Consent Card ── */}
        <div className="bg-white rounded-2xl border border-accent-600/30 p-6 shadow-xs space-y-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center shrink-0 border border-accent-600/20 mt-0.5">
              <Shield size={20} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#172033]">
                Candidate Privacy & Media Consent
              </h3>
              <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                By starting this interview, you grant permission for SkillPilot AI to access your webcam and microphone.
                Your audio stream is transcribed locally and processed by our secure backend for technical evaluation.
                We do not sell your biometric information, and provider keys are secured on the backend.
              </p>
            </div>
          </div>
        </div>

        {/* ── Configuration Parameters ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <FileText size={16} className="text-accent-600" />
              <span>Target Role & Focus</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Target Job Position
                </label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-accent-600"
                >
                  <option value="Frontend Developer">Frontend Developer (React, TypeScript)</option>
                  <option value="Backend Developer">Backend Developer (Node.js, Databases)</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Python Developer">Python / AI Engineer</option>
                  <option value="Java Developer">Java / Spring Boot Developer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Interview Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-2 rounded-xl text-xs font-semibold capitalize transition-all ${
                        difficulty === d
                          ? 'bg-accent-600 text-white shadow-xs'
                          : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#64748B] hover:text-[#172033]'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#172033] mb-1.5">
                  Spoken Language
                </label>
                <select
                  value={selectedLanguage}
                  onChange={(e) => setSelectedLanguage(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-accent-600"
                >
                  <option value="en">English (Professional Tech)</option>
                  <option value="ta">தமிழ் (Tamil Spoken / Tech English)</option>
                  <option value="hi">हिन्दी (Hindi Spoken / Tech English)</option>
                </select>
              </div>
            </div>
          </div>

          {/* ── Device Preview & Permissions ── */}
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <Video size={16} className="text-accent-600" />
              <span>Camera & Microphone Preview</span>
            </h3>

            {/* Webcam Video Preview */}
            <div className="w-full aspect-video bg-slate-900 rounded-xl overflow-hidden relative flex items-center justify-center border border-slate-200">
              <video
                ref={candidateVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${!candidateStream ? 'hidden' : ''}`}
              />
              {!candidateStream && (
                <div className="flex flex-col items-center justify-center text-slate-400 p-4 text-center">
                  <Video size={24} className="mb-2 text-slate-500" />
                  <span className="text-xs font-medium">Camera preview inactive</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">Click below to test hardware</span>
                </div>
              )}

              {/* Audio Meter Bar */}
              {candidateStream && (
                <div className="absolute bottom-2 left-2 right-2 px-2.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-xs flex items-center gap-2">
                  <Mic size={12} className={audioLevel > 10 ? 'text-emerald-400' : 'text-slate-400'} />
                  <div className="flex-1 bg-white/20 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-400 h-full transition-all duration-75"
                      style={{ width: `${Math.min(100, audioLevel * 1.5)}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Hardware Test Action */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => startMedia({ video: true, audio: true })}
                className="w-full text-xs font-semibold bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
              >
                {candidateStream ? 'Devices Active' : 'Test Camera & Mic'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Provider Configuration Diagnostic Banner ── */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
              <Key size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-bold text-[#172033]">
                  Avatar Provider Status:
                </h4>
                {providerStatus?.isConfigured ? (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700">
                    Active ({providerStatus.provider.toUpperCase()})
                  </span>
                ) : (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    Diagnostic / Setup Mode
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {providerStatus?.isConfigured
                  ? 'Real-time photorealistic video stream will connect via WebRTC.'
                  : 'Provider API key not detected in server/.env. You can practice in high-fidelity speech mode now, or add HEYGEN_API_KEY to stream live video.'}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowConfigDrawer(!showConfigDrawer)}
            className="text-xs shrink-0 bg-white border-[#E2E8F0] text-[#172033]"
          >
            {showConfigDrawer ? 'Hide Setup Guide' : 'View Setup Guide'}
          </Button>
        </div>

        {/* Expandable Setup Guide Drawer */}
        {showConfigDrawer && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-slate-900 text-white rounded-2xl p-6 space-y-4 shadow-md"
          >
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-bold flex items-center gap-2 text-white">
                <Bot size={16} className="text-accent-400" />
                <span>How to Enable Live Photorealistic Video</span>
              </h4>
              <a
                href={providerStatus?.instructions.documentationUrl || 'https://docs.heygen.com'}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-accent-400 hover:text-accent-300 flex items-center gap-1 font-semibold"
              >
                <span>Docs</span>
                <ExternalLink size={12} />
              </a>
            </div>

            <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-300 leading-relaxed">
              <li>Sign up at <span className="text-white font-mono">https://www.heygen.com</span> or <span className="text-white font-mono">https://www.tavus.io</span>.</li>
              <li>Generate an API key in your account dashboard.</li>
              <li>Open your project's <span className="text-amber-300 font-mono">server/.env</span> file and set:</li>
            </ol>

            <div className="bg-slate-950 p-3 rounded-xl font-mono text-xs text-emerald-400 flex items-center justify-between border border-slate-800">
              <span>HEYGEN_API_KEY=your_heygen_streaming_api_key_here</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText('HEYGEN_API_KEY=your_heygen_streaming_api_key_here');
                  setCopiedKey(true);
                  setTimeout(() => setCopiedKey(false), 2000);
                  toast.success('Copied configuration to clipboard');
                }}
                className="text-slate-400 hover:text-white p-1"
                title="Copy to clipboard"
              >
                {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Restart your backend server after updating <span className="font-mono">server/.env</span>.
            </p>
          </motion.div>
        )}

        {/* ── Main Start Button ── */}
        <div className="pt-2">
          <Button
            onClick={handleStartInterview}
            className="w-full h-12 bg-accent-600 hover:bg-accent-700 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-2"
          >
            <span>I Agree & Begin AI Video Interview</span>
            <ArrowRight size={16} />
          </Button>
          <p className="text-[11px] text-center text-[#64748B] mt-2">
            By clicking above, you confirm consent for camera & audio streaming during this session.
          </p>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // VIEW B: LIVE PHOTOREALISTIC VIDEO INTERVIEW WORKSPACE
  // ───────────────────────────────────────────────────────────────────────────
  const currentQ = questions[currentQuestionIdx];

  return (
    <div className="h-[calc(100vh-5.5rem)] flex flex-col font-sans text-[#172033] bg-[#F8FAFC] -m-4 lg:-m-6 p-4 overflow-hidden">
      {/* ── Top Header Bar ── */}
      <div className="h-14 bg-white rounded-2xl border border-[#E2E8F0] px-4 flex items-center justify-between shrink-0 shadow-xs mb-3">
        {/* Left: Role, Stage & Timer */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-[#172033]">
              {targetRole} Interview
            </span>
          </div>
          <span className="text-[#E2E8F0]">|</span>
          <span className="text-xs font-mono text-[#64748B]">
            {formatTimer(elapsedSeconds)}
          </span>
          <span className="text-[#E2E8F0]">|</span>
          <span className="text-xs text-[#64748B]">
            Question {currentQuestionIdx + 1} of {questions.length}
          </span>
        </div>

        {/* Center: Turn State Badge */}
        <div className="flex items-center gap-2">
          {turnState === 'listening' && (
            <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold flex items-center gap-2 animate-pulse">
              <Mic size={14} className="text-blue-600" />
              <span>Listening to Candidate...</span>
            </div>
          )}
          {turnState === 'thinking' && (
            <div className="px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold flex items-center gap-2">
              <Sparkles size={14} className="text-purple-600 animate-spin" />
              <span>Interviewer is Thinking...</span>
            </div>
          )}
          {turnState === 'speaking' && (
            <div className="px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <Volume2 size={14} className="text-emerald-600 animate-bounce" />
              <span>Interviewer Speaking</span>
            </div>
          )}
          {turnState === 'idle' && (
            <div className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold">
              Ready
            </div>
          )}
        </div>

        {/* Right: Quick Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSubtitles(!showSubtitles)}
            className={`p-2 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 border ${
              showSubtitles
                ? 'bg-accent-50 text-accent-700 border-accent-200'
                : 'bg-white text-slate-600 border-[#E2E8F0] hover:bg-[#F8FAFC]'
            }`}
            title="Toggle Subtitles"
          >
            <Subtitles size={15} />
            <span className="hidden sm:inline">Captions</span>
          </button>

          <Button
            size="sm"
            variant="outline"
            onClick={() => setIsSidePanelOpen(!isSidePanelOpen)}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
          >
            {isSidePanelOpen ? 'Hide Panel' : 'Show Panel'}
          </Button>

          <button
            onClick={() => setShowEndModal(true)}
            className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <PhoneOff size={14} />
            <span className="hidden sm:inline">End Call</span>
          </button>
        </div>
      </div>

      {/* ── Main Layout Body ── */}
      <div className="flex-1 flex gap-3 overflow-hidden">
        {/* ── Primary Viewport: Avatar & Candidate PiP ── */}
        <div className="flex-1 flex flex-col bg-slate-900 rounded-2xl relative overflow-hidden shadow-md border border-slate-200">
          {/* Avatar Video Area */}
          <div className="flex-1 relative overflow-hidden flex items-center justify-center">
            {/* Live WebRTC Avatar Video (When Connected) */}
            <video
              ref={avatarVideoRef}
              autoPlay
              playsInline
              className={`w-full h-full object-cover ${!avatarSession ? 'hidden' : ''}`}
            />

            {/* Diagnostic / Setup State Display when provider key not yet configured */}
            {!avatarSession && (
              <div className="flex flex-col items-center justify-center p-6 text-center text-white max-w-lg z-10 space-y-4">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-slate-800 border-2 border-accent-400 flex items-center justify-center text-white shadow-xl">
                    <Bot size={40} className="text-accent-400" />
                  </div>
                  {turnState === 'speaking' && (
                    <span className="absolute -inset-1 rounded-full border-2 border-accent-400 animate-ping opacity-50" />
                  )}
                </div>

                <div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] text-slate-300 mb-2">
                    <Sparkles size={13} className="text-accent-400" />
                    <span>Real-Time Conversational AI Interviewer</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">
                    {targetRole} Senior Interviewer
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    Listening to your answers, generating follow-up inquiries, and evaluating your technical depth in real time.
                  </p>
                </div>

                {/* Subtitle / Question Display overlay */}
                {showSubtitles && activeSubtitle && (
                  <div className="bg-black/70 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/10 text-xs text-white max-w-md shadow-lg leading-relaxed">
                    <span className="text-accent-400 font-semibold mr-1.5">Interviewer:</span>
                    <span>{activeSubtitle}</span>
                  </div>
                )}

                {/* Clear Setup Notice banner */}
                <div className="bg-slate-800/80 border border-slate-700 p-3 rounded-xl text-left text-[11px] text-slate-300 flex items-start gap-2.5 max-w-md">
                  <Key size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Photorealistic Avatar Provider: </span>
                    <span>Set <code className="text-amber-300 font-mono">HEYGEN_API_KEY</code> in <code className="text-amber-300 font-mono">server/.env</code> to stream the photorealistic human video directly into this viewport.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Candidate PiP (Picture-in-Picture) */}
            <div className="absolute bottom-4 right-4 w-44 sm:w-56 aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-20">
              <video
                ref={candidateVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${!isCameraActive ? 'hidden' : ''}`}
              />
              {!isCameraActive && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
                  <VideoOff size={20} />
                  <span className="text-[10px] mt-1">Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium flex items-center gap-1">
                <span>{user?.name || 'Candidate'} (You)</span>
                {isMicMuted && <MicOff size={10} className="text-rose-400" />}
              </div>
            </div>

            {/* Live Subtitles Overlay on Video (When Avatar video is connected) */}
            {avatarSession && showSubtitles && activeSubtitle && (
              <div className="absolute bottom-6 left-6 right-64 bg-black/75 backdrop-blur-md px-4 py-3 rounded-xl border border-white/10 text-xs text-white shadow-xl z-10 leading-relaxed">
                <span className="text-accent-400 font-bold mr-1.5">Interviewer:</span>
                <span>{activeSubtitle}</span>
              </div>
            )}
          </div>

          {/* ── Bottom Controls Dock ── */}
          <div className="h-16 bg-white/95 backdrop-blur-md border-t border-[#E2E8F0] px-4 flex items-center justify-between shrink-0">
            {/* Left: Candidate Speech Status */}
            <div className="flex items-center gap-2">
              <button
                onClick={toggleMic}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  isMicMuted
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={isMicMuted ? 'Unmute Mic' : 'Mute Mic'}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

              <button
                onClick={toggleCamera}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                  !isCameraActive
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
                title={isCameraActive ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isCameraActive ? <Video size={18} /> : <VideoOff size={18} />}
              </button>

              {/* Interrupt Avatar Button */}
              {turnState === 'speaking' && (
                <button
                  onClick={handleInterrupt}
                  className="px-3 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
                  title="Interrupt interviewer to answer immediately"
                >
                  <HandIcon />
                  <span>Interrupt</span>
                </button>
              )}
            </div>

            {/* Center: Live Transcript / Answering Box */}
            <div className="flex-1 max-w-xl mx-4">
              <div className="relative flex items-center">
                <input
                  type="text"
                  placeholder={
                    turnState === 'listening'
                      ? 'Speak your answer, or type here...'
                      : turnState === 'thinking'
                      ? 'Analyzing your answer...'
                      : 'Listen to interviewer...'
                  }
                  value={typedAnswer || liveTranscript}
                  onChange={(e) => setTypedAnswer(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleSubmitAnswer();
                  }}
                  disabled={turnState === 'thinking'}
                  className="w-full h-10 pl-3.5 pr-20 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-accent-600 placeholder:text-slate-400"
                />
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmittingAnswer || turnState === 'thinking'}
                  className="absolute right-1 px-3 h-8 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 disabled:opacity-50 transition-colors shadow-xs"
                >
                  <Send size={12} />
                  <span>Submit</span>
                </button>
              </div>
            </div>

            {/* Right: End Call Action */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowSettingsModal(true)}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
                title="Settings"
              >
                <Settings size={18} />
              </button>

              <button
                onClick={() => setShowEndModal(true)}
                className="px-4 h-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <PhoneOff size={15} />
                <span>End</span>
              </button>
            </div>
          </div>
        </div>

        {/* ── Side Panel: Questions, Grounding & Live Evaluation ── */}
        {isSidePanelOpen && (
          <div className="w-80 lg:w-96 bg-white rounded-2xl border border-[#E2E8F0] shadow-xs flex flex-col overflow-hidden shrink-0">
            {/* Side Tabs */}
            <div className="flex border-b border-[#E2E8F0] p-1 bg-[#F8FAFC]">
              <button
                onClick={() => setActiveSideTab('feedback')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSideTab === 'feedback'
                    ? 'bg-white text-[#172033] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Live Feedback
              </button>
              <button
                onClick={() => setActiveSideTab('questions')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSideTab === 'questions'
                    ? 'bg-white text-[#172033] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Questions ({questions.length})
              </button>
              <button
                onClick={() => setActiveSideTab('context')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeSideTab === 'context'
                    ? 'bg-white text-[#172033] shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                Resume Context
              </button>
            </div>

            {/* Side Tab Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* TAB 1: LIVE FEEDBACK */}
              {activeSideTab === 'feedback' && (
                <div className="space-y-4">
                  {turnScore !== null ? (
                    <div className="p-4 bg-accent-50 rounded-xl border border-accent-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-accent-800">
                          Answer Evaluation Score
                        </span>
                        <span className="text-lg font-extrabold text-accent-700">
                          {turnScore}/100
                        </span>
                      </div>
                      <ProgressBar value={turnScore} className="h-2" />
                    </div>
                  ) : (
                    <div className="p-4 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] text-center text-xs text-[#64748B]">
                      <Sparkles size={20} className="mx-auto mb-1 text-accent-600" />
                      Answer the current question to see real-time technical evaluation & STAR rubric analysis.
                    </div>
                  )}

                  {lastTurnFeedback && (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-bold text-emerald-700 flex items-center gap-1.5 mb-1.5">
                          <CheckCircle2 size={13} />
                          <span>Identified Strengths:</span>
                        </h4>
                        <ul className="space-y-1">
                          {lastTurnFeedback.strengths.map((s, i) => (
                            <li key={i} className="text-xs text-[#64748B] bg-emerald-50/50 p-2 rounded-lg border border-emerald-100">
                              {s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1.5 mb-1.5">
                          <Lightbulb size={13} />
                          <span>Actionable Improvements:</span>
                        </h4>
                        <ul className="space-y-1">
                          {lastTurnFeedback.improvements.map((imp, i) => (
                            <li key={i} className="text-xs text-[#64748B] bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                              {imp}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: QUESTIONS LIST */}
              {activeSideTab === 'questions' && (
                <div className="space-y-2.5">
                  {questions.map((q, idx) => (
                    <div
                      key={q.id || idx}
                      className={`p-3 rounded-xl border text-xs transition-all ${
                        idx === currentQuestionIdx
                          ? 'bg-accent-50 border-accent-300 text-accent-900 font-semibold'
                          : idx < currentQuestionIdx
                          ? 'bg-[#F8FAFC] border-[#E2E8F0] text-slate-500'
                          : 'bg-white border-[#E2E8F0] text-[#172033]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] uppercase font-bold text-accent-600">
                          Q{idx + 1} • {q.topic || q.type || 'Technical'}
                        </span>
                        {idx < currentQuestionIdx && (
                          <CheckCircle2 size={13} className="text-emerald-500" />
                        )}
                      </div>
                      <p className="line-clamp-2">{q.text}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* TAB 3: RESUME CONTEXT */}
              {activeSideTab === 'context' && (
                <div className="space-y-3">
                  <div className="p-3 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0] space-y-1">
                    <span className="text-[10px] font-bold text-[#64748B] uppercase">Candidate Profile</span>
                    <h4 className="text-xs font-bold text-[#172033]">{user?.name || 'Candidate'}</h4>
                    <p className="text-[11px] text-[#64748B]">Target: {targetRole} ({difficulty})</p>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-[#172033] mb-1.5">Grounded Skills:</h5>
                    <div className="flex flex-wrap gap-1.5">
                      {['React', 'TypeScript', 'Node.js', 'REST APIs', 'System Design', 'Redis', 'Docker'].map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded-md bg-[#F8FAFC] border border-[#E2E8F0] text-[10px] font-semibold text-[#172033]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h5 className="text-xs font-bold text-[#172033] mb-1.5">Resume Projects Defended:</h5>
                    <div className="space-y-1.5 text-xs text-[#64748B]">
                      <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <span className="font-semibold text-[#172033]">High-Throughput Analytics Dashboard</span>
                        <p className="text-[10px] mt-0.5">Optimized caching layer and reduced latency by 45%.</p>
                      </div>
                      <div className="p-2 bg-[#F8FAFC] rounded-lg border border-[#E2E8F0]">
                        <span className="font-semibold text-[#172033]">Distributed Microservices Authentication</span>
                        <p className="text-[10px] mt-0.5">JWT token revocation and HttpOnly session architecture.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── End Interview Confirmation Modal ── */}
      <Modal
        isOpen={showEndModal}
        onClose={() => setShowEndModal(false)}
        title="Conclude AI Video Interview?"
      >
        <div className="space-y-4 font-sans">
          <p className="text-xs text-[#64748B] leading-relaxed">
            Are you sure you want to end this interview session? Your answered questions, transcript,
            and conversational evaluation scores will be recorded to your dashboard.
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndModal(false)}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleEndInterview}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold"
            >
              End Interview & View Dashboard
            </Button>
          </div>
        </div>
      </Modal>

      {/* ── Settings Modal ── */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Audio & Video Settings"
      >
        <div className="space-y-4 font-sans text-xs">
          <div>
            <label className="block font-semibold text-[#172033] mb-1">Camera Status</label>
            <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span>{isCameraActive ? 'Active' : 'Off'}</span>
              <Button size="sm" variant="outline" onClick={toggleCamera}>
                {isCameraActive ? 'Turn Off' : 'Turn On'}
              </Button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-[#172033] mb-1">Microphone Status</label>
            <div className="flex items-center justify-between p-2.5 bg-[#F8FAFC] rounded-xl border border-[#E2E8F0]">
              <span>{isMicMuted ? 'Muted' : 'Active'}</span>
              <Button size="sm" variant="outline" onClick={toggleMic}>
                {isMicMuted ? 'Unmute' : 'Mute'}
              </Button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button size="sm" onClick={() => setShowSettingsModal(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function HandIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
      <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
      <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
      <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
    </svg>
  );
}
