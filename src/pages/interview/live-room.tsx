import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic, MicOff, Video, VideoOff, ScreenShare, PhoneOff, Settings,
  MessageSquare, FileText, Code2, Users, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, Copy, ExternalLink, Shield, Star,
  Volume2, Maximize2, Minimize2, Send, Clock, Sparkles, RefreshCw
} from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/contexts/auth-context';
import { useLiveWebRTC } from '@/hooks/useLiveWebRTC';
import {
  getInterviewByRoomCode,
  saveInterviewEvaluation,
} from '@/lib/scheduled-interviews';
import { getQuestionsForConfig, DEMO_QUESTIONS } from '@/lib/mock-data';
import type {
  InterviewUserRole,
  InterviewStage,
  InterviewQuestion,
  LiveInterviewEvaluation,
  ScheduledInterview,
} from '@/types';
import toast from 'react-hot-toast';

const INTERVIEW_STAGES: { id: InterviewStage; label: string }[] = [
  { id: 'intro', label: '1. Introduction & Overview' },
  { id: 'technical', label: '2. Technical Concepts' },
  { id: 'coding', label: '3. Live Problem Solving' },
  { id: 'system-design', label: '4. System Architecture' },
  { id: 'behavioral', label: '5. Behavioral & Culture' },
  { id: 'qa', label: '6. Candidate Q&A' },
  { id: 'wrap-up', label: '7. Wrap Up' },
];

