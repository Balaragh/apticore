import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Video, Users, Sparkles, Shield, ArrowRight, Play, Calendar,
  CheckCircle2, Clock, MessageSquare, Bot, Mic, FileText, Lock,
  ExternalLink, LogIn, Award
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { createScheduledInterview } from '@/lib/scheduled-interviews';
import toast from 'react-hot-toast';

export default function InterviewModesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const [joinRoomCode, setJoinRoomCode] = useState('');
  const [joinRole, setJoinRole] = useState<'candidate' | 'interviewer'>('candidate');

  const handleStartAIVideo = () => {
    navigate('/interview/ai-video');
  };

  const handleCreateInstantHumanRoom = () => {
    const instantCode = `apti-meet-${Math.floor(100 + Math.random() * 900)}`;
    const isInterviewerRole = (user?.role as string) === 'interviewer' || user?.role === 'admin';
    const interviewerName = isInterviewerRole ? (user?.name || 'Lead Interviewer') : 'Lead Interviewer';
    const interviewerEmail = isInterviewerRole ? (user?.email || 'interviewer@skillpilot.com') : 'interviewer@skillpilot.com';
    const candidateName = !isInterviewerRole ? (user?.name || 'Candidate') : 'Invited Candidate';
    const candidateEmail = !isInterviewerRole ? (user?.email || 'candidate@example.com') : 'candidate@example.com';

    createScheduledInterview({
      title: 'Instant Live Human Interview',
      role: 'Full Stack Developer',
      type: 'mixed',
      scheduledFor: new Date().toISOString(),
      durationMinutes: 45,
      interviewerName,
      interviewerEmail,
      candidateName,
      candidateEmail,
      customRoomCode: instantCode,
    });

    const userRole = isInterviewerRole ? 'interviewer' : 'candidate';
    navigate(`/interview/live/${instantCode}?role=${userRole}`);
    toast.success(`Created live human room! Room code: ${instantCode}`);
  };

  const handleJoinExistingRoom = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = joinRoomCode.trim();
    if (!cleanCode) {
      toast.error('Please enter a room code to join');
      return;
    }
    navigate(`/interview/live/${cleanCode}?role=${joinRole}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16 font-sans text-[#172033]">
      {/* ── Page Header ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent-50 text-accent-700 text-xs font-semibold border border-accent-200">
              <Sparkles size={13} className="text-accent-600" />
              <span>SkillPilot AI • Dual Interview Engine</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              Select Your Interview Mode
            </h1>
            <p className="text-sm text-[#64748B] leading-relaxed">
              Choose between an interactive photorealistic AI interviewer for adaptive on-demand practice,
              or a secure real-time WebRTC room for live face-to-face interviews between two actual people.
            </p>
          </div>

          {/* Quick Schedule Navigation */}
          <div className="flex sm:flex-col items-center sm:items-end gap-2.5 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/interview/schedule')}
              leftIcon={<Calendar size={14} className="text-accent-600" />}
              className="bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC] text-xs font-medium"
            >
              Scheduled Calendar
            </Button>
            <span className="text-[11px] text-[#64748B] hidden sm:block">
              Manage invites & upcoming sessions
            </span>
          </div>
        </div>
      </div>

      {/* ── Two Primary Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── MODE 1: Photorealistic AI Video Interview ── */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border-2 border-accent-600/30 hover:border-accent-600 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
        >
          {/* Card Top Banner */}
          <div className="bg-linear-to-r from-accent-600/10 via-accent-500/5 to-transparent p-6 border-b border-[#E2E8F0]/80">
            <div className="flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-accent-600 text-white flex items-center justify-center shadow-xs">
                <Bot size={24} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-accent-600 text-white">
                  MODE 1
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-accent-700 border border-accent-200">
                  Interactive Avatar
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-[#172033] mt-4">
              Photorealistic AI Video Interview
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Real-time interactive human avatar with synchronized lip movements, natural speech,
              and adaptive follow-up inquiries powered by conversational AI.
            </p>
          </div>

          {/* Card Feature Checklist */}
          <div className="p-6 space-y-4 flex-1">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Photorealistic Human Avatar
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Live video stream with facial expressions and synchronized lip movements via streaming WebRTC (no anime or cartoon avatars).
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Spoken Answer Transcription & Conversational Turn-Taking
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Captures your speech in real time, displays live subtitles, handles interruptions, and asks natural follow-up questions.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Resume & Role Grounded Evaluation
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Questions are tailored directly to your target role, experience level, and verified projects from your uploaded resume.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Dual-Panel Video Layout
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    AI interviewer video in the main viewport with your live camera in the bottom-right picture-in-picture frame.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Action */}
          <div className="p-6 pt-0">
            <Button
              onClick={handleStartAIVideo}
              className="w-full h-11 bg-accent-600 hover:bg-accent-700 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-2"
            >
              <span>Launch AI Video Interview</span>
              <ArrowRight size={15} />
            </Button>
            <p className="text-[10px] text-center text-[#64748B] mt-2">
              Ready for immediate practice • Device check & consent verified before start
            </p>
          </div>
        </motion.div>

        {/* ── MODE 2: Real Human Live Video Interview ── */}
        <motion.div
          whileHover={{ y: -4 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-2xl border-2 border-slate-200 hover:border-slate-400 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden"
        >
          {/* Card Top Banner */}
          <div className="bg-linear-to-r from-slate-100 via-slate-50 to-transparent p-6 border-b border-[#E2E8F0]/80">
            <div className="flex items-center justify-between gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
                <Users size={24} />
              </div>
              <div className="flex items-center gap-1.5 flex-wrap justify-end">
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-slate-900 text-white">
                  MODE 2
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white text-slate-700 border border-slate-200">
                  Real 2-Person WebRTC
                </span>
              </div>
            </div>

            <h2 className="text-xl font-bold text-[#172033] mt-4">
              Real Human Live Video Interview
            </h2>
            <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
              Genuine 1-on-1 peer-to-peer live video and audio communication between candidate
              and actual interviewer using WebRTC and Socket.IO signaling.
            </p>
          </div>

          {/* Card Feature Checklist */}
          <div className="p-6 space-y-4 flex-1">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Genuine Face-to-Face WebRTC Video
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Connects two actual participants via secure P2P stream. Never simulates a second participant or displays mock video.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Unique Room Links & Waiting Room Admission
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Share an invitation link or room code. Candidates wait in the waiting room until admitted by the interviewer host.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Full Media Controls & Device Switching
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Camera on/off, microphone mute/unmute, speaker testing, screen sharing, reconnection recovery, and end-call states.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                  <CheckCircle2 size={13} />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-[#172033]">
                    Collaborative Workspace & Evaluation
                  </h4>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Synchronized code editor, stage progression, in-room chat, and post-interview rubric scoring for hiring decisions.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="p-6 pt-0 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Button
                onClick={handleCreateInstantHumanRoom}
                className="h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs flex items-center justify-center gap-1.5"
              >
                <Play size={14} />
                <span>Instant Room</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/interview/schedule')}
                className="h-11 bg-white border-slate-300 hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5"
              >
                <Calendar size={14} />
                <span>Schedule Call</span>
              </Button>
            </div>
            <p className="text-[10px] text-center text-[#64748B]">
              Requires second participant to join before connecting • End-to-end encrypted
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Quick Room Joiner & Invitation Input ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#172033] flex items-center gap-2">
              <LogIn size={16} className="text-accent-600" />
              <span>Join an Existing Live Interview Room</span>
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Received a room link or code from an interviewer or candidate? Enter it below to join the call directly.
            </p>
          </div>

          <form onSubmit={handleJoinExistingRoom} className="flex flex-col sm:flex-row items-center gap-2.5 shrink-0">
            {/* Role Selector */}
            <select
              value={joinRole}
              onChange={(e) => setJoinRole(e.target.value as any)}
              className="px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs font-semibold text-[#172033] focus:outline-none focus:border-accent-600"
            >
              <option value="candidate">Join as Candidate</option>
              <option value="interviewer">Join as Interviewer</option>
            </select>

            {/* Room Code Input */}
            <input
              type="text"
              placeholder="e.g. apti-meet-801"
              value={joinRoomCode}
              onChange={(e) => setJoinRoomCode(e.target.value)}
              className="px-3.5 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-xs text-[#172033] font-mono placeholder:text-slate-400 focus:outline-none focus:border-accent-600 w-44"
            />

            <Button
              type="submit"
              size="sm"
              className="bg-accent-600 hover:bg-accent-700 text-white font-semibold text-xs shadow-xs px-4"
            >
              Join Room
            </Button>
          </form>
        </div>
      </div>

      {/* ── Privacy, Recording Consent & Security Assurance Banner ── */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-xs text-[#64748B]">
        <div className="w-8 h-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-accent-600 shrink-0 mt-0.5">
          <Lock size={15} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-[#172033] text-xs">
            Privacy & Explicit Media Consent
          </h4>
          <p className="leading-relaxed">
            SkillPilot AI requests access to your camera and microphone strictly for live video interview communication,
            transcription, and skill evaluation. No audio or video is stored or recorded without prior explicit confirmation.
            All third-party video avatar integrations are authenticated securely from the backend server.
          </p>
        </div>
      </div>
    </div>
  );
}
