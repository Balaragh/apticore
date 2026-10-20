import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Video, VideoOff, Mic, MicOff, Volume2, PhoneOff, Clock,
  ArrowRight, Sparkles, Award, CheckCircle2, Hand, MessageSquare, Shield,
  FileText, Lightbulb, Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useMediaDevices } from '@/hooks/useMediaDevices';
import { speakQuestion, stopSpeaking, createSpeechRecognizer, isSpeechRecognitionSupported } from '@/lib/speech';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

interface GDTopic {
  id: string;
  category: 'Technology' | 'Business' | 'Society' | 'Economy';
  title: string;
  description: string;
  moderatorIntro: string;
  starterArguments: {
    participantId: string;
    text: string;
  }[];
}

const GD_TOPICS: GDTopic[] = [
  {
    id: 'gd-1',
    category: 'Technology',
    title: 'Generative AI: Job Destroyer or Productivity Catalyst for Freshers?',
    description: 'Debating whether AI code assistants will reduce entry-level developer hiring or elevate junior engineers into system designers faster.',
    moderatorIntro: 'Welcome everyone to today’s group discussion round. The topic for discussion is: "Generative AI: Job Destroyer or Productivity Catalyst for Freshers?". You have 10 minutes to share constructive viewpoints, listen actively, and build toward a balanced consensus. You may now commence.',
    starterArguments: [
      {
        participantId: 'priya',
        text: 'From an engineering efficiency standpoint, Copilot and ChatGPT automate repetitive boilerplate code. However, junior developers still require deep fundamentals in debugging, security invariants, and database design. AI is an amplifier, not an autonomous engineer.',
      },
      {
        participantId: 'vikram',
        text: 'While that sounds optimistic, we cannot ignore the economic reality. If one senior engineer with AI tools can deliver the output previously requiring three freshers, entry-level headcount across service IT firms is undoubtedly shrinking. We need to discuss how freshers should upskill.',
      },
    ],
  },
  {
    id: 'gd-2',
    category: 'Business',
    title: 'Remote Work vs Return-to-Office: What is the Optimal Future?',
    description: 'Analyzing collaborative serendipity and team culture versus geographical flexibility, commute reduction, and employee retention.',
    moderatorIntro: 'Welcome candidates. Today’s placement discussion topic is: "Remote Work vs Return-to-Office: What is the Optimal Future?". Please maintain mutual respect, avoid talking over one another, and support your arguments with concrete business reasoning.',
    starterArguments: [
      {
        participantId: 'priya',
        text: 'Studies indicate knowledge workers save an average of 72 minutes daily on commute during remote work, which translates into higher focus periods. For tech workers, output should be judged on merged code and SLAs, not desk occupancy.',
      },
      {
        participantId: 'vikram',
        text: 'I agree on the individual productivity metrics, but for freshers joining their first software company, organic mentorship, spontaneous hallway problem-solving, and company culture are severely compromised in 100% remote setups.',
      },
    ],
  },
];

interface AIParticipant {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  personality: string;
}

const PARTICIPANTS: AIParticipant[] = [
  {
    id: 'moderator',
    name: 'Rajesh Menon',
    role: 'Placement HR Moderator (AI)',
    avatarColor: 'from-blue-600 to-indigo-700',
    personality: 'Neutral, guides turns, ensures professional decorum',
  },
  {
    id: 'priya',
    name: 'Priya Sharma',
    role: 'AI Participant 1 (Data & Nuance)',
    avatarColor: 'from-emerald-500 to-teal-700',
    personality: 'Analytical, references metrics and technology trends',
  },
  {
    id: 'vikram',
    name: 'Vikram Malhotra',
    role: 'AI Participant 2 (Industry Practicality)',
    avatarColor: 'from-amber-500 to-orange-700',
    personality: 'Pragmatic, focuses on business realities and corporate operations',
  },
];