export default function LiveInterviewRoomPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const roomCode = roomId || searchParams.get('room') || 'apti-meet-801';

  // Role from query param: ?role=interviewer or ?role=candidate
  const urlRole = searchParams.get('role') as InterviewUserRole | null;
  const [role, setRole] = useState<InterviewUserRole>(urlRole === 'interviewer' ? 'interviewer' : 'candidate');

  // Load scheduled session details
  const [session, setSession] = useState<ScheduledInterview | null>(null);

  // Active Stage & Question index
  const [currentStage, setCurrentStage] = useState<InterviewStage>('technical');
  const [questionList, setQuestionList] = useState<InterviewQuestion[]>([]);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);

  // Live Shared Code state
  const [codeContent, setCodeContent] = useState<string>(
    `// Live Technical Workspace\n// Language: TypeScript\n\nfunction findLongestSubarray(nums: number[], k: number): number {\n  // Candidate live coding area\n  let maxLength = 0;\n  let currentSum = 0;\n  // Write your solution here...\n  return maxLength;\n}\n`
  );

  // Private Interviewer Evaluation Rubric State
  const [technicalRating, setTechnicalRating] = useState<number>(4);
  const [problemSolvingRating, setProblemSolvingRating] = useState<number>(4);
  const [communicationRating, setCommunicationRating] = useState<number>(4);
  const [interviewerRecommendation, setInterviewerRecommendation] = useState<
    'strong-hire' | 'hire' | 'weak-hire' | 'no-hire'
  >('hire');
  const [interviewerNotes, setInterviewerNotes] = useState<string>('');
  const [publicCandidateFeedback, setPublicCandidateFeedback] = useState<string>('');
  const [candidateNotes, setCandidateNotes] = useState<string>('');

  // UI Panels
  const [activeTab, setActiveTab] = useState<'questions' | 'coding' | 'chat' | 'participants'>('questions');
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [showDeviceSettings, setShowDeviceSettings] = useState<boolean>(false);
  const [showEndCallModal, setShowEndCallModal] = useState<boolean>(false);
  const [showEvaluationModal, setShowEvaluationModal] = useState<boolean>(false);
  const [chatInputText, setChatInputText] = useState<string>('');
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [speakerVolume, setSpeakerVolume] = useState<number>(1);
  const [guestName, setGuestName] = useState<string>('');
  const [guestRole, setGuestRole] = useState<InterviewUserRole>(urlRole === 'interviewer' ? 'interviewer' : 'candidate');
  const [hasEnteredGuest, setHasEnteredGuest] = useState<boolean>(Boolean(user));
  const [guestConsent, setGuestConsent] = useState<boolean>(true);

  // Video Element Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);

  const userName =
    user?.name ||
    guestName ||
    (role === 'interviewer'
      ? session?.interviewerName || 'Lead Interviewer'
      : session?.candidateName || 'Candidate');

  // Test speaker chime via Web Audio API
  const testSpeakerChime = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2 * speakerVolume, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
      toast.success('Speaker test tone played');
    } catch {
      toast('Speaker test tone');
    }
  }, [speakerVolume]);

  // ─── Initialize WebRTC Hook ──────────────────────────────────────────────
  const {
    localStream,
    remoteStream,
    isCameraOn,
    isMicMuted,
    isScreenSharing,
    callState,
    waitingParticipants,
    remoteParticipant,
    connectionQuality,
    chatMessages,
    audioInputDevices,
    videoInputDevices,
    selectedAudioDeviceId,
    selectedVideoDeviceId,
    startLocalMedia,
    toggleCamera,
    toggleMic,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    admitCandidate,
    denyCandidate,
    sendChatMessage,
    syncQuestion,
    syncStage,
    syncCode,
    leaveCall,
    endCallForEveryone,
    reconnectPeer,
  } = useLiveWebRTC({
    roomCode,
    role,
    userName,
    userEmail: user?.email,
    onQuestionSync: (idx) => setCurrentQuestionIdx(idx),
    onStageSync: (stage) => setCurrentStage(stage),
    onCodeSync: (code) => setCodeContent(code),
    onCallEnded: () => {
      if (role === 'interviewer') {
        setShowEvaluationModal(true);
      } else {
        navigate(`/interview/feedback/${roomCode}`);
      }
    },
  });

  // Load session metadata on mount
  useEffect(() => {
    const s = getInterviewByRoomCode(roomCode);
    setSession(s);

    // Load questions based on role
    const questions = getQuestionsForConfig({
      role: s?.role || 'Frontend Developer',
      type: s?.type || 'technical',
      difficulty: 'medium',
      questionCount: 6,
      technologies: ['React', 'TypeScript', 'Node.js'],
      timePerQuestion: 180,
    });
    setQuestionList(questions.length > 0 ? questions : DEMO_QUESTIONS.slice(0, 6));
  }, [roomCode]);

  // Request initial local camera & mic upon joining
  useEffect(() => {
    startLocalMedia();
  }, [startLocalMedia]);

  // Bind local stream to local video element with autoplay safeguard
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch((err) => {
        console.warn('Local preview autoplay notice:', err);
      });
    }
  }, [localStream, callState, role, isCameraOn]);

  // Bind remote stream to remote video element with autoplay safeguard
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => {
        console.warn('Remote video playback auto-play notice:', err);
      });
    }
  }, [remoteStream, callState]);

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handlers for Question & Stage Sync
  const handleNextQuestion = () => {
    if (currentQuestionIdx < questionList.length - 1) {
      const nextIdx = currentQuestionIdx + 1;
      setCurrentQuestionIdx(nextIdx);
      syncQuestion(nextIdx);
    }
  };

  const handlePrevQuestion = () => {
    if (currentQuestionIdx > 0) {
      const prevIdx = currentQuestionIdx - 1;
      setCurrentQuestionIdx(prevIdx);
      syncQuestion(prevIdx);
    }
  };

  const handleStageChange = (newStage: InterviewStage) => {
    setCurrentStage(newStage);
    syncStage(newStage);
  };

  const handleCodeChange = (newCode: string) => {
    setCodeContent(newCode);
    syncCode(newCode);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (chatInputText.trim()) {
      sendChatMessage(chatInputText);
      setChatInputText('');
    }
  };

  // Role toggle for seamless multi-tab testing
  const switchRole = (newRole: InterviewUserRole) => {
    setRole(newRole);
    setSearchParams({ role: newRole });
    window.location.reload();
  };

  const copyCandidateLink = () => {
    const url = `${window.location.origin}/interview/live/${roomCode}?role=candidate`;
    navigator.clipboard.writeText(url);
    toast.success('Candidate invitation link copied to clipboard!');
  };

  const openCandidateTab = () => {
    const url = `/interview/live/${roomCode}?role=candidate`;
    window.open(url, '_blank');
  };

  const currentQuestion = questionList[currentQuestionIdx];

  // Submit Final Evaluation
  const handleSubmitEvaluation = () => {
    const evalData: LiveInterviewEvaluation = {
      id: `eval_${Date.now()}`,
      sessionId: session?.id || `int_${roomCode}`,
      roomCode: roomCode,
      candidateName: session?.candidateName || 'Alex Johnson',
      role: session?.role || 'Frontend Developer',
      interviewType: session?.type || 'technical',
      interviewerName: userName,
      submittedAt: new Date().toISOString(),
      technicalScore: technicalRating,
      problemSolvingScore: problemSolvingRating,
      communicationScore: communicationRating,
      overallRating: Math.round(((technicalRating + problemSolvingRating + communicationRating) / 3) * 10) / 10,
      recommendation: interviewerRecommendation,
      strengths: [
        'Structured analytical methodology during core architectural questions.',
        'Clear articulation of code complexity and optimization trade-offs.',
      ],
      improvements: [
        'Consider edge cases upfront before beginning live implementation.',
      ],
      publicFeedback:
        publicCandidateFeedback ||
        'Strong performance overall with sound engineering foundations and confident communication.',
      confidentialNotes:
        interviewerNotes ||
        'Candidate is qualified for the target engineering band. Recommend proceeding to team matching.',
      isSubmitted: true,
    };

    saveInterviewEvaluation(evalData);
    toast.success('Candidate evaluation successfully recorded!');
    navigate(`/interview/feedback/${roomCode}`);
  };

  // ─── Guest Onboarding Check for Invited Users ────────────────────────────
  if (!user && !hasEnteredGuest) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans text-[#172033]">
        <div className="max-w-md w-full bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-sm space-y-5">
          <div className="flex items-center gap-2.5">
            <Logo size="md" showTagline={false} />
          </div>
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-50 text-accent-700 border border-accent-200">
              Live Human Interview Room
            </span>
            <h2 className="text-xl font-bold text-[#172033] mt-2">
              Join Interview Room
            </h2>
            <p className="text-xs text-[#64748B] mt-1">
              Room Code: <span className="font-mono text-slate-900 font-semibold">{roomCode}</span>
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!guestName.trim()) {
                toast.error('Please enter your name to enter the room');
                return;
              }
              setRole(guestRole);
              setHasEnteredGuest(true);
              startLocalMedia();
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Your Full Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Alex Johnson"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#172033] focus:outline-none focus:border-accent-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#172033] mb-1">
                Your Role
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setGuestRole('candidate')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    guestRole === 'candidate'
                      ? 'bg-accent-600 text-white border-accent-600 shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  Candidate
                </button>
                <button
                  type="button"
                  onClick={() => setGuestRole('interviewer')}
                  className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                    guestRole === 'interviewer'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B]'
                  }`}
                >
                  Interviewer
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-1 text-xs text-[#64748B]">
              <input
                type="checkbox"
                id="guest-consent"
                checked={guestConsent}
                onChange={(e) => setGuestConsent(e.target.checked)}
                className="mt-0.5 rounded text-accent-600 focus:ring-accent-500"
                required
              />
              <label htmlFor="guest-consent" className="text-[11px] leading-tight">
                I consent to share my camera and microphone for live peer-to-peer interview communication.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-accent-600 hover:bg-accent-700 text-white font-semibold text-xs shadow-xs"
            >
              Enter Interview Room
            </Button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-50 flex flex-col font-sans select-none overflow-hidden">
      {/* ─── Top Enterprise Header Bar ──────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-4">
          <Logo size="sm" showTagline={false} />
          <div className="h-4 w-px bg-slate-200 hidden sm:block" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold text-slate-900 tracking-tight">
                {session?.title || `${roomCode.toUpperCase()} • Live Interview`}
              </h1>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  role === 'interviewer'
                    ? 'bg-[#F5F1E8] text-[#202020] border border-surface-200'
                    : 'bg-success-500/10 text-success-500 border border-success-500/30'
                }`}
              >
                {role === 'interviewer' ? 'Host / Interviewer' : 'Candidate'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 hidden sm:block">
              Room: <span className="font-mono text-slate-700 font-medium">{roomCode}</span> • Role:{' '}
              {session?.role || 'Frontend Developer'}
            </p>
          </div>
        </div>

        {/* Center: Stage & Timer indicator */}
        <div className="hidden md:flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-full px-3 py-1">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-medium text-slate-700">
            {INTERVIEW_STAGES.find((s) => s.id === currentStage)?.label || 'Live Session'}
          </span>
          <span className="text-slate-300">|</span>
          <div className="flex items-center gap-1 text-xs text-slate-600 font-mono font-medium">
            <Clock size={12} className="text-slate-400" />
            <span>{formatTimer(elapsedSeconds)}</span>
          </div>
        </div>

        {/* Right actions: Invite Links & Quick Two-Tab Test */}
        <div className="flex items-center gap-2">
          {role === 'interviewer' && (
            <>
              <button
                onClick={copyCandidateLink}
                className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
                title="Copy candidate invitation link"
              >
                <Copy size={13} className="text-slate-500" />
                <span>Copy Invite Link</span>
              </button>
              <button
                onClick={openCandidateTab}
                className="hidden xl:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#F5F1E8] hover:bg-accent-100 border border-surface-200 text-[#202020] text-xs font-medium transition-colors"
                title="Open Candidate tab to test WebRTC live audio/video peer connection"
              >
                <ExternalLink size={13} />
                <span>Test 2nd Tab as Candidate</span>
              </button>
            </>
          )}

          {/* Quick Role Switcher for Testing */}
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 text-xs">
            <button
              onClick={() => switchRole('interviewer')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                role === 'interviewer'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Interviewer
            </button>
            <button
              onClick={() => switchRole('candidate')}
              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                role === 'candidate'
                  ? 'bg-white text-slate-900 shadow-xs font-semibold'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Candidate
            </button>
          </div>
        </div>
      </header>

      {/* ─── Host Admission Banner (When candidate is in waiting room) ─── */}
      <AnimatePresence>
        {role === 'interviewer' && waitingParticipants.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-amber-50 border-b border-amber-200 px-4 py-2.5 flex items-center justify-between text-xs text-amber-900 z-10"
          >
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
              <span className="font-semibold">Candidate in Waiting Room:</span>
              <span>
                {waitingParticipants[0].name} ({waitingParticipants[0].email || 'Candidate'}) requested to join.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => admitCandidate(waitingParticipants[0].id)}
                className="px-3 py-1 rounded-md bg-[#202020] hover:bg-accent-700 text-white font-medium text-xs shadow-xs"
              >
                Admit to Interview
              </button>
              <button
                onClick={() => denyCandidate(waitingParticipants[0].id)}
                className="px-3 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium text-xs"
              >
                Decline
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Candidate Waiting Room View ───────────────────────────────── */}
      {role === 'candidate' && callState === 'waiting_room' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-slate-50">
          <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-6 text-center space-y-5">
            <div className="w-14 h-14 rounded-full bg-[#F5F1E8] text-[#202020] border border-surface-200 mx-auto flex items-center justify-center">
              <Users size={28} />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#F5F1E8] text-[#202020] border border-surface-200">
                Waiting for Host Admission
              </span>
              <h2 className="text-lg font-bold text-slate-900 pt-2">
                You are in the Waiting Room
              </h2>
              <p className="text-xs text-slate-500">
                The interviewer ({session?.interviewerName || 'Lead Host'}) will admit you shortly. Please keep this tab open.
              </p>
            </div>

            {/* Self Camera Diagnostic Preview */}
            <div className="aspect-video bg-slate-900 rounded-xl overflow-hidden relative shadow-inner">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className={`w-full h-full object-cover -scale-x-100 ${!isCameraOn ? 'hidden' : ''}`}
              />
              {!isCameraOn && (
                <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                  <VideoOff size={32} />
                  <p className="text-xs mt-2">Camera is Off</p>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-xs rounded-md text-[11px] text-white font-medium">
                {userName} (You)
              </div>
            </div>

            {/* Hardware Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={toggleMic}
                className={`p-3 rounded-full border transition-colors ${
                  isMicMuted
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title={isMicMuted ? 'Unmute Microphone' : 'Mute Microphone'}
              >
                {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
              </button>
              <button
                onClick={toggleCamera}
                className={`p-3 rounded-full border transition-colors ${
                  !isCameraOn
                    ? 'bg-rose-50 border-rose-200 text-rose-600'
                    : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                }`}
                title={isCameraOn ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
              </button>
            </div>

            <div className="pt-2 text-left bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] text-slate-600 space-y-1">
              <p className="font-semibold text-slate-700 flex items-center gap-1.5">
                <CheckCircle2 size={13} className="text-emerald-500" />
                Candidate Checklist:
              </p>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-500">
                <li>Verify your microphone and lighting are clear.</li>
                <li>Keep a notepad or water bottle handy.</li>
                <li>Your interview will connect immediately when admitted.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── Main Video Call Workspace (When Admitted / Host) ───────────── */}
      {(role === 'interviewer' || callState !== 'waiting_room') && (
        <div className="flex-1 flex overflow-hidden relative">
          {/* Main Stage: Video Viewport & Controls */}
          <div className="flex-1 flex flex-col p-4 overflow-hidden relative">
            {/* Primary Remote Video Area */}
            <div className="flex-1 bg-slate-900 rounded-2xl relative overflow-hidden flex items-center justify-center shadow-md border border-slate-200">
              {/* Remote Stream Video */}
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                onLoadedMetadata={(e) => {
                  (e.target as HTMLVideoElement).play().catch(() => {});
                }}
                className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
              />

              {/* Fallback Display if Remote Participant is Waiting / Ringing / Connecting / Reconnecting */}
              {!remoteStream && (
                <div className="flex flex-col items-center justify-center text-center p-6 space-y-4 max-w-md z-10">
                  {/* State 1: Ringing / Participant Knocking */}
                  {(callState === 'ringing' || waitingParticipants.length > 0) ? (
                    <>
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 text-3xl font-bold shadow-lg animate-bounce">
                          🔔
                        </div>
                        <span className="absolute -inset-1 rounded-full border-2 border-amber-400 animate-ping opacity-60" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/30 text-[10px] text-amber-300 mb-2">
                          <span>Incoming Knock</span>
                        </div>
                        <h3 className="text-white text-base font-semibold">
                          {waitingParticipants[0]?.name || 'Participant'} is in the Waiting Room
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          Admit the candidate to establish the live peer-to-peer WebRTC connection.
                        </p>
                      </div>
                      {waitingParticipants.length > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <button
                            onClick={() => admitCandidate(waitingParticipants[0].id)}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <CheckCircle2 size={14} />
                            Admit to Call
                          </button>
                          <button
                            onClick={() => denyCandidate(waitingParticipants[0].id)}
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-slate-300 rounded-lg text-xs font-semibold shadow-xs transition-colors"
                          >
                            Deny
                          </button>
                        </div>
                      )}
                    </>
                  ) : callState === 'connecting' ? (
                    /* State 2: Connecting */
                    <>
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-accent-400 flex items-center justify-center text-white shadow-lg">
                          <RefreshCw size={32} className="text-accent-400 animate-spin" />
                        </div>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-accent-600/20 border border-accent-400/30 text-[10px] text-accent-300 mb-2">
                          <span>Connecting WebRTC Stream</span>
                        </div>
                        <h3 className="text-white text-base font-semibold">
                          Negotiating Real-Time P2P Media...
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          Exchanging ICE candidates and establishing low-latency encrypted camera and microphone feeds.
                        </p>
                      </div>
                    </>
                  ) : callState === 'reconnecting' ? (
                    /* State 3: Reconnecting */
                    <>
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center text-amber-400 shadow-lg">
                          <RefreshCw size={32} className="text-amber-400 animate-spin" />
                        </div>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-[10px] text-amber-300 mb-2">
                          <span>Network Reconnecting</span>
                        </div>
                        <h3 className="text-white text-base font-semibold">
                          Connection Interrupted
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          Media stream temporarily interrupted. Attempting automatic ICE restart.
                        </p>
                      </div>
                      <div className="pt-1">
                        <button
                          onClick={reconnectPeer}
                          className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw size={13} />
                          Reconnect Now
                        </button>
                      </div>
                    </>
                  ) : callState === 'disconnected' ? (
                    /* State 4: Disconnected */
                    <>
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-rose-400 shadow-lg">
                          <AlertCircle size={32} />
                        </div>
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-600/20 border border-rose-500/30 text-[10px] text-rose-300 mb-2">
                          <span>Participant Disconnected</span>
                        </div>
                        <h3 className="text-white text-base font-semibold">
                          Remote Participant Left the Call
                        </h3>
                        <p className="text-slate-400 text-xs mt-1 leading-relaxed">
                          The other participant has disconnected. Waiting for them to rejoin or click below to share the room link.
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                        <button
                          onClick={copyCandidateLink}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <Copy size={13} />
                          Copy Invite Link
                        </button>
                        <button
                          onClick={reconnectPeer}
                          className="px-3.5 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                        >
                          <RefreshCw size={13} />
                          Check Connection
                        </button>
                      </div>
                    </>
                  ) : (
                    /* State 5: Waiting for 2nd participant */
                    <>
                      <div className="relative">
                        <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                          {remoteParticipant?.name?.slice(0, 2).toUpperCase() || (role === 'interviewer' ? 'CD' : 'IN')}
                        </div>
                        <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-amber-400 border-2 border-slate-900 animate-pulse" />
                      </div>
                      <div>
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[10px] text-slate-300 mb-2">
                          <Shield size={12} className="text-accent-400" />
                          <span>Encrypted WebRTC P2P Room</span>
                        </div>
                        <h3 className="text-white text-base font-semibold">
                          {role === 'interviewer'
                            ? 'Waiting for Candidate to Join'
                            : 'Waiting for Interviewer to Connect...'}
                        </h3>
                        <p className="text-slate-400 text-xs mt-1.5 leading-relaxed">
                          {role === 'interviewer'
                            ? 'Share the candidate invitation link or open a second browser window to test the 2-way live camera feed.'
                            : 'Your camera is live in the preview. Waiting for the interviewer to join or admit you to the room.'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-1 flex-wrap justify-center">
                        <button
                          onClick={copyCandidateLink}
                          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                          title="Copy invite link to clipboard"
                        >
                          <Copy size={13} />
                          Copy Invite Link
                        </button>
                        {role === 'interviewer' && !remoteParticipant && (
                          <button
                            onClick={openCandidateTab}
                            className="px-4 py-2 bg-accent-600 hover:bg-accent-700 text-white rounded-lg text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-colors"
                          >
                            <ExternalLink size={13} />
                            Open Candidate Test Tab
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-500">
                        Room: <span className="font-mono text-slate-400">{roomCode}</span> • No simulated peer. Real video streams when connected.
                      </p>
                    </>
                  )}
                </div>
              )}

              {/* Remote Participant Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <div className="px-3 py-1 rounded-md bg-black/60 backdrop-blur-xs text-white text-xs font-medium flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>
                    {remoteParticipant?.name ||
                      (role === 'interviewer'
                        ? session?.candidateName || 'Candidate'
                        : session?.interviewerName || 'Lead Interviewer')}
                  </span>
                  <span className="text-[10px] text-slate-300">
                    ({role === 'interviewer' ? 'Candidate' : 'Interviewer'})
                  </span>
                </div>
                {remoteParticipant?.isMuted && (
                  <div className="p-1.5 rounded-md bg-rose-600/90 text-white" title="Microphone muted">
                    <MicOff size={14} />
                  </div>
                )}
              </div>

              {/* Network Connection Quality Badge */}
              <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-black/50 backdrop-blur-xs text-[11px] text-slate-300 flex items-center gap-1.5">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    connectionQuality === 'good'
                      ? 'bg-emerald-400'
                      : connectionQuality === 'fair'
                      ? 'bg-amber-400'
                      : 'bg-rose-400'
                  }`}
                />
                <span className="capitalize">{connectionQuality} Connection</span>
              </div>

              {/* ─── Self Video Picture-in-Picture (PiP) ────────────────── */}
              <div className="absolute bottom-4 right-4 w-44 sm:w-56 aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 z-10">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  onLoadedMetadata={(e) => {
                    (e.target as HTMLVideoElement).play().catch(() => {});
                  }}
                  className={`w-full h-full object-cover -scale-x-100 ${!isCameraOn ? 'hidden' : ''}`}
                />
                {!isCameraOn && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-800">
                    <VideoOff size={20} />
                    <span className="text-[10px] mt-1">Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-1.5 left-2 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-medium flex items-center gap-1">
                  <span>{userName} (You)</span>
                  {isMicMuted && <MicOff size={10} className="text-rose-400" />}
                </div>
              </div>
            </div>

            {/* ─── Bottom Call Controls Dock (Google Meet / Enterprise style) ─── */}
            <div className="h-16 flex items-center justify-between px-4 mt-3 bg-white rounded-2xl border border-slate-200 shadow-sm shrink-0">
              {/* Left: Current Meeting Status */}
              <div className="flex items-center gap-3">
                <div className="text-xs font-semibold text-slate-900 hidden sm:block">
                  {session?.role || 'Technical Interview'}
                </div>
                <span className="text-slate-300 hidden sm:block">|</span>
                <span className="text-xs text-slate-500 font-mono">
                  {formatTimer(elapsedSeconds)}
                </span>
              </div>

              {/* Center: Main Media Action Buttons */}
              <div className="flex items-center gap-2 sm:gap-3">
                {/* Microphone Toggle */}
                <button
                  onClick={toggleMic}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isMicMuted
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={isMicMuted ? 'Unmute (Ctrl+D)' : 'Mute (Ctrl+D)'}
                >
                  {isMicMuted ? <MicOff size={18} /> : <Mic size={18} />}
                </button>

                {/* Camera Toggle */}
                <button
                  onClick={toggleCamera}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    !isCameraOn
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={isCameraOn ? 'Turn off camera (Ctrl+E)' : 'Turn on camera (Ctrl+E)'}
                >
                  {isCameraOn ? <Video size={18} /> : <VideoOff size={18} />}
                </button>

                {/* Screen Share */}
                <button
                  onClick={toggleScreenShare}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isScreenSharing
                      ? 'bg-[#202020] text-white shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                  title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
                >
                  <ScreenShare size={18} />
                </button>

                {/* Device Settings Modal */}
                <button
                  onClick={() => setShowDeviceSettings(true)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-all"
                  title="Audio & Video Settings"
                >
                  <Settings size={18} />
                </button>

                {/* Leave / End Call Button */}
                <button
                  onClick={() => setShowEndCallModal(true)}
                  className="px-4 h-10 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs flex items-center gap-2 shadow-xs transition-colors"
                >
                  <PhoneOff size={16} />
                  <span>{role === 'interviewer' ? 'End Interview' : 'Leave Call'}</span>
                </button>
              </div>

              {/* Right: Toggle Sidebar Panels */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    setActiveTab('questions');
                    setIsSidebarOpen(true);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isSidebarOpen && activeTab === 'questions'
                      ? 'bg-[#202020] text-white border border-[#202020]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Interview Questions"
                >
                  <FileText size={17} />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('coding');
                    setIsSidebarOpen(true);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-medium transition-colors ${
                    isSidebarOpen && activeTab === 'coding'
                      ? 'bg-[#202020] text-white border border-[#202020]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="Shared Coding Workspace"
                >
                  <Code2 size={17} />
                </button>

                <button
                  onClick={() => {
                    setActiveTab('chat');
                    setIsSidebarOpen(true);
                  }}
                  className={`p-2.5 rounded-xl text-xs font-medium transition-colors relative ${
                    isSidebarOpen && activeTab === 'chat'
                      ? 'bg-[#202020] text-white border border-[#202020]'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                  title="In-Call Chat"
                >
                  <MessageSquare size={17} />
                  {chatMessages.length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#202020]" />
                  )}
                </button>

                <button
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                  className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs"
                >
                  {isSidebarOpen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
                </button>
              </div>
            </div>
          </div>

          {/* ─── Collapsible Enterprise Side Panel ───────────────────────── */}
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.aside
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 380, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 z-10"
              >
                {/* Panel Header Tabs */}
                <div className="h-12 border-b border-slate-200 px-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveTab('questions')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === 'questions'
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Questions
                    </button>
                    <button
                      onClick={() => setActiveTab('coding')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === 'coding'
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Live Code
                    </button>
                    <button
                      onClick={() => setActiveTab('chat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        activeTab === 'chat'
                          ? 'bg-slate-100 text-slate-900'
                          : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Chat ({chatMessages.length})
                    </button>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-1 rounded text-slate-400 hover:text-slate-600"
                  >
                    <Minimize2 size={15} />
                  </button>
                </div>

                {/* ─── TAB 1: Questions & Interviewer Rubric ─────────────── */}
                {activeTab === 'questions' && (
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {/* Stage Selector for Interviewer */}
                    {role === 'interviewer' && (
                      <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                        <label className="text-[11px] font-semibold text-slate-600 block">
                          Current Interview Stage:
                        </label>
                        <select
                          value={currentStage}
                          onChange={(e) => handleStageChange(e.target.value as InterviewStage)}
                          className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-[#202020]"
                        >
                          {INTERVIEW_STAGES.map((stg) => (
                            <option key={stg.id} value={stg.id}>
                              {stg.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    {/* Active Question Card */}
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#F5F1E8] text-[#202020] border border-surface-200 uppercase tracking-wider">
                          Question {currentQuestionIdx + 1} of {questionList.length}
                        </span>
                        <span className="text-[11px] font-medium text-slate-500">
                          {currentQuestion?.topic || 'Core Engineering'}
                        </span>
                      </div>

                      <h3 className="text-sm font-semibold text-slate-900 leading-snug">
                        {currentQuestion?.text || 'Explain the key principles of scalable web applications.'}
                      </h3>

                      {currentQuestion?.expectedPoints && (
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-[11px] space-y-1.5">
                          <p className="font-semibold text-slate-700">Expected Evaluation Anchors:</p>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            {currentQuestion.expectedPoints.slice(0, 3).map((pt, idx) => (
                              <li key={idx}>{pt}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Question Navigation Controls (Host Controls Sync) */}
                      {role === 'interviewer' ? (
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                          <button
                            onClick={handlePrevQuestion}
                            disabled={currentQuestionIdx === 0}
                            className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
                          >
                            <ChevronLeft size={14} /> Previous
                          </button>
                          <span className="text-xs text-slate-500 font-medium">
                            {currentQuestionIdx + 1} / {questionList.length}
                          </span>
                          <button
                            onClick={handleNextQuestion}
                            disabled={currentQuestionIdx >= questionList.length - 1}
                            className="px-3 py-1.5 rounded-lg bg-[#202020] hover:bg-accent-700 text-white text-xs font-semibold disabled:opacity-40 flex items-center gap-1"
                          >
                            Next Question <ChevronRight size={14} />
                          </button>
                        </div>
                      ) : (
                        <p className="text-[11px] text-slate-400 text-center pt-1 italic">
                          Questions are synchronized in real time by your interviewer.
                        </p>
                      )}
                    </div>

                    {/* Interviewer Private Scoring & Notes (Confidential) */}
                    {role === 'interviewer' ? (
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                            <Shield size={14} className="text-[#8A806F]" />
                            Private Interviewer Notes (Internal)
                          </h4>
                          <span className="text-[10px] text-slate-400">Not shared with candidate</span>
                        </div>

                        {/* Quick 1-5 Star Question Rating */}
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 font-medium">Answer Rating:</span>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                onClick={() => setTechnicalRating(star)}
                                className={`p-1 rounded ${
                                  star <= technicalRating ? 'text-amber-500' : 'text-slate-300'
                                }`}
                              >
                                <Star size={16} fill={star <= technicalRating ? 'currentColor' : 'none'} />
                              </button>
                            ))}
                          </div>
                        </div>

                        <textarea
                          value={interviewerNotes}
                          onChange={(e) => setInterviewerNotes(e.target.value)}
                          placeholder="Record live candidate observations, technical accuracy, code hygiene, and trade-off insights..."
                          rows={4}
                          className="w-full text-xs p-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#202020]"
                        />
                      </div>
                    ) : (
                      /* Candidate Scratchpad */
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 space-y-2">
                        <h4 className="text-xs font-bold text-slate-800">
                          Candidate Personal Notes (Private)
                        </h4>
                        <textarea
                          value={candidateNotes}
                          onChange={(e) => setCandidateNotes(e.target.value)}
                          placeholder="Jot down quick thoughts, algorithm pseudo-code, or questions you want to ask the interviewer..."
                          rows={6}
                          className="w-full text-xs p-2.5 rounded-lg bg-white border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#202020]"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* ─── TAB 2: Live Shared Coding Workspace ────────────────── */}
                {activeTab === 'coding' && (
                  <div className="flex-1 flex flex-col p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-800">Live Code Editor</span>
                      <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Synchronized
                      </span>
                    </div>
                    <textarea
                      value={codeContent}
                      onChange={(e) => handleCodeChange(e.target.value)}
                      rows={18}
                      className="flex-1 font-mono text-xs p-3 rounded-xl bg-slate-900 text-emerald-400 border border-slate-800 focus:outline-hidden resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400">
                      Code is shared and updated in real time between interviewer and candidate.
                    </p>
                  </div>
                )}

                {/* ─── TAB 3: In-Call Chat ────────────────────────────────── */}
                {activeTab === 'chat' && (
                  <div className="flex-1 flex flex-col overflow-hidden">
                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                      {chatMessages.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center text-slate-400 p-4">
                          <MessageSquare size={24} className="mb-1" />
                          <p className="text-xs">No chat messages yet.</p>
                          <p className="text-[11px] text-slate-400">
                            Send notes, code links, or clarifications here.
                          </p>
                        </div>
                      ) : (
                        chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex flex-col ${
                              msg.senderName === userName ? 'items-end' : 'items-start'
                            }`}
                          >
                            <span className="text-[10px] text-slate-400 mb-0.5">
                              {msg.senderName} ({msg.senderRole}) • {msg.timestamp}
                            </span>
                            <div
                              className={`px-3 py-2 rounded-xl text-xs max-w-[85%] ${
                                msg.senderName === userName
                                  ? 'bg-[#202020] text-white rounded-br-none'
                                  : 'bg-slate-100 text-slate-900 rounded-bl-none'
                              }`}
                            >
                              {msg.text}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Chat Form */}
                    <form onSubmit={handleSendChat} className="p-3 border-t border-slate-200 flex gap-2">
                      <input
                        type="text"
                        value={chatInputText}
                        onChange={(e) => setChatInputText(e.target.value)}
                        placeholder="Type a message to participants..."
                        className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-1 focus:ring-[#202020]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#202020] hover:bg-accent-700 text-white rounded-lg text-xs font-semibold"
                      >
                        <Send size={14} />
                      </button>
                    </form>
                  </div>
                )}
              </motion.aside>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* ─── Device Settings Modal ─────────────────────────────────────── */}
      <Modal
        isOpen={showDeviceSettings}
        onClose={() => setShowDeviceSettings(false)}
        title="Audio & Video Settings"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Camera Input:
            </label>
            <select
              value={selectedVideoDeviceId}
              onChange={(e) => switchCamera(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              {videoInputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Microphone Input:
            </label>
            <select
              value={selectedAudioDeviceId}
              onChange={(e) => switchMicrophone(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 bg-white text-slate-800"
            >
              {audioInputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Speaker / Output Volume:
            </label>
            <div className="flex items-center gap-3 p-2 bg-slate-50 rounded-lg border border-slate-200">
              <Volume2 size={16} className="text-slate-500 shrink-0" />
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={speakerVolume}
                onChange={(e) => {
                  const vol = parseFloat(e.target.value);
                  setSpeakerVolume(vol);
                  if (remoteVideoRef.current) remoteVideoRef.current.volume = vol;
                }}
                className="flex-1 accent-[#202020] cursor-pointer"
              />
              <span className="text-xs font-mono font-semibold text-slate-700 w-9 text-right">
                {Math.round(speakerVolume * 100)}%
              </span>
              <button
                type="button"
                onClick={testSpeakerChime}
                className="px-2.5 py-1 rounded-md bg-white border border-slate-300 hover:bg-slate-100 text-[11px] font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                Test Sound
              </button>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <Button variant="primary" size="sm" onClick={() => setShowDeviceSettings(false)}>
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── End Call Confirmation Modal ───────────────────────────────── */}
      <Modal
        isOpen={showEndCallModal}
        onClose={() => setShowEndCallModal(false)}
        title={role === 'interviewer' ? 'Conclude Interview?' : 'Leave Interview Room?'}
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            {role === 'interviewer'
              ? 'Conclude this interview session for all participants and proceed to the post-interview evaluation rubric?'
              : 'Are you sure you want to exit this live interview room? You can rejoin if the meeting is still active.'}
          </p>
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="secondary" size="sm" onClick={() => setShowEndCallModal(false)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                setShowEndCallModal(false);
                if (role === 'interviewer') {
                  endCallForEveryone();
                  setShowEvaluationModal(true);
                } else {
                  leaveCall();
                  navigate(`/interview/feedback/${roomCode}`);
                }
              }}
            >
              {role === 'interviewer' ? 'Conclude & Evaluate' : 'Leave Call'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* ─── Post-Interview Evaluation & Feedback Modal (Interviewer) ──── */}
      <Modal
        isOpen={showEvaluationModal}
        onClose={() => setShowEvaluationModal(false)}
        title="Candidate Assessment & Evaluation"
        size="lg"
      >
        <div className="space-y-5">
          <div className="bg-[#F5F1E8] p-3 rounded-xl border border-surface-200 flex items-center justify-between text-xs">
            <div>
              <p className="font-semibold text-[#202020]">
                Candidate: {session?.candidateName || 'Alex Johnson'}
              </p>
              <p className="text-surface-600">Role: {session?.role || 'Frontend Developer'}</p>
            </div>
            <span className="text-[11px] text-[#8A806F] font-mono">
              Session Duration: {formatTimer(elapsedSeconds)}
            </span>
          </div>

          {/* Scoring Rubric */}
          <div className="grid sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Technical Knowledge
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setTechnicalRating(s)}
                    className={`p-1 ${s <= technicalRating ? 'text-amber-500' : 'text-slate-300'}`}
                  >
                    <Star size={18} fill={s <= technicalRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Problem Solving
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setProblemSolvingRating(s)}
                    className={`p-1 ${s <= problemSolvingRating ? 'text-amber-500' : 'text-slate-300'}`}
                  >
                    <Star size={18} fill={s <= problemSolvingRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Communication
              </label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <button
                    key={s}
                    onClick={() => setCommunicationRating(s)}
                    className={`p-1 ${s <= communicationRating ? 'text-amber-500' : 'text-slate-300'}`}
                  >
                    <Star size={18} fill={s <= communicationRating ? 'currentColor' : 'none'} />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Hiring Recommendation */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Final Hiring Recommendation:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'strong-hire', label: 'Strong Hire', color: 'bg-emerald-50 text-emerald-700 border-emerald-300' },
                { id: 'hire', label: 'Hire', color: 'bg-[#F5F1E8] text-[#202020] border-[#DDD9D0]' },
                { id: 'weak-hire', label: 'Weak Hire', color: 'bg-amber-50 text-amber-700 border-amber-300' },
                { id: 'no-hire', label: 'No Hire', color: 'bg-rose-50 text-rose-700 border-rose-300' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setInterviewerRecommendation(opt.id as any)}
                  className={`p-2 rounded-xl text-xs font-semibold border text-center transition-all ${
                    interviewerRecommendation === opt.id
                      ? `${opt.color} ring-2 ring-[#202020]`
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Public Feedback (Shared with candidate) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Feedback to Share with Candidate:
            </label>
            <textarea
              value={publicCandidateFeedback}
              onChange={(e) => setPublicCandidateFeedback(e.target.value)}
              placeholder="Constructive feedback, technical strengths, and growth areas shared directly with candidate..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#202020]"
            />
          </div>

          {/* Confidential Notes (Internal Only) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Confidential Internal Notes (Hiring Team Only):
            </label>
            <textarea
              value={interviewerNotes}
              onChange={(e) => setInterviewerNotes(e.target.value)}
              placeholder="Internal considerations, leveling recommendation, team match preferences..."
              rows={3}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-300 text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#202020]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
            <Button variant="secondary" size="sm" onClick={() => setShowEvaluationModal(false)}>
              Save Draft
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmitEvaluation}>
              Submit Evaluation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
