import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Play, Video, MessageSquare, FileText, BookOpen, TrendingUp, Target,
  Flame, HelpCircle, ArrowRight, Clock, ChevronRight, Sparkles, CheckCircle2,
  Bookmark, ShieldCheck, Edit3, Award, ExternalLink, Brain, Users, Check,
  Bot
} from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import { PRACTICE_COURSES } from '@/lib/courses-data';
import {
  getDailyGoal,
  saveDailyGoal,
  getPrepChecklist,
  getOnboardingProfile,
} from '@/lib/storage';
import {
  DEMO_DASHBOARD_STATS,
  DEMO_RECENT_SESSIONS,
  DEMO_RESUME_ANALYSIS,
} from '@/lib/mock-data';
import type { DailyPracticeGoal, UserOnboardingProfile } from '@/types';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const navigate = useNavigate();

  const [dailyGoal, setDailyGoal] = useState<DailyPracticeGoal>(getDailyGoal());
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [goalTargetInput, setGoalTargetInput] = useState(dailyGoal.targetQuestions);
  const [onboardingProfile, setOnboardingProfile] = useState<UserOnboardingProfile>(getOnboardingProfile());

  // Completed lessons from storage
  const [completedLessonIds, setCompletedLessonIds] = useState<string[]>(() => {
    try {
      const s = localStorage.getItem('apticore_completed_lessons');
      return s ? JSON.parse(s) : ['pf-1'];
    } catch {
      return ['pf-1'];
    }
  });

  // Resume improvement checklist
  const [resumeChecklist, setResumeChecklist] = useState([
    { id: 'rc-1', text: 'Quantify metrics (% latency reduction, users served) in project bullets', done: true },
    { id: 'rc-2', text: 'Add missing test automation skills (Vitest / Jest / Cypress)', done: false },
    { id: 'rc-3', text: 'Ensure technical skills align with target Frontend/FullStack job spec', done: true },
    { id: 'rc-4', text: 'Add clean single-column PDF export with ATS-compatible headings', done: false },
  ]);

  const toggleResumeChecklist = (id: string) => {
    setResumeChecklist((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const firstName = user?.name?.split(' ')[0] || 'Candidate';

  const goalPercent = Math.min(
    100,
    Math.round((dailyGoal.completedQuestionsToday / dailyGoal.targetQuestions) * 100)
  );

  const handleSaveGoal = () => {
    const updated: DailyPracticeGoal = {
      ...dailyGoal,
      targetQuestions: goalTargetInput,
      targetMinutes: goalTargetInput * 6,
    };
    saveDailyGoal(updated);
    setDailyGoal(updated);
    setShowGoalModal(false);
    toast.success(`Daily goal updated to ${goalTargetInput} questions!`);
  };

  // Active courses in progress
  const inProgressCourses = PRACTICE_COURSES.slice(0, 3);

  return (
    <div className="space-y-6 pb-12 font-sans text-[#172033]">
      {/* ── 1. WELCOME & PRIMARY QUICK ACTION ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-[#172033] tracking-tight">
              {t('dashboard.welcome')}, {firstName}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-accent-600/10 text-accent-600 border border-accent-600/20">
              <Sparkles size={12} />
              {onboardingProfile.targetRole}
            </span>
          </div>
          <p className="text-[#64748B] text-sm mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={() => navigate('/interview/modes')}
            leftIcon={<Play size={16} />}
            className="bg-accent-600 hover:bg-accent-700 text-white shadow-xs text-xs font-semibold px-4 py-2"
          >
            {t('header.startInterview')} (Live Modes)
          </Button>
        </div>
      </div>

      {/* ── LIVE INTERVIEW MODES HIGHLIGHT BANNER ── */}
      <div className="bg-linear-to-r from-accent-600 via-accent-700 to-navy-900 rounded-2xl p-5 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide bg-white/20 text-white backdrop-blur-xs">
              Live Video Modes
            </span>
            <span className="text-xs text-accent-100 font-medium">
              Photorealistic AI Avatar & Peer WebRTC Calling
            </span>
          </div>
          <h2 className="text-lg font-bold tracking-tight text-white">
            Ready for your live face-to-face simulation?
          </h2>
          <p className="text-xs text-accent-100 max-w-xl">
            Choose between an interactive photorealistic AI interviewer with synchronized speech or an invite-only peer room for real human video evaluation.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => navigate('/interview/ai-video')}
            className="px-3.5 py-2 rounded-xl bg-white text-accent-700 font-bold text-xs hover:bg-accent-50 transition-all shadow-xs flex items-center gap-1.5"
          >
            <Sparkles size={14} className="text-accent-600" />
            AI Video Interview
          </button>
          <button
            onClick={() => navigate('/interview/modes')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition-all border border-white/20 flex items-center gap-1.5"
          >
            <Video size={14} />
            View Modes & Codes
          </button>
        </div>
      </div>

      {/* ── 2. QUICK ACTION LAUNCHERS (The 4 Key Workflows) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Course-Based Video Interview */}
        <div
          onClick={() => navigate('/interview/course-video')}
          className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-accent-600 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-accent-600/20">
                <Video size={20} />
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-accent-600 text-white">
                VIDEO AI
              </span>
            </div>
            <h3 className="text-sm font-bold text-[#172033] mt-3 group-hover:text-accent-600 transition-colors">
              {t('dashboard.launchMock')}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t('dashboard.launchMockDesc')}
            </p>
          </div>
          <span className="text-xs text-accent-600 font-semibold mt-3 flex items-center gap-1">
            {t('common.continue')} <ArrowRight size={13} />
          </span>
        </div>

        {/* Resume Analyzer */}
        <div
          onClick={() => navigate('/resume')}
          className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-success-600 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-success-600/10 text-success-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-success-600/20">
              <FileText size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mt-3 group-hover:text-success-600 transition-colors">
              {t('dashboard.launchResume')}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t('dashboard.launchResumeDesc')}
            </p>
          </div>
          <span className="text-xs text-success-600 font-semibold mt-3 flex items-center gap-1">
            {t('common.continue')} <ArrowRight size={13} />
          </span>
        </div>

        {/* Aptitude Test */}
        <div
          onClick={() => navigate('/aptitude')}
          className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-accent-600 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-accent-600/20">
              <Brain size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mt-3 group-hover:text-accent-600 transition-colors">
              {t('dashboard.launchAptitude')}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t('dashboard.launchAptitudeDesc')}
            </p>
          </div>
          <span className="text-xs text-accent-600 font-semibold mt-3 flex items-center gap-1">
            {t('common.continue')} <ArrowRight size={13} />
          </span>
        </div>

        {/* AI Group Discussion */}
        <div
          onClick={() => navigate('/group-discussion')}
          className="p-4 rounded-2xl bg-white border border-[#E2E8F0] hover:border-warning-600 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-warning-600/10 text-warning-600 flex items-center justify-center group-hover:scale-105 transition-transform border border-warning-600/20">
              <Users size={20} />
            </div>
            <h3 className="text-sm font-bold text-[#172033] mt-3 group-hover:text-warning-600 transition-colors">
              {t('dashboard.launchGd')}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              {t('dashboard.launchGdDesc')}
            </p>
          </div>
          <span className="text-xs text-warning-600 font-semibold mt-3 flex items-center gap-1">
            {t('common.continue')} <ArrowRight size={13} />
          </span>
        </div>
      </div>

      {/* ── 3. CONTINUE LEARNING SECTION (Courses In Progress) ── */}
      <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-[#172033] flex items-center gap-2">
              <BookOpen size={18} className="text-accent-600" />
              {t('dashboard.continueLearning')}
            </h3>
            <p className="text-xs text-[#64748B] mt-0.5">
              Resume your structured interview preparation curriculum
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/courses')}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
          >
            Browse All 11 Courses
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {inProgressCourses.map((c) => {
            const completedCount = c.lessons.filter((l) => completedLessonIds.includes(l.id)).length;
            const progressPct = Math.round((completedCount / c.lessons.length) * 100);

            return (
              <div
                key={c.id}
                onClick={() => navigate('/courses')}
                className="p-4 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white transition-all cursor-pointer flex flex-col justify-between shadow-xs hover:border-accent-600"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-[#E2E8F0] text-[#64748B]">
                      {c.category}
                    </span>
                    <span className="text-[#64748B] font-mono text-[11px]">
                      {completedCount}/{c.lessons.length} lessons
                    </span>
                  </div>
                  <h4 className="font-bold text-sm text-[#172033] line-clamp-1">
                    {c.title}
                  </h4>
                  <p className="text-xs text-[#64748B] mt-1 line-clamp-2">
                    {c.description}
                  </p>
                </div>

                <div className="mt-3 pt-3 border-t border-[#E2E8F0] space-y-1.5">
                  <div className="flex justify-between text-[11px] font-semibold text-[#172033]">
                    <span>Progress</span>
                    <span>{progressPct}%</span>
                  </div>
                  <div className="w-full bg-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-600 h-1.5 rounded-full"
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 4. DAILY PRACTICE GOAL & RESUME IMPROVEMENT CHECKLIST ── */}
      <div className="grid md:grid-cols-2 gap-5">
        {/* Daily Practice Goal */}
        <Card padding="md" className="flex flex-col justify-between bg-white border-[#E2E8F0] shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Target size={16} className="text-accent-600" />
                <h3 className="text-sm font-bold text-[#172033]">
                  {t('dashboard.practiceGoals')}
                </h3>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Target: {dailyGoal.targetQuestions} questions/day ({dailyGoal.targetMinutes} mins)
              </p>
            </div>

            <button
              onClick={() => setShowGoalModal(true)}
              className="text-xs text-accent-600 hover:underline flex items-center gap-1 font-semibold"
            >
              <Edit3 size={12} /> Adjust Goal
            </button>
          </div>

          <div className="my-4 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="font-semibold text-[#172033]">
                {dailyGoal.completedQuestionsToday} of {dailyGoal.targetQuestions} questions completed today
              </span>
              <span className="text-[#64748B] font-bold">{goalPercent}%</span>
            </div>
            <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-accent-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${goalPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-[#64748B] pt-2 border-t border-[#E2E8F0]">
            <span className="flex items-center gap-1 text-warning-600 font-semibold">
              <Flame size={14} className="fill-warning-600 text-warning-600" />
              {dailyGoal.streakDays}-Day Practice Streak
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/interview/course-video')}
              className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
            >
              Practice Next Question
            </Button>
          </div>
        </Card>

        {/* Resume Improvement Checklist */}
        <Card padding="md" className="flex flex-col justify-between bg-white border-[#E2E8F0] shadow-xs">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-success-600" />
                <h3 className="text-sm font-bold text-[#172033]">
                  {t('dashboard.resumeChecklist')}
                </h3>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Target alignment: {DEMO_RESUME_ANALYSIS.targetRole}
              </p>
            </div>

            <button
              onClick={() => navigate('/resume')}
              className="text-xs text-accent-600 hover:underline font-semibold"
            >
              View Full Report
            </button>
          </div>

          <div className="my-3 space-y-2">
            {resumeChecklist.map((item) => (
              <div
                key={item.id}
                onClick={() => toggleResumeChecklist(item.id)}
                className="flex items-start gap-2.5 cursor-pointer text-xs group"
              >
                <div
                  className={`w-4 h-4 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    item.done
                      ? 'bg-success-600 text-white'
                      : 'border border-[#CBD5E1]'
                  }`}
                >
                  {item.done && <Check size={11} />}
                </div>
                <span
                  className={
                    item.done
                      ? 'text-[#94A3B8] line-through'
                      : 'text-[#172033] group-hover:text-accent-600'
                  }
                >
                  {item.text}
                </span>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-[#E2E8F0] flex justify-between items-center text-xs">
            <span className="text-[#64748B]">
              {resumeChecklist.filter((i) => i.done).length} of {resumeChecklist.length} actions completed
            </span>
            <Button
              size="sm"
              onClick={() => navigate('/resume/practice')}
              className="text-xs bg-accent-600 hover:bg-accent-700 text-white shadow-xs"
            >
              Practice Resume Questions
            </Button>
          </div>
        </Card>
      </div>

      {/* ── 5. RECENT INTERVIEWS & APTITUDE BENCHMARKS ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Recent Interviews */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm sm:text-base text-[#172033] flex items-center gap-2">
              <Clock size={16} className="text-accent-600" />
              {t('dashboard.recentInterviews')}
            </h3>
            <button
              onClick={() => navigate('/history')}
              className="text-xs text-accent-600 hover:underline font-semibold"
            >
              View All History
            </button>
          </div>

          <div className="space-y-2.5">
            {DEMO_RECENT_SESSIONS.slice(0, 3).map((s) => (
              <div
                key={s.id}
                onClick={() => navigate(`/interview/feedback/${s.id}`)}
                className="p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white transition-all cursor-pointer flex items-center justify-between shadow-xs hover:border-accent-600"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs sm:text-sm text-[#172033]">
                      {s.role}
                    </span>
                    <Badge variant="accent" size="sm">{s.type}</Badge>
                  </div>
                  <span className="text-[11px] text-[#64748B] mt-0.5 block">
                    {s.date} • {s.questionCount} Questions Answered
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-success-600">{s.score}%</span>
                  <span className="text-[10px] text-[#64748B] block">Rubric Score</span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[10px] text-[#64748B] text-center italic">
            Sample baseline records shown in demo mode. All live interviews are evaluated and saved to your profile.
          </p>
        </div>

        {/* Aptitude Benchmark Scores */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5 shadow-xs space-y-4 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2">
                <Brain size={16} className="text-accent-600" />
                {t('dashboard.aptitudeScores')}
              </h3>
              <Badge variant="success" size="sm">78% Avg</Badge>
            </div>
            <p className="text-xs text-[#64748B] mt-1">
              Topic-wise performance across quantitative and logical categories
            </p>

            <div className="mt-4 space-y-2.5 text-xs">
              {[
                { name: 'Quantitative Aptitude', score: 82 },
                { name: 'Logical Reasoning', score: 85 },
                { name: 'Verbal Ability', score: 74 },
                { name: 'Data Interpretation', score: 71 },
              ].map((m) => (
                <div key={m.name} className="space-y-1">
                  <div className="flex justify-between font-semibold text-[#172033] text-[11px]">
                    <span>{m.name}</span>
                    <span>{m.score}%</span>
                  </div>
                  <div className="w-full bg-[#F8FAFC] border border-[#E2E8F0] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-accent-600 h-1.5 rounded-full"
                      style={{ width: `${m.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            size="sm"
            onClick={() => navigate('/aptitude')}
            className="w-full text-xs mt-3 bg-accent-600 hover:bg-accent-700 text-white shadow-xs"
            rightIcon={<ArrowRight size={13} />}
          >
            Take New Aptitude Test
          </Button>
        </div>
      </div>

      {/* Adjust Goal Modal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Customize Daily Practice Goal"
      >
        <div className="space-y-4">
          <p className="text-xs text-[#64748B]">
            Set the number of interview questions you commit to practicing every day:
          </p>

          <div className="space-y-2">
            {[2, 3, 5, 8].map((qCount) => (
              <button
                key={qCount}
                type="button"
                onClick={() => setGoalTargetInput(qCount)}
                className={`w-full p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                  goalTargetInput === qCount
                    ? 'border-accent-600 bg-accent-600/10 text-accent-600 ring-1 ring-accent-600 shadow-xs'
                    : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#172033]'
                }`}
              >
                <span>{qCount} Questions / Day (~{qCount * 6} mins)</span>
                {goalTargetInput === qCount && <span className="text-accent-600 font-bold">✓ Selected</span>}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#E2E8F0]">
            <Button variant="outline" size="sm" onClick={() => setShowGoalModal(false)} className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]">
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveGoal} className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
              Save Target
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
