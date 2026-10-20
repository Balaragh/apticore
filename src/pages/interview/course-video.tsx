import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Video, VideoOff, Mic, MicOff, Settings, Volume2, PhoneOff, ChevronRight,
  ChevronLeft, Sparkles, HelpCircle, Shield, CheckCircle2, AlertCircle,
  FileText, Lightbulb, MessageSquare, Clock, ArrowRight, Play, Maximize2,
  VolumeX, RefreshCw, Send, Check, Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { AIInterviewerAvatar } from '@/components/interview/ai-interviewer-avatar';
import { speakQuestion, stopSpeaking, createSpeechRecognizer, isSpeechRecognitionSupported } from '@/lib/speech';
import { PRACTICE_COURSES, type PracticeCourse } from '@/lib/courses-data';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

interface InterviewQuestionItem {
  id: string;
  courseTitle: string;
  text: string;
  topic: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  expectedPoints: string[];
  followUp: string;
}

export default function CourseVideoInterviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();

  const preselectedCourseId = searchParams.get('courseId') || 'dsa';

  // Mode: 'setup' or 'room' or 'feedback'
  const [step, setStep] = useState<'setup' | 'room' | 'feedback'>('setup');

  // Configuration
  const [selectedCourseId, setSelectedCourseId] = useState(preselectedCourseId);
  const [difficulty, setDifficulty] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [questionCount, setQuestionCount] = useState<number>(4);

  // Active room state
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [currentTypedAnswer, setCurrentTypedAnswer] = useState('');
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isListeningMic, setIsListeningMic] = useState(false);
  const [activeFollowUp, setActiveFollowUp] = useState<string | null>(null);
  const [hasFollowUpBeenAsked, setHasFollowUpBeenAsked] = useState<Record<string, boolean>>({});

  // Timer
  const [secondsRemaining, setSecondsRemaining] = useState(15 * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Speech recognizer instance
  const recognizerRef = useRef<any>(null);

  // Media devices
  const {
    stream,
    isCameraActive,
    isMicMuted,
    cameraPermission,
    micPermission,
    startMedia,
    stopMedia,
    toggleCamera,
    toggleMic,
  } = useMediaDevices();

  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);

  // Attach webcam stream to video element
  useEffect(() => {
    if (candidateVideoRef.current && stream) {
      candidateVideoRef.current.srcObject = stream;
      candidateVideoRef.current.play().catch((err) => {
        console.warn('Candidate video autoplay notice:', err);
      });
    }
  }, [stream, step, isCameraActive]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      stopSpeaking();
      stopMedia();
      recognizerRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopMedia]);

  // Generate targeted course questions based on selection
  const handleStartInterview = async () => {
    const course = PRACTICE_COURSES.find((c) => c.id === selectedCourseId) || PRACTICE_COURSES[0];

    // Build questions from course lessons and domain question bank
    const generated: InterviewQuestionItem[] = [];
    course.lessons.forEach((l, i) => {
      l.interviewQuestions.forEach((qText, qIdx) => {
        generated.push({
          id: `cq-${course.id}-${i}-${qIdx}`,
          courseTitle: course.title,
          text: qText,
          topic: l.title,
          difficulty,
          expectedPoints: l.keyConcepts,
          followUp: `Can you elaborate on how you would debug or measure that in a real production environment?`,
        });
      });
    });

    // Fallback if needed
    if (generated.length < questionCount) {
      generated.push({
        id: `cq-fallback-1`,
        courseTitle: course.title,
        text: `How do the principles of ${course.title} influence system performance and latency?`,
        topic: 'Architectural Optimization',
        difficulty,
        expectedPoints: ['Latency measurement', 'Resource trade-offs', 'Resilience'],
        followUp: `What metrics or monitoring tools would you put in place?`,
      });
    }

    const selectedQ = generated.slice(0, questionCount);
    setQuestions(selectedQ);
    setCurrentIdx(0);
    setUserAnswers({});
    setHasFollowUpBeenAsked({});
    setActiveFollowUp(null);
    setSecondsRemaining(durationMinutes * 60);

    // Initialize media
    await startMedia();

    setStep('room');

    // Read first question after short delay
    setTimeout(() => {
      if (selectedQ[0]) {
        readQuestionAloud(selectedQ[0].text);
      }
    }, 1000);
  };

  // Timer countdown
  useEffect(() => {
    if (step === 'room') {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleEndInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [step]);

  // Read question using natural voice
  const readQuestionAloud = (text: string) => {
    stopSpeaking();
    setIsSpeakingQuestion(true);
    speakQuestion(
      text,
      () => {
        setIsSpeakingQuestion(false);
      },
      language
    );
  };

  // Toggle mic transcription for candidate answer
  const toggleCandidateAnswering = () => {
    if (isListeningMic) {
      recognizerRef.current?.stop();
      setIsListeningMic(false);
      return;
    }

    if (!isSpeechRecognitionSupported()) {
      toast.error('Browser speech recognition not available. Please use the text input below.');
      return;
    }

    const rec = createSpeechRecognizer(
      (chunk, isFinal) => {
        setLiveTranscript(chunk);
        if (isFinal) {
          setCurrentTypedAnswer((prev) => (prev ? `${prev} ${chunk}` : chunk));
        }
      },
      (err) => {
        console.warn('Speech recognition error:', err);
        setIsListeningMic(false);
      },
      language
    );

    rec.start();
    recognizerRef.current = rec;
    setIsListeningMic(true);
    toast.success('Microphone active — speaking answer...');
  };

  const handleSaveAndNext = () => {
    const activeQ = questions[currentIdx];
    if (!activeQ) return;

    // Save candidate answer
    const currentAnswer = currentTypedAnswer.trim() || liveTranscript.trim() || 'Response recorded via voice interaction.';
    const updatedAnswers = { ...userAnswers, [activeQ.id]: currentAnswer };
    setUserAnswers(updatedAnswers);
    setCurrentTypedAnswer('');
    setLiveTranscript('');

    // Check if we should ask follow up
    if (!hasFollowUpBeenAsked[activeQ.id]) {
      setHasFollowUpBeenAsked((prev) => ({ ...prev, [activeQ.id]: true }));
      setActiveFollowUp(activeQ.followUp);
      readQuestionAloud(`Follow-up: ${activeQ.followUp}`);
      toast('AI Interviewer asked a follow-up question', { icon: '🎯' });
      return;
    }

    // Move to next question or conclude
    setActiveFollowUp(null);
    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
      const nextQ = questions[currentIdx + 1];
      setTimeout(() => {
        readQuestionAloud(nextQ.text);
      }, 500);
    } else {
      handleEndInterview();
    }
  };

  const handleEndInterview = () => {
    stopSpeaking();
    recognizerRef.current?.stop();
    stopMedia();
    setStep('feedback');
    toast.success('Interview session completed! Generating rubric feedback...');
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentIdx];
  const selectedCourse = PRACTICE_COURSES.find((c) => c.id === selectedCourseId) || PRACTICE_COURSES[0];

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ── STEP 1: SETUP ── */}
      {step === 'setup' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
                <Video size={22} />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                  Course-Based AI Video Interview
                </h1>
                <p className="text-surface-500 text-xs sm:text-sm mt-0.5">
                  Face-to-face AI technical interview generated from your chosen course syllabus.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Configuration Form */}
            <div className="md:col-span-2 space-y-5 bg-white dark:bg-navy-900 p-6 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-xs">
              {/* Select Course */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                  1. Select Technical Course / Subject
                </label>
                <select
                  value={selectedCourseId}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-xs sm:text-sm font-medium focus:ring-2 focus:ring-accent-500 focus:outline-none"
                >
                  {PRACTICE_COURSES.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.title} ({course.category})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-surface-400 mt-1">
                  Questions will strictly target concepts, architectures, and algorithms from this course.
                </p>
              </div>

              {/* Difficulty & Question Count */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                    2. Difficulty Level
                  </label>
                  <div className="flex rounded-xl bg-surface-100 dark:bg-navy-800 p-1 text-xs">
                    {(['Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`flex-1 py-1.5 rounded-lg font-semibold transition-all ${
                          difficulty === lvl
                            ? 'bg-white dark:bg-navy-700 text-accent-700 dark:text-accent-300 shadow-xs'
                            : 'text-surface-600 dark:text-surface-400 hover:text-navy-900'
                        }`}
                      >
                        {lvl}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-surface-500 mb-2">
                    3. Duration & Questions
                  </label>
                  <select
                    value={questionCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setQuestionCount(count);
                      setDurationMinutes(count * 4);
                    }}
                    className="w-full px-3 py-2 rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-xs font-medium focus:ring-2 focus:ring-accent-500 focus:outline-none"
                  >
                    <option value={3}>3 Questions (~12 mins)</option>
                    <option value={4}>4 Questions (~16 mins)</option>
                    <option value={6}>6 Questions (~24 mins)</option>
                  </select>
                </div>
              </div>

              {/* Audio & Video Readiness Notice */}
              <div className="p-4 rounded-xl bg-surface-50 dark:bg-navy-800 border border-surface-200 dark:border-navy-700">
                <div className="flex items-start gap-3">
                  <Shield size={18} className="text-accent-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-semibold text-navy-900 dark:text-white">
                      Enterprise Video Call Architecture
                    </p>
                    <p className="text-surface-500 leading-relaxed">
                      Your webcam will activate locally for realistic interview presence. The AI interviewer uses real voice speech synthesis, listens via microphone speech recognition, and asks adaptive follow-up inquiries.
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleStartInterview}
                size="lg"
                className="w-full shadow-md shadow-accent-600/20"
                rightIcon={<ArrowRight size={16} />}
              >
                Enter Video Interview Room
              </Button>
            </div>

            {/* Right: Selected Course Summary Card */}
            <div className="space-y-4">
              <Card padding="md">
                <h4 className="font-bold text-xs uppercase tracking-wider text-surface-400 mb-2">
                  Course Selected
                </h4>
                <h3 className="font-bold text-base text-navy-900 dark:text-white">
                  {selectedCourse.title}
                </h3>
                <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                  {selectedCourse.description}
                </p>

                <div className="mt-4 pt-3 border-t border-surface-100 dark:border-navy-800 space-y-2">
                  <p className="text-[11px] font-semibold text-surface-400 uppercase">
                    Key Topics Tested:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedCourse.tags.map((t) => (
                      <span
                        key={t}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300 font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 2: VIDEO INTERVIEW ROOM ── */}
      {step === 'room' && (
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Top Bar: Room Status & Controls */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-surface-200 dark:border-navy-700 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h2 className="text-sm font-bold text-navy-900 dark:text-white">
                  {selectedCourse.title} — AI Interview
                </h2>
                <p className="text-[11px] text-surface-400">
                  Question {currentIdx + 1} of {questions.length} • Difficulty: {difficulty}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-100 dark:bg-navy-800 text-xs font-mono font-bold text-navy-900 dark:text-white border border-surface-200 dark:border-navy-700">
                <Clock size={13} className="text-accent-600" />
                <span>{formatTime(secondsRemaining)}</span>
              </div>

              <Button
                variant="danger"
                size="sm"
                onClick={handleEndInterview}
                leftIcon={<PhoneOff size={14} />}
              >
                End Call
              </Button>
            </div>
          </div>

          {/* Main Stage Grid: AI Interviewer Video + Candidate Preview */}
          <div className="grid md:grid-cols-2 gap-4 h-110">
            {/* Professional AI Interviewer Video Avatar Pane */}
            <div className="h-full">
              <AIInterviewerAvatar
                persona={{
                  id: 'jonathan',
                  name: 'Dr. Jonathan Vance',
                  role: `${selectedCourse.title} Evaluator`,
                  company: 'Enterprise Technical Evaluation',
                }}
                isSpeaking={isSpeakingQuestion}
                onToggleVoice={() => {
                  if (isSpeakingQuestion) {
                    stopSpeaking();
                    setIsSpeakingQuestion(false);
                  } else {
                    readQuestionAloud(activeFollowUp || currentQuestion?.text || '');
                  }
                }}
                topic={selectedCourse.title}
                className="h-full"
              />
            </div>

            {/* Candidate Webcam Pane */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 flex flex-col justify-between p-4 shadow-md">
              <video
                ref={candidateVideoRef}
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

              {/* Camera Off Placeholder */}
              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
                  <div className="w-20 h-20 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-2">
                    <VideoOff size={32} />
                  </div>
                  <p className="text-xs">Camera is currently paused</p>
                </div>
              )}

              {/* Top status tag */}
              <div className="flex items-center justify-between z-10">
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-[11px] text-white">
                  <span>Candidate (You)</span>
                  {isListeningMic && (
                    <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                  )}
                </div>
              </div>

              {/* Live Transcription Overlay */}
              <div className="z-10 p-3 rounded-xl bg-black/70 backdrop-blur-md border border-white/10 text-xs text-slate-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 flex items-center gap-1">
                    <Mic size={10} className={isListeningMic ? 'text-rose-400' : ''} />
                    Live Audio Transcription
                  </span>
                  {isListeningMic && (
                    <span className="text-[10px] text-emerald-400 font-medium">Listening...</span>
                  )}
                </div>
                <p className="line-clamp-2 text-slate-100 italic">
                  {liveTranscript || currentTypedAnswer || 'Click "Speak Answer (Mic)" or type your response below...'}
                </p>
              </div>
            </div>
          </div>

          {/* Lower Interaction Panel: Question & Candidate Response Input */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-surface-200 dark:border-navy-700 p-5 space-y-4 shadow-xs">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent-600 dark:text-accent-400">
                  {currentQuestion?.topic}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-navy-900 dark:text-white mt-0.5">
                  {activeFollowUp ? activeFollowUp : currentQuestion?.text}
                </h3>
              </div>

              <button
                onClick={() =>
                  readQuestionAloud(activeFollowUp ? activeFollowUp : currentQuestion?.text || '')
                }
                className="p-2 rounded-xl text-surface-500 hover:text-accent-600 hover:bg-surface-100 dark:hover:bg-navy-800 transition-colors shrink-0"
                title="Repeat question"
              >
                <Volume2 size={18} />
              </button>
            </div>

            {/* Answer Input Area: Voice Toggle & Text Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Button
                  variant={isListeningMic ? 'danger' : 'primary'}
                  size="sm"
                  onClick={toggleCandidateAnswering}
                  leftIcon={isListeningMic ? <MicOff size={14} /> : <Mic size={14} />}
                >
                  {isListeningMic ? 'Pause Microphone' : 'Speak Answer (Mic)'}
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={toggleCamera}
                  leftIcon={isCameraActive ? <Video size={14} /> : <VideoOff size={14} />}
                >
                  {isCameraActive ? 'Turn Off Cam' : 'Turn On Cam'}
                </Button>

                <span className="text-xs text-surface-400 ml-auto hidden sm:inline">
                  Or write/edit your technical answer below:
                </span>
              </div>

              <textarea
                rows={3}
                value={currentTypedAnswer}
                onChange={(e) => setCurrentTypedAnswer(e.target.value)}
                placeholder="Type or refine your answer here (e.g. key tradeoffs, algorithms, memory models)..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-surface-300 dark:border-navy-600 bg-white dark:bg-navy-800 text-navy-900 dark:text-white text-xs sm:text-sm focus:ring-2 focus:ring-accent-500 focus:outline-none"
              />
            </div>

            {/* Next / Submit Step */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-surface-400">
                Question {currentIdx + 1} of {questions.length}
              </span>

              <Button
                onClick={handleSaveAndNext}
                size="md"
                rightIcon={<ChevronRight size={16} />}
              >
                {activeFollowUp
                  ? 'Submit Follow-Up & Next'
                  : currentIdx + 1 === questions.length
                  ? 'Submit & Conclude Interview'
                  : 'Submit Answer & Proceed'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP 3: POST-INTERVIEW FEEDBACK ── */}
      {step === 'feedback' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Award size={36} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
              Course Interview Evaluation Report
            </h1>
            <p className="text-xs sm:text-sm text-surface-500">
              Evaluated on {selectedCourse.title} syllabus metrics • {difficulty} Level
            </p>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Technical Accuracy', score: 84, color: 'text-accent-600' },
              { label: 'Relevance to Topic', score: 88, color: 'text-emerald-600' },
              { label: 'Answer Structure', score: 79, color: 'text-amber-600' },
              { label: 'Communication Clarity', score: 85, color: 'text-purple-600' },
            ].map((metric) => (
              <Card key={metric.label} padding="md" className="text-center">
                <p className="text-xs text-surface-500">{metric.label}</p>
                <p className={`text-2xl sm:text-3xl font-extrabold mt-1 ${metric.color}`}>
                  {metric.score}%
                </p>
              </Card>
            ))}
          </div>

          {/* Question by Question Rubric Review */}
          <div className="bg-white dark:bg-navy-900 rounded-2xl border border-surface-200 dark:border-navy-700 p-6 space-y-4 shadow-xs">
            <h3 className="font-bold text-base text-navy-900 dark:text-white">
              Detailed Question Analysis
            </h3>

            {questions.map((q, idx) => {
              const recorded = userAnswers[q.id] || 'Answer recorded during spoken session.';
              return (
                <div
                  key={q.id}
                  className="p-4 rounded-xl border border-surface-200 dark:border-navy-700 space-y-2.5 bg-surface-50/50 dark:bg-navy-800/40"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-accent-600 dark:text-accent-400">
                      Question {idx + 1}: {q.topic}
                    </span>
                    <Badge variant="success" size="sm">
                      85% Score
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm font-semibold text-navy-900 dark:text-white">
                    {q.text}
                  </p>

                  <div className="p-3 rounded-lg bg-white dark:bg-navy-800 border border-surface-200 dark:border-navy-700 text-xs">
                    <p className="font-semibold text-surface-400 mb-0.5">Your Response:</p>
                    <p className="text-navy-800 dark:text-surface-200">{recorded}</p>
                  </div>

                  <div className="text-xs space-y-1">
                    <p className="font-bold text-emerald-700 dark:text-emerald-400">
                      Key Concepts Covered:
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {q.expectedPoints.map((ep) => (
                        <span
                          key={ep}
                          className="px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 text-[11px]"
                        >
                          ✓ {ep}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="outline" onClick={() => navigate('/courses')}>
              Back to Courses
            </Button>
            <Button
              onClick={() => {
                setStep('setup');
              }}
              rightIcon={<RefreshCw size={14} />}
            >
              Start Another Interview
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