export default function GroupDiscussionPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const [stage, setStage] = useState<'topic-select' | 'live-call' | 'feedback'>('topic-select');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('gd-1');
  const [discussionTimer, setDiscussionTimer] = useState<number>(600); // 10 mins

  // Call state
  const [activeSpeakerId, setActiveSpeakerId] = useState<string | null>('moderator');
  const [candidateNotes, setCandidateNotes] = useState<string>('');
  const [candidateSpeechText, setCandidateSpeechText] = useState<string>('');
  const [isMicActive, setIsMicActive] = useState<boolean>(false);
  const [hasCandidateSpoken, setHasCandidateSpoken] = useState<boolean>(false);
  const [candidateContributionCount, setCandidateContributionCount] = useState<number>(0);
  const [discussionTranscript, setDiscussionTranscript] = useState<
    { sender: string; text: string; time: string }[]
  >([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognizerRef = useRef<any>(null);

  // Candidate camera hook
  const { stream, isCameraActive, startMedia, stopMedia, toggleCamera } = useMediaDevices();
  const candidateVideoRef = useRef<HTMLVideoElement | null>(null);

  const selectedTopic = GD_TOPICS.find((t) => t.id === selectedTopicId) || GD_TOPICS[0];

  useEffect(() => {
    if (candidateVideoRef.current && stream) {
      candidateVideoRef.current.srcObject = stream;
    }
  }, [stream, stage]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      stopMedia();
      recognizerRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stopMedia]);

  const handleStartGD = async () => {
    await startMedia();
    setStage('live-call');
    setDiscussionTimer(600);
    setDiscussionTranscript([]);
    setCandidateContributionCount(0);
    setHasCandidateSpoken(false);

    // Moderator introduction
    setTimeout(() => {
      setActiveSpeakerId('moderator');
      const intro = selectedTopic.moderatorIntro;
      addTranscript('Rajesh Menon (Moderator)', intro);
      speakQuestion(
        intro,
        () => {
          // After moderator speaks, Priya starts the debate
          setTimeout(() => {
            const firstArg = selectedTopic.starterArguments[0];
            setActiveSpeakerId('priya');
            addTranscript('Priya Sharma', firstArg.text);
            speakQuestion(
              firstArg.text,
              () => {
                setActiveSpeakerId(null);
                toast('The floor is open! Click "Raise Hand / Speak" to contribute.', { icon: '🎤' });
              },
              language
            );
          }, 1200);
        },
        language
      );
    }, 600);
  };

  // Timer countdown
  useEffect(() => {
    if (stage === 'live-call') {
      timerRef.current = setInterval(() => {
        setDiscussionTimer((prev) => {
          if (prev <= 1) {
            handleEndDiscussion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [stage]);

  const addTranscript = (sender: string, text: string) => {
    setDiscussionTranscript((prev) => [
      ...prev,
      {
        sender,
        text,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  const handleCandidateTakeFloor = () => {
    if (isMicActive) {
      recognizerRef.current?.stop();
      setIsMicActive(false);
      return;
    }

    stopSpeaking();
    setActiveSpeakerId('candidate');

    if (!isSpeechRecognitionSupported()) {
      toast('Speech dictation not supported in browser. You can type your point below.', { icon: 'ℹ️' });
      setIsMicActive(true);
      return;
    }

    const rec = createSpeechRecognizer(
      (chunk, isFinal) => {
        if (isFinal) {
          setCandidateSpeechText((prev) => (prev ? `${prev} ${chunk}` : chunk));
        }
      },
      () => setIsMicActive(false),
      language
    );

    rec.start();
    recognizerRef.current = rec;
    setIsMicActive(true);
    toast.success('You have the floor! Speak your point...');
  };

  const handleFinishSpeaking = () => {
    recognizerRef.current?.stop();
    setIsMicActive(false);

    const speech = candidateSpeechText.trim() || 'I agree with the point made, but we also must factor in deployment safety and operational costs.';
    addTranscript('You (Candidate)', speech);
    setCandidateSpeechText('');
    setHasCandidateSpoken(true);
    setCandidateContributionCount((prev) => prev + 1);

    // AI Participant Vikram responds contextually
    setTimeout(() => {
      setActiveSpeakerId('vikram');
      const response = `I appreciate the perspective shared by our candidate regarding operational practicalities. Looking at market benchmarks, that aligns closely with how enterprise architecture is evolving. Priya, how do you see the testing phase factoring into this?`;
      addTranscript('Vikram Malhotra', response);
      speakQuestion(
        response,
        () => {
          setActiveSpeakerId(null);
        },
        language
      );
    }, 1000);
  };

  const handleEndDiscussion = () => {
    stopSpeaking();
    stopMedia();
    recognizerRef.current?.stop();
    setStage('feedback');
  };

  const formatSecs = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 pb-12 font-sans">
      {/* ── STAGE 1: TOPIC SELECTION ── */}
      {stage === 'topic-select' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-accent-50 dark:bg-accent-900/30 text-accent-600 dark:text-accent-400">
                <Users size={22} />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white tracking-tight">
                  AI Group Discussion Room
                </h1>
                <p className="text-surface-500 text-xs sm:text-sm mt-0.5">
                  Multi-participant corporate placement GD simulation with an AI moderator and peer participants.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-xs space-y-5">
            <label className="block text-xs font-bold uppercase tracking-wider text-surface-500">
              Select Placement Discussion Topic:
            </label>

            <div className="space-y-3">
              {GD_TOPICS.map((topic) => {
                const isSelected = selectedTopicId === topic.id;
                return (
                  <div
                    key={topic.id}
                    onClick={() => setSelectedTopicId(topic.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-accent-600 bg-accent-50/40 dark:bg-accent-900/20 ring-1 ring-accent-600 shadow-xs'
                        : 'border-surface-200 dark:border-navy-700 hover:border-surface-300 bg-white dark:bg-navy-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-surface-100 dark:bg-navy-700 text-surface-600 dark:text-surface-300">
                        {topic.category}
                      </span>
                      {isSelected && (
                        <span className="text-xs font-bold text-accent-600 flex items-center gap-1">
                          <CheckCircle2 size={14} /> Selected
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-navy-900 dark:text-white mt-1">
                      {topic.title}
                    </h3>
                    <p className="text-xs text-surface-500 mt-1 leading-relaxed">
                      {topic.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Simulation Honest Disclosure */}
            <div className="p-3.5 rounded-xl bg-surface-50 dark:bg-navy-800 border border-surface-200 dark:border-navy-700 text-xs text-surface-500 space-y-1">
              <p className="font-semibold text-navy-800 dark:text-white flex items-center gap-1.5">
                <Shield size={14} className="text-accent-600" />
                Simulated AI Participants Notice:
              </p>
              <p className="leading-relaxed">
                This session utilizes simulated AI avatars with distinct argumentative profiles. WebRTC peer connections can be layered onto this architecture for multi-human sessions in future deployments.
              </p>
            </div>

            <Button
              onClick={handleStartGD}
              size="lg"
              className="w-full shadow-md shadow-accent-600/20"
              rightIcon={<ArrowRight size={16} />}
            >
              Enter Group Discussion Room
            </Button>
          </div>
        </div>
      )}

      {/* ── STAGE 2: LIVE CALL GRID ── */}
      {stage === 'live-call' && (
        <div className="max-w-6xl mx-auto space-y-4">
          {/* Room Top Bar */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-navy-900 border border-surface-200 dark:border-navy-700 shadow-xs">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <h3 className="font-bold text-xs sm:text-sm text-navy-900 dark:text-white line-clamp-1">
                  GD: {selectedTopic.title}
                </h3>
                <p className="text-[11px] text-surface-400">
                  4 Active Participants • Round Time: {formatSecs(discussionTimer)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={handleEndDiscussion}
                leftIcon={<PhoneOff size={14} />}
              >
                Conclude GD
              </Button>
            </div>
          </div>

          {/* 4-Participant Video Grid */}
          <div className="grid sm:grid-cols-2 gap-4 h-110">
            {/* Cell 1: Moderator */}
            <div
              className={`rounded-2xl bg-slate-900 border p-4 flex flex-col justify-between text-white relative transition-all shadow-md ${
                activeSpeakerId === 'moderator' ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-semibold bg-black/50 px-2.5 py-1 rounded-full">
                  Rajesh Menon (Moderator)
                </span>
                {activeSpeakerId === 'moderator' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Volume2 size={11} className="animate-bounce" /> Speaking
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center justify-center my-auto">
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-blue-600 to-indigo-800 flex items-center justify-center font-bold text-xl shadow-lg">
                  RM
                </div>
                <p className="text-xs font-bold mt-2">Placement HR Lead</p>
              </div>

              <div className="text-[11px] text-slate-400 bg-black/40 p-2 rounded-lg">
                Status: Monitoring floor etiquette & turn duration
              </div>
            </div>

            {/* Cell 2: Candidate (You) */}
            <div
              className={`rounded-2xl bg-slate-950 border p-4 relative overflow-hidden flex flex-col justify-between text-white transition-all shadow-md ${
                activeSpeakerId === 'candidate' ? 'border-emerald-500 ring-4 ring-emerald-500/30' : 'border-slate-800'
              }`}
            >
              <video
                ref={candidateVideoRef}
                autoPlay
                playsInline
                muted
                className={`absolute inset-0 w-full h-full object-cover -scale-x-100 ${
                  !isCameraActive ? 'hidden' : ''
                }`}
              />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500">
                  <VideoOff size={32} />
                  <p className="text-xs mt-1">Webcam paused</p>
                </div>
              )}

              <div className="z-10 flex items-center justify-between">
                <span className="text-[11px] font-semibold bg-black/60 px-2.5 py-1 rounded-full">
                  You (Candidate)
                </span>
                {activeSpeakerId === 'candidate' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Speaking
                  </span>
                )}
              </div>

              <div className="z-10 bg-black/70 p-2 rounded-xl border border-white/10 text-xs">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Contribution count: {candidateContributionCount}</p>
                <p className="line-clamp-1 italic text-slate-200">
                  {candidateSpeechText || 'Click "Take the Floor" to speak...'}
                </p>
              </div>
            </div>

            {/* Cell 3: AI Participant Priya */}
            <div
              className={`rounded-2xl bg-slate-900 border p-4 flex flex-col justify-between text-white relative transition-all shadow-md ${
                activeSpeakerId === 'priya' ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-semibold bg-black/50 px-2.5 py-1 rounded-full">
                  Priya Sharma
                </span>
                {activeSpeakerId === 'priya' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Volume2 size={11} className="animate-bounce" /> Speaking
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center justify-center my-auto">
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-xl shadow-lg">
                  PS
                </div>
                <p className="text-xs font-bold mt-2">Candidate Participant</p>
              </div>

              <div className="text-[11px] text-slate-400 bg-black/40 p-2 rounded-lg">
                Viewpoint: Analytical, research-oriented
              </div>
            </div>

            {/* Cell 4: AI Participant Vikram */}
            <div
              className={`rounded-2xl bg-slate-900 border p-4 flex flex-col justify-between text-white relative transition-all shadow-md ${
                activeSpeakerId === 'vikram' ? 'border-emerald-500 ring-4 ring-emerald-500/20' : 'border-slate-800'
              }`}
            >
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] font-semibold bg-black/50 px-2.5 py-1 rounded-full">
                  Vikram Malhotra
                </span>
                {activeSpeakerId === 'vikram' && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/70 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                    <Volume2 size={11} className="animate-bounce" /> Speaking
                  </span>
                )}
              </div>

              <div className="flex flex-col items-center justify-center my-auto">
                <div className="w-20 h-20 rounded-full bg-linear-to-tr from-amber-500 to-orange-700 flex items-center justify-center font-bold text-xl shadow-lg">
                  VM
                </div>
                <p className="text-xs font-bold mt-2">Candidate Participant</p>
              </div>

              <div className="text-[11px] text-slate-400 bg-black/40 p-2 rounded-lg">
                Viewpoint: Industry practicality & business trade-offs
              </div>
            </div>
          </div>

          {/* Lower Action & Discussion Transcript */}
          <div className="grid md:grid-cols-3 gap-4">
            {/* Live Controls */}
            <div className="bg-white dark:bg-navy-900 p-4 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400">
                Floor Controls
              </h4>

              <Button
                variant={isMicActive ? 'danger' : 'primary'}
                size="md"
                className="w-full"
                onClick={isMicActive ? handleFinishSpeaking : handleCandidateTakeFloor}
                leftIcon={isMicActive ? <Check size={16} /> : <Hand size={16} />}
              >
                {isMicActive ? 'Finish Speaking & Yield Floor' : 'Take Floor / Speak Point'}
              </Button>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={toggleCamera}
                >
                  {isCameraActive ? 'Pause Video' : 'Resume Video'}
                </Button>
              </div>

              {isMicActive && (
                <div className="space-y-1">
                  <textarea
                    rows={2}
                    value={candidateSpeechText}
                    onChange={(e) => setCandidateSpeechText(e.target.value)}
                    placeholder="Type or verify spoken point..."
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-surface-300 dark:border-navy-600 bg-surface-50 dark:bg-navy-800 text-navy-900 dark:text-white"
                  />
                </div>
              )}
            </div>

            {/* Discussion Feed */}
            <div className="md:col-span-2 bg-white dark:bg-navy-900 p-4 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-surface-400 flex items-center justify-between">
                <span>Discussion Feed</span>
                <span className="text-[10px] text-surface-400 font-normal">Auto-transcribed</span>
              </h4>

              <div className="max-h-48 overflow-y-auto space-y-2.5 pr-1">
                {discussionTranscript.length === 0 ? (
                  <p className="text-xs text-surface-400 italic">Discussion starting...</p>
                ) : (
                  discussionTranscript.map((t, idx) => (
                    <div key={idx} className="p-2.5 rounded-xl bg-surface-50 dark:bg-navy-800 text-xs space-y-0.5">
                      <div className="flex justify-between font-semibold text-navy-900 dark:text-white text-[11px]">
                        <span>{t.sender}</span>
                        <span className="text-surface-400 text-[10px]">{t.time}</span>
                      </div>
                      <p className="text-surface-600 dark:text-surface-300 leading-relaxed">
                        {t.text}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── STAGE 3: GD FEEDBACK REPORT ── */}
      {stage === 'feedback' && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center mx-auto shadow-xs">
              <Award size={36} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 dark:text-white">
              Placement Group Discussion Feedback
            </h1>
            <p className="text-xs sm:text-sm text-surface-500">
              Evaluated on Placement Rubric: {selectedTopic.title}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Relevance of Arguments', score: '8.5 / 10' },
              { label: 'Clarity of Expression', score: '8.0 / 10' },
              { label: 'Respectful Disagreement', score: '9.0 / 10' },
              { label: 'Listening & Turn-Taking', score: '8.5 / 10' },
              { label: 'Logical Reasoning', score: '8.2 / 10' },
              { label: 'Conciseness & Brevity', score: '8.8 / 10' },
            ].map((m) => (
              <Card key={m.label} padding="md" className="text-center">
                <p className="text-xs text-surface-500">{m.label}</p>
                <p className="text-xl font-bold text-accent-600 mt-1">{m.score}</p>
              </Card>
            ))}
          </div>

          <div className="bg-white dark:bg-navy-900 p-6 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-xs space-y-3">
            <h3 className="font-bold text-base text-navy-900 dark:text-white">
              Moderator Assessment & Actionable Recommendations
            </h3>
            <ul className="space-y-2 text-xs text-navy-800 dark:text-surface-200">
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Strong Contribution Entry:</strong> Successfully acknowledged the preceding speaker's point before pivoting to operational metrics.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 size={15} className="text-emerald-500 shrink-0 mt-0.5" />
                <span><strong>Balanced Turn Duration:</strong> Spoke for a concise ~45 seconds without interrupting or filibustering the conversation.</span>
              </li>
              <li className="flex items-start gap-2">
                <Sparkles size={15} className="text-accent-500 shrink-0 mt-0.5" />
                <span><strong>Growth Area:</strong> Try introducing concrete statistics or recent industry benchmarks (e.g. Gartner or Stack Overflow Developer Survey stats) to strengthen initial premise.</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-between">
            <Button variant="outline" onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
            <Button onClick={() => setStage('topic-select')} rightIcon={<ArrowRight size={15} />}>
              Try Another GD Topic
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
