import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar, Video, Plus, Copy, ExternalLink, Clock, Users,
  CheckCircle2, AlertCircle, Search, Filter, Shield, ChevronRight,
  Sparkles, FileText, ArrowRight, Play
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import {
  getScheduledInterviews,
  createScheduledInterview,
} from '@/lib/scheduled-interviews';
import type { InterviewType, ScheduledInterview } from '@/types';
import toast from 'react-hot-toast';

export default function InterviewSchedulePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [interviews, setInterviews] = useState<ScheduledInterview[]>(getScheduledInterviews());
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'all'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Form State for Scheduling New Interview
  const [formCandidateName, setFormCandidateName] = useState('Alex Johnson');
  const [formCandidateEmail, setFormCandidateEmail] = useState('alex.candidate@example.com');
  const [formRole, setFormRole] = useState('Frontend Developer');
  const [formType, setFormType] = useState<InterviewType>('technical');
  const [formDuration, setFormDuration] = useState(45);
  const [formDate, setFormDate] = useState(new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString().slice(0, 16));
  const [formInterviewerName, setFormInterviewerName] = useState(user?.name || 'Sarah Chen');
  const [formInterviewerEmail, setFormInterviewerEmail] = useState(user?.email || 'sarah.chen@enterprise.com');
  const [formNotes, setFormNotes] = useState('');

  const filteredInterviews = interviews.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.candidateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.roomCode.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (activeTab === 'upcoming') return item.status === 'scheduled' || item.status === 'in-progress' || item.status === 'waiting';
    if (activeTab === 'completed') return item.status === 'completed';
    return true;
  });

  const handleCreateInterview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formCandidateName || !formRole) {
      toast.error('Please enter candidate name and target role.');
      return;
    }

    const newSession = createScheduledInterview({
      title: `${formRole} • Live Technical Interview`,
      role: formRole,
      type: formType,
      scheduledFor: new Date(formDate).toISOString(),
      durationMinutes: formDuration,
      interviewerName: formInterviewerName,
      interviewerEmail: formInterviewerEmail,
      candidateName: formCandidateName,
      candidateEmail: formCandidateEmail,
      meetingNotes: formNotes,
    });

    setInterviews(getScheduledInterviews());
    setShowScheduleModal(false);
    toast.success(`Interview scheduled! Room code: ${newSession.roomCode}`);
  };

  const copyCandidateLink = (roomCode: string) => {
    const url = `${window.location.origin}/interview/live/${roomCode}?role=candidate`;
    navigator.clipboard.writeText(url);
    toast.success(language === 'ta' ? 'விண்ணப்பதாரர் இணைப்பு நகலெடுக்கப்பட்டது!' : language === 'hi' ? 'उम्मीदवार लिंक कॉपी किया गया!' : 'Candidate invitation link copied to clipboard!');
  };

  const copyInterviewerLink = (roomCode: string) => {
    const url = `${window.location.origin}/interview/live/${roomCode}?role=interviewer`;
    navigator.clipboard.writeText(url);
    toast.success(language === 'ta' ? 'மதிப்பீட்டாளர் இணைப்பு நகலெடுக்கப்பட்டது!' : language === 'hi' ? 'साक्षात्कारकर्ता लिंक कॉपी किया गया!' : 'Interviewer host link copied to clipboard!');
  };

  const launchTwoTabTest = (roomCode: string) => {
    const interviewerUrl = `/interview/live/${roomCode}?role=interviewer`;
    const candidateUrl = `/interview/live/${roomCode}?role=candidate`;
    window.open(interviewerUrl, '_blank');
    setTimeout(() => {
      window.open(candidateUrl, '_blank');
    }, 400);
    toast.success('Opened Interviewer and Candidate tabs for real WebRTC test!');
  };

  const startInstantMeeting = () => {
    const instantCode = `apti-meet-${Math.floor(100 + Math.random() * 900)}`;
    createScheduledInterview({
      title: 'Instant Ad-Hoc Interview Session',
      role: 'Full Stack Developer',
      type: 'mixed',
      scheduledFor: new Date().toISOString(),
      durationMinutes: 45,
      interviewerName: user?.name || 'Lead Interviewer',
      interviewerEmail: user?.email || 'interviewer@apticore.com',
      candidateName: 'Invited Candidate',
      candidateEmail: 'candidate@example.com',
      customRoomCode: instantCode,
    });
    navigate(`/interview/live/${instantCode}?role=interviewer`);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans text-[#172033]">
      {/* ─── Top Header & Primary Actions ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
              Corporate Video Platform
            </span>
            <span className="text-xs text-[#64748B]">• WebRTC Real-Time</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            {t('schedule.title', 'Interviews & Live Video Rooms')}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1">
            {t('schedule.subtitle', 'Conduct genuine face-to-face technical and behavioral interviews with real-time video, audio, and live evaluations.')}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <Button
            variant="outline"
            onClick={startInstantMeeting}
            className="flex items-center gap-2 bg-white hover:bg-[#F8FAFC] text-[#172033] border-[#E2E8F0] text-xs"
          >
            <Play size={15} className="text-accent-600" />
            {t('schedule.instantMeeting', 'Instant Meeting')}
          </Button>
          <Button
            onClick={() => setShowScheduleModal(true)}
            className="flex items-center gap-2 bg-accent-600 hover:bg-accent-700 text-white shadow-xs text-xs"
          >
            <Plus size={16} />
            {t('schedule.scheduleButton', 'Schedule Interview')}
          </Button>
        </div>
      </div>

      {/* ─── Two-Tab Real WebRTC Testing Assistant Callout ───────────────── */}
      <div className="bg-white border border-accent-600/20 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center shrink-0 border border-accent-600/20">
            <Video size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#172033]">
              {t('schedule.testCalloutTitle', 'Test Real-Time WebRTC Face-to-Face Video')}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5 max-w-2xl leading-relaxed">
              {t('schedule.testCalloutDesc', 'Experience genuine peer-to-peer audio, video, waiting room admission, and live question synchronization. Click below to launch both the Lead Interviewer and Candidate windows simultaneously on your machine.')}
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => launchTwoTabTest('apti-meet-801')}
            className="bg-accent-600 hover:bg-accent-700 text-white flex items-center gap-2 text-xs shadow-xs"
          >
            <ExternalLink size={14} />
            {t('schedule.launch2Tab', 'Launch 2-Tab Live Test')}
          </Button>
        </div>
      </div>

      {/* ─── Filter Tabs & Search Bar ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1 bg-white p-1 rounded-xl border border-[#E2E8F0] shadow-xs">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'upcoming'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            {t('schedule.upcomingTab', 'Upcoming & Live')}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'completed'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            {t('schedule.completedTab', 'Completed & Feedback')}
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'all'
                ? 'bg-accent-600 text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#172033]'
            }`}
          >
            {t('schedule.allTab', 'All Sessions')} ({interviews.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search candidate, role, or room..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-xl border border-[#E2E8F0] text-[#172033] placeholder:text-[#64748B] focus:outline-none focus:ring-1 focus:ring-accent-600 shadow-xs"
          />
        </div>
      </div>

      {/* ─── Scheduled Sessions List ────────────────────────────────────── */}
      <div className="space-y-3">
        {filteredInterviews.length === 0 ? (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-12 text-center text-[#64748B] space-y-3 shadow-xs">
            <Calendar size={32} className="mx-auto text-[#64748B]" />
            <h3 className="text-sm font-semibold text-[#172033]">{t('schedule.noInterviews', 'No interviews found')}</h3>
            <p className="text-xs text-[#64748B] max-w-md mx-auto">
              Schedule an interview session or start an instant meeting to conduct live video assessments.
            </p>
            <Button size="sm" onClick={() => setShowScheduleModal(true)} className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
              {t('schedule.scheduleButton', 'Schedule New Interview')}
            </Button>
          </div>
        ) : (
          filteredInterviews.map((session) => (
            <div
              key={session.id}
              className="bg-white rounded-2xl border border-[#E2E8F0] p-5 hover:border-accent-600 hover:shadow-xs transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-4"
            >
              {/* Left Column: Title, Role, Time, Participants */}
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-accent-600/10 text-accent-600 border border-accent-600/20">
                    {session.role}
                  </span>
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0] uppercase tracking-wider">
                    {session.type}
                  </span>
                  <span
                    className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      session.status === 'completed'
                        ? 'bg-success-600/10 text-success-600 border border-success-600/20'
                        : session.status === 'in-progress'
                        ? 'bg-accent-600/10 text-accent-600 border border-accent-600/20 animate-pulse'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    ● {session.status.toUpperCase()}
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-bold text-[#172033] tracking-tight">
                    {session.title}
                  </h3>
                  <div className="flex items-center gap-4 text-xs text-[#64748B] mt-1 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <Clock size={13} className="text-accent-600" />
                      {new Date(session.scheduledFor).toLocaleString([], {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users size={13} className="text-accent-600" />
                      Candidate: <strong className="text-[#172033]">{session.candidateName}</strong>
                    </span>
                    <span className="flex items-center gap-1.5">
                      Host: <strong className="text-[#172033]">{session.interviewerName}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Column: Actions */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => copyCandidateLink(session.roomCode)}
                  className="text-xs flex items-center gap-1.5 bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                >
                  <Copy size={13} />
                  {t('schedule.copyInvite', 'Copy Invite')}
                </Button>

                {session.status === 'completed' ? (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => navigate(`/interview/feedback/${session.assessmentId || session.id}`)}
                    className="text-xs flex items-center gap-1.5 bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                  >
                    <FileText size={13} className="text-accent-600" />
                    {t('schedule.viewFeedback', 'View Feedback')}
                  </Button>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/interview/live/${session.roomCode}?role=candidate`)}
                      className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                    >
                      {t('schedule.joinCandidate', 'Join as Candidate')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => navigate(`/interview/live/${session.roomCode}?role=interviewer`)}
                      className="bg-accent-600 hover:bg-accent-700 text-white text-xs flex items-center gap-1.5 shadow-xs"
                    >
                      <Video size={13} />
                      {t('schedule.joinHost', 'Join as Host')}
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── Schedule Interview Modal ────────────────────────────────────── */}
      <Modal
        isOpen={showScheduleModal}
        onClose={() => setShowScheduleModal(false)}
        title={t('schedule.scheduleButton', 'Schedule New Interview Session')}
      >
        <form onSubmit={handleCreateInterview} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Candidate Full Name *
              </label>
              <input
                type="text"
                required
                value={formCandidateName}
                onChange={(e) => setFormCandidateName(e.target.value)}
                placeholder="e.g. Alex Johnson"
                className="w-full text-xs p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-accent-600"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Candidate Email *
              </label>
              <input
                type="email"
                required
                value={formCandidateEmail}
                onChange={(e) => setFormCandidateEmail(e.target.value)}
                placeholder="alex.candidate@example.com"
                className="w-full text-xs p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-accent-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Target Role *
              </label>
              <select
                value={formRole}
                onChange={(e) => setFormRole(e.target.value)}
                className="w-full text-xs p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-accent-600"
              >
                <option value="Frontend Developer">Frontend Developer</option>
                <option value="Backend Developer">Backend Developer</option>
                <option value="Full Stack Developer">Full Stack Developer</option>
                <option value="Python Engineer">Python Engineer</option>
                <option value="Java Specialist">Java Specialist</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Round Type
              </label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as InterviewType)}
                className="w-full text-xs p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-accent-600"
              >
                <option value="technical">Technical Code & Architecture</option>
                <option value="behavioral">Behavioral (STAR Method)</option>
                <option value="system-design">System Design</option>
                <option value="mixed">Mixed Assessment</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#172033] block mb-1">
                Duration (Minutes)
              </label>
              <select
                value={formDuration}
                onChange={(e) => setFormDuration(Number(e.target.value))}
                className="w-full text-xs p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-accent-600"
              >
                <option value={30}>30 Minutes</option>
                <option value={45}>45 Minutes</option>
                <option value={60}>60 Minutes</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#172033] block mb-1">
              Date & Start Time
            </label>
            <input
              type="datetime-local"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full text-xs p-2.5 bg-white rounded-xl border border-[#E2E8F0] text-[#172033] focus:outline-none focus:ring-1 focus:ring-accent-600"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#E2E8F0]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowScheduleModal(false)}
              className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
            >
              {t('common.cancel', 'Cancel')}
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs shadow-xs"
            >
              {t('schedule.scheduleButton', 'Create & Schedule')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
