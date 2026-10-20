import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain, Clock, AlertTriangle, CheckCircle2, ChevronRight, ChevronLeft,
  RotateCcw, Award, Check, Bookmark, Flag, Filter, ArrowRight,
  Flame, Calendar, Sparkles, Target, Zap, BarChart3, Code2, BookOpen,
  Layers, RefreshCw, AlertCircle, HelpCircle, Play, ShieldCheck, Compass
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useLanguage } from '@/contexts/language-context';
import { useAuth } from '@/contexts/auth-context';
import {
  aptitudeApi,
  type AptitudeDomain,
  type AptitudeDifficulty,
  type DomainSummaryItem,
  type AptitudeDashboardResponse,
  type PracticeQuestionItem,
  type SubmitPracticeResponse,
} from '@/services/aptitude.api';
import toast from 'react-hot-toast';

export type AptitudeView = 'dashboard' | 'practice' | 'results';

// Domain metadata for iconography and color palettes
const DOMAIN_META: Record<
  AptitudeDomain,
  { icon: any; color: string; bgColor: string; borderColor: string; shortDesc: string }
> = {
  'Quantitative Aptitude': {
    icon: Target,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    shortDesc: 'Arithmetic, Algebra, Percentages, Time & Speed, Profit & Loss',
  },
  'Logical Reasoning': {
    icon: Brain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    shortDesc: 'Syllogisms, Blood Relations, Number Series, Critical Logic',
  },
  'Verbal Ability': {
    icon: BookOpen,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    shortDesc: 'Grammar, Vocabulary, Synonyms, Antonyms, Sentence Correction',
  },
  'Data Interpretation': {
    icon: BarChart3,
    color: 'text-amber-600',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    shortDesc: 'Pie Charts, Bar Graphs, Tables, Data Sufficiency, Caselets',
  },
  'Programming Fundamentals': {
    icon: Code2,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-200',
    shortDesc: 'DSA, Algorithms, OOP, Memory Management, Bit Manipulation',
  },
  'Technical MCQs': {
    icon: Layers,
    color: 'text-rose-600',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    shortDesc: 'Operating Systems, DBMS, ACID, Computer Networks, System Design',
  },
};

export default function AptitudePage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useAuth();

  // ─── Main View Controller ──────────────────────────────────────────────────
  const [view, setView] = useState<AptitudeView>('dashboard');

  // ─── Dashboard State ───────────────────────────────────────────────────────
  const [dashboardData, setDashboardData] = useState<AptitudeDashboardResponse | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState<boolean>(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  // ─── Practice Launch Config Modal ──────────────────────────────────────────
  const [selectedDomain, setSelectedDomain] = useState<AptitudeDomain>('Quantitative Aptitude');
  const [selectedDifficulty, setSelectedDifficulty] = useState<AptitudeDifficulty>('All');
  const [selectedCount, setSelectedCount] = useState<number>(5);
  const [durationMinutes, setDurationMinutes] = useState<number>(15);
  const [isTimed, setIsTimed] = useState<boolean>(true);
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [isLaunchingPractice, setIsLaunchingPractice] = useState<boolean>(false);

  // ─── Active Practice Runner State ──────────────────────────────────────────
  const [practiceQuestions, setPracticeQuestions] = useState<PracticeQuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [flaggedForReview, setFlaggedForReview] = useState<Record<string, boolean>>({});
  const [secondsLeft, setSecondsLeft] = useState<number>(15 * 60);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isExhausted, setIsExhausted] = useState<boolean>(false);
  const [exhaustedMessage, setExhaustedMessage] = useState<string>('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState<boolean>(false);

  // ─── Results State ─────────────────────────────────────────────────────────
  const [resultsData, setResultsData] = useState<SubmitPracticeResponse | null>(null);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // ─── Load Dashboard Data ───────────────────────────────────────────────────
  const loadDashboard = useCallback(async () => {
    setIsLoadingDashboard(true);
    setDashboardError(null);
    try {
      const data = await aptitudeApi.getDashboard();
      setDashboardData(data);
    } catch (err: any) {
      console.error('Failed to load aptitude dashboard:', err);
      setDashboardError(err.message || 'Could not load aptitude data. Please check connection.');
    } finally {
      setIsLoadingDashboard(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ─── Start Practice Session ────────────────────────────────────────────────
  const handleOpenConfig = (domain: AptitudeDomain) => {
    setSelectedDomain(domain);
    setSelectedDifficulty('All');
    setSelectedCount(5);
    setDurationMinutes(15);
    setIsTimed(true);
    setShowConfigModal(true);
  };

  const handleStartPractice = async () => {
    setIsLaunchingPractice(true);
    try {
      const res = await aptitudeApi.getQuestions({
        domain: selectedDomain,
        difficulty: selectedDifficulty,
        count: selectedCount,
      });

      if (res.exhausted || res.questions.length === 0) {
        setIsExhausted(true);
        setExhaustedMessage(
          res.message ||
            `You have answered all available verified questions in ${selectedDomain}.`
        );
        setShowConfigModal(false);
        setView('practice');
        return;
      }

      setIsExhausted(false);
      setPracticeQuestions(res.questions);
      setCurrentIdx(0);
      setSelectedAnswers({});
      setFlaggedForReview({});
      setSecondsLeft(durationMinutes * 60);
      setShowConfigModal(false);
      setView('practice');
      toast.success(`Started ${selectedDomain} daily practice! (${res.questions.length} questions)`);
    } catch (err: any) {
      console.error('Error starting practice:', err);
      toast.error(err.message || 'Failed to retrieve practice questions.');
    } finally {
      setIsLaunchingPractice(false);
    }
  };

  // ─── Timer Countdown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (view === 'practice' && isTimed && !isExhausted) {
      timerRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev === 180) {
            toast('⚠️ 3 minutes remaining in this practice session!');
          }
          if (prev <= 1) {
            handleFinalSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [view, isTimed, isExhausted]);

  // ─── Answer Navigation ─────────────────────────────────────────────────────
  const handleSelectOption = (optionIdx: number) => {
    const q = practiceQuestions[currentIdx];
    if (!q) return;
    setSelectedAnswers((prev) => ({ ...prev, [q.id]: optionIdx }));
  };

  const handleToggleFlag = () => {
    const q = practiceQuestions[currentIdx];
    if (!q) return;
    setFlaggedForReview((prev) => ({ ...prev, [q.id]: !prev[q.id] }));
  };

  const handleClearResponse = () => {
    const q = practiceQuestions[currentIdx];
    if (!q) return;
    setSelectedAnswers((prev) => {
      const copy = { ...prev };
      delete copy[q.id];
      return copy;
    });
  };

  // ─── Submit Practice Answers to Backend ────────────────────────────────────
  const handleFinalSubmit = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setShowConfirmSubmit(false);
    setIsSubmitting(true);

    try {
      const answersPayload = practiceQuestions.map((q) => ({
        questionId: q.id,
        selectedOption: selectedAnswers[q.id] !== undefined ? selectedAnswers[q.id] : -1,
        timeSpentSeconds: 30,
      }));

      const response = await aptitudeApi.submitPractice({
        domain: selectedDomain,
        answers: answersPayload,
      });

      setResultsData(response);
      setView('results');

      if (response.streak.isStreakExtendedToday) {
        toast.success(
          `🔥 Streak Extended! You are now on a ${response.streak.currentStreak}-day streak in ${selectedDomain}!`,
          { duration: 5000 }
        );
      } else if (response.dailyGoalAchieved) {
        toast.success(`🎯 Daily practice goal achieved in ${selectedDomain}!`);
      } else {
        toast.success('Practice session submitted and saved to your history!');
      }

      // Refresh background dashboard data
      loadDashboard();
    } catch (err: any) {
      console.error('Submission error:', err);
      toast.error(err.message || 'Failed to submit practice session.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Reset Domain History (if exhausted) ───────────────────────────────────
  const handleResetHistory = async (domain: AptitudeDomain) => {
    const confirm = window.confirm(
      `Resetting question history for ${domain} will allow you to practice all ${domain} questions again.\n\nYour streak and stats will remain preserved. Continue?`
    );
    if (!confirm) return;

    try {
      await aptitudeApi.resetDomain(domain);
      toast.success(`Question history for ${domain} reset. You can now re-practice questions!`);
      loadDashboard();
      if (view === 'practice') {
        setView('dashboard');
      }
    } catch (err: any) {
      toast.error('Failed to reset history.');
    }
  };

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const currentQ = practiceQuestions[currentIdx];
  const answeredCount = Object.keys(selectedAnswers).length;

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER VIEW 1: APTITUDE HUB & DASHBOARD
  // ───────────────────────────────────────────────────────────────────────────
  if (view === 'dashboard') {
    return (
      <div className="space-y-6 pb-12 font-sans text-[#172033] max-w-7xl mx-auto">
        {/* ── 1. HEADER BAR ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="w-10 h-10 rounded-xl bg-accent-600 text-white flex items-center justify-center shadow-xs">
                <Brain size={22} />
              </span>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#172033]">
                  Daily Aptitude & Streaks
                </h1>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Independent domain streaks, strict no-repeat verified question banks, and daily practice targets.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadDashboard()}
              disabled={isLoadingDashboard}
              className="p-2.5 rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] hover:text-[#172033] hover:border-accent-300 transition-all shadow-xs flex items-center gap-1.5 text-xs font-semibold"
              title="Refresh Streak Data"
            >
              <RefreshCw size={14} className={isLoadingDashboard ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </button>
            <Button
              onClick={() => handleOpenConfig('Quantitative Aptitude')}
              className="bg-accent-600 hover:bg-accent-700 text-white shadow-xs text-xs font-semibold px-4 py-2"
              leftIcon={<Play size={15} />}
            >
              Quick Practice
            </Button>
          </div>
        </div>

        {/* ── 2. HERO STREAK & GOAL SUMMARY CARD ── */}
        {dashboardData && (
          <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              {/* Left Column: Streaks */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                    <Flame size={13} className="text-amber-500 fill-amber-500" />
                    Daily Streak Engine
                  </span>
                  <span className="text-xs text-[#64748B]">
                    Timezone: <strong className="text-[#172033]">{dashboardData.timezone}</strong>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-[#172033] flex items-center gap-3">
                  <span>
                    Highest Active Streak:{' '}
                    <span className="text-accent-600 font-black">
                      {dashboardData.overall.maxActiveStreak} Days
                    </span>
                  </span>
                  {dashboardData.overall.maxActiveStreak > 0 && (
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-accent-600 text-white">
                      🔥 ON FIRE
                    </span>
                  )}
                </h2>
                <p className="text-xs text-[#64748B] max-w-xl">
                  Each aptitude domain tracks its daily streak independently. Complete the daily goal in a domain to extend that domain’s streak.
                </p>
              </div>

              {/* Right Column: Today’s Progress Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center min-w-30">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Today's Questions</span>
                  <p className="text-lg font-black text-[#172033] mt-0.5">
                    {dashboardData.overall.todayQuestionsCompleted}
                  </p>
                  <span className="text-[10px] text-accent-600 font-semibold">Answered Today</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center min-w-30">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">Total Solved</span>
                  <p className="text-lg font-black text-emerald-600 mt-0.5">
                    {dashboardData.overall.totalAnswered}
                  </p>
                  <span className="text-[10px] text-[#64748B]">No-Repeat Unique</span>
                </div>

                <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center min-w-30 col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-[#64748B]">All-Time Record</span>
                  <p className="text-lg font-black text-amber-600 mt-0.5">
                    {dashboardData.overall.maxLongestStreak} Days
                  </p>
                  <span className="text-[10px] text-[#64748B]">Longest Streak</span>
                </div>
              </div>
            </div>

            {/* Overall Practice Days Heatmap Bar */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#64748B] flex items-center gap-1.5">
                  <Calendar size={14} className="text-accent-600" />
                  Practice Activity Calendar (Last 14 Days)
                </span>
                <span className="text-accent-600 font-bold">
                  {dashboardData.overall.practiceDates.length} Practice Days Logged
                </span>
              </div>

              {/* 14-Day Calendar Heatmap Tiles */}
              <div className="grid grid-cols-7 sm:grid-cols-14 gap-2 pt-1">
                {Array.from({ length: 14 }).map((_, idx) => {
                  const d = new Date();
                  d.setDate(d.getDate() - (13 - idx));
                  const dateStr = d.toISOString().split('T')[0];
                  const hasPracticed = dashboardData.overall.practiceDates.includes(dateStr);
                  const isToday = dateStr === dashboardData.today;
                  const dayNum = d.getDate();
                  const monthName = d.toLocaleString('en-US', { month: 'short' });

                  return (
                    <div
                      key={dateStr}
                      className={`p-2 rounded-xl border text-center transition-all ${
                        hasPracticed
                          ? 'bg-accent-600 text-white border-accent-600 font-bold shadow-xs'
                          : isToday
                          ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold ring-1 ring-amber-400'
                          : 'bg-[#F8FAFC] text-[#64748B] border-[#E2E8F0]'
                      }`}
                      title={`${dateStr}: ${hasPracticed ? 'Practiced' : 'No activity'}`}
                    >
                      <div className="text-[9px] uppercase tracking-wider opacity-80">{monthName}</div>
                      <div className="text-sm font-black mt-0.5">{dayNum}</div>
                      <div className="text-[8px] mt-0.5 truncate font-medium">
                        {isToday ? (hasPracticed ? 'Done' : 'Today') : hasPracticed ? 'Active' : '-'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── 3. DOMAIN-WISE STREAK CARDS (The 6 Primary Aptitude Modules) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-[#172033]">
                Domain Practice & Streaks
              </h2>
              <p className="text-xs text-[#64748B]">
                Choose any domain to practice. Each domain maintains its own isolated daily streak and question history.
              </p>
            </div>
          </div>

          {isLoadingDashboard ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-white border border-[#E2E8F0] animate-pulse p-6" />
              ))}
            </div>
          ) : dashboardError ? (
            <div className="p-8 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-center space-y-3">
              <AlertCircle size={28} className="mx-auto text-rose-500" />
              <p className="text-sm font-bold">{dashboardError}</p>
              <Button onClick={() => loadDashboard()} size="sm" variant="outline">
                Retry Connection
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {dashboardData?.domains.map((dom) => {
                const meta = DOMAIN_META[dom.domain] || {
                  icon: Target,
                  color: 'text-accent-600',
                  bgColor: 'bg-accent-50',
                  borderColor: 'border-accent-200',
                  shortDesc: 'Aptitude Practice Domain',
                };
                const IconComponent = meta.icon;
                const goalPercent = Math.min(
                  100,
                  Math.round((dom.todayQuestionsCompleted / dom.dailyGoal) * 100)
                );

                return (
                  <motion.div
                    key={dom.domain}
                    whileHover={{ y: -3 }}
                    transition={{ duration: 0.2 }}
                    className="bg-white rounded-2xl border border-[#E2E8F0] hover:border-accent-600 shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
                  >
                    {/* Card Header Banner */}
                    <div className="p-5 border-b border-[#E2E8F0] space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className={`w-11 h-11 rounded-xl ${meta.bgColor} ${meta.color} flex items-center justify-center border ${meta.borderColor} shadow-xs`}>
                          <IconComponent size={22} />
                        </div>

                        <div className="flex flex-col items-end gap-1">
                          {/* Streak Pill */}
                          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${
                            dom.currentStreak > 0
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                          }`}>
                            <Flame size={13} className={dom.currentStreak > 0 ? 'fill-white' : 'text-[#64748B]'} />
                            <span>{dom.currentStreak} Day{dom.currentStreak !== 1 ? 's' : ''} Streak</span>
                          </div>
                          <span className="text-[10px] text-[#64748B]">Best: {dom.longestStreak} Days</span>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-[#172033] group-hover:text-accent-600 transition-colors">
                          {dom.domain}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-0.5 line-clamp-1">
                          {meta.shortDesc}
                        </p>
                      </div>
                    </div>

                    {/* Card Body: Progress & Accuracy */}
                    <div className="p-5 space-y-4">
                      {/* Daily Goal Status */}
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-[#172033] flex items-center gap-1">
                            {dom.isCompletedToday ? (
                              <span className="text-emerald-600 flex items-center gap-1 font-bold">
                                <CheckCircle2 size={13} /> Today's Goal Met!
                              </span>
                            ) : (
                              <span>Daily Goal: {dom.todayQuestionsCompleted} / {dom.dailyGoal} questions</span>
                            )}
                          </span>
                          <span className="text-[#64748B] font-mono">{goalPercent}%</span>
                        </div>
                        <ProgressBar
                          value={goalPercent}
                          color={dom.isCompletedToday ? 'success' : 'accent'}
                          size="sm"
                        />
                      </div>

                      {/* Stat Metrics Row */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2E8F0]/70 text-xs">
                        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block">Solved</span>
                          <span className="text-sm font-black text-[#172033]">
                            {dom.totalAnswered}{' '}
                            <span className="text-[10px] font-normal text-[#64748B]">
                              / {dom.totalAvailable}
                            </span>
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                          <span className="text-[10px] text-[#64748B] uppercase font-bold block">Accuracy</span>
                          <span className="text-sm font-black text-emerald-600">
                            {dom.accuracy}%
                          </span>
                        </div>
                      </div>

                      {/* Un-answered Questions Tag */}
                      <div className="flex items-center justify-between text-xs pt-1">
                        <span className="text-[11px] text-[#64748B]">
                          {dom.remainingQuestions > 0 ? (
                            <span className="text-accent-600 font-semibold">
                              • {dom.remainingQuestions} un-answered questions
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-semibold">
                              ✓ Bank completed!
                            </span>
                          )}
                        </span>

                        {dom.remainingQuestions === 0 && (
                          <button
                            onClick={() => handleResetHistory(dom.domain)}
                            className="text-[10px] font-semibold text-accent-600 hover:underline flex items-center gap-1"
                          >
                            <RotateCcw size={10} /> Reset
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Footer Action */}
                    <div className="p-4 bg-[#F8FAFC] border-t border-[#E2E8F0]">
                      <Button
                        onClick={() => handleOpenConfig(dom.domain)}
                        className={`w-full text-xs font-semibold py-2 shadow-xs justify-center ${
                          dom.isCompletedToday
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-accent-600 hover:bg-accent-700 text-white'
                        }`}
                        rightIcon={<ArrowRight size={14} />}
                      >
                        {dom.isCompletedToday ? 'Practice Extra Sets' : 'Continue Practice'}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 4. PRACTICE LAUNCH MODAL ── */}
        <Modal
          isOpen={showConfigModal}
          onClose={() => setShowConfigModal(false)}
          title={`Practice: ${selectedDomain}`}
          size="md"
        >
          <div className="space-y-5 p-1 font-sans text-[#172033]">
            <p className="text-xs text-[#64748B]">
              Configure your daily practice session. Every question is guaranteed to be previously un-answered for your account.
            </p>

            {/* Difficulty Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                1. Select Difficulty Level
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setSelectedDifficulty(diff)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedDifficulty === diff
                        ? 'bg-accent-600 text-white border-accent-600 shadow-xs'
                        : 'bg-white border-[#E2E8F0] text-[#172033] hover:border-accent-300'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Count Selector */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-[#64748B] mb-2">
                2. Number of Questions
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSelectedCount(num)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      selectedCount === num
                        ? 'bg-accent-600 text-white border-accent-600 shadow-xs'
                        : 'bg-white border-[#E2E8F0] text-[#172033] hover:border-accent-300'
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>

            {/* Timer Options */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172033] flex items-center gap-1.5">
                  <Clock size={15} className="text-accent-600" />
                  Timed Exam Mode
                </span>
                <input
                  type="checkbox"
                  checked={isTimed}
                  onChange={(e) => setIsTimed(e.target.checked)}
                  className="rounded border-[#E2E8F0] text-accent-600 focus:ring-accent-500 h-4 w-4"
                />
              </div>

              {isTimed && (
                <div className="flex items-center gap-3 pt-1">
                  <span className="text-xs text-[#64748B] shrink-0">Duration:</span>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-lg border border-[#E2E8F0] bg-white text-xs font-semibold focus:outline-none"
                  >
                    <option value={10}>10 Minutes (Rapid Drill)</option>
                    <option value={15}>15 Minutes (Standard Speed)</option>
                    <option value={30}>30 Minutes (Comprehensive Exam)</option>
                  </select>
                </div>
              )}
            </div>

            {/* Launch Action */}
            <div className="pt-2">
              <Button
                onClick={handleStartPractice}
                disabled={isLaunchingPractice}
                className="w-full bg-accent-600 hover:bg-accent-700 text-white shadow-xs py-2.5 font-bold text-xs"
                rightIcon={isLaunchingPractice ? <RefreshCw size={15} className="animate-spin" /> : <Play size={15} />}
              >
                {isLaunchingPractice ? 'Fetching New Questions...' : `Start ${selectedDomain} Practice`}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER VIEW 2: ACTIVE PRACTICE RUNNER (No-Repeat Guaranteed)
  // ───────────────────────────────────────────────────────────────────────────
  if (view === 'practice') {
    // Question Bank Exhaustion State
    if (isExhausted) {
      return (
        <div className="max-w-2xl mx-auto py-12 px-4 font-sans text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-xs">
            <Award size={36} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
              Aptitude Bank Mastered!
            </h2>
            <p className="text-sm text-[#64748B] max-w-lg mx-auto">
              {exhaustedMessage}
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] max-w-md mx-auto text-left space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-accent-700">
              <ShieldCheck size={16} />
              Strict No-Repeat Guarantee
            </div>
            <p className="text-xs text-[#64748B]">
              SkillPilot AI never silently repeats answered questions. All previously answered question IDs remain recorded in your profile.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Button
              onClick={() => handleResetHistory(selectedDomain)}
              variant="outline"
              leftIcon={<RotateCcw size={15} />}
              className="text-xs font-semibold"
            >
              Reset {selectedDomain} History
            </Button>
            <Button
              onClick={() => setView('dashboard')}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold"
              leftIcon={<Compass size={15} />}
            >
              Back to Aptitude Hub
            </Button>
          </div>
        </div>
      );
    }

    if (!currentQ) {
      return (
        <div className="max-w-md mx-auto py-12 text-center space-y-4 font-sans">
          <div className="w-10 h-10 border-2 border-accent-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-[#64748B]">Loading your practice set...</p>
        </div>
      );
    }

    return (
      <div className="max-w-5xl mx-auto space-y-4 pb-12 font-sans text-[#172033]">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (window.confirm('Leave practice session? Unsubmitted answers will not be recorded.')) {
                  setView('dashboard');
                }
              }}
              className="p-1.5 rounded-lg hover:bg-[#F8FAFC] text-[#64748B] transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div>
              <span className="text-xs font-extrabold uppercase tracking-wider text-accent-600">
                {selectedDomain}
              </span>
              <p className="text-xs text-[#64748B]">
                Question {currentIdx + 1} of {practiceQuestions.length} • {currentQ.topic}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isTimed && (
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-mono font-bold ${
                  secondsLeft < 180
                    ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                    : 'bg-[#F8FAFC] border-[#E2E8F0] text-[#172033]'
                }`}
              >
                <Clock size={14} className={secondsLeft < 180 ? 'text-rose-600' : 'text-accent-600'} />
                <span>{formatTimer(secondsLeft)}</span>
              </div>
            )}

            <Button
              onClick={() => setShowConfirmSubmit(true)}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold px-4 py-2"
            >
              Submit Exam
            </Button>
          </div>
        </div>

        {/* Main Grid: Question Content & Navigator Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Question Card (Col 1-3) */}
          <div className="lg:col-span-3 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-6 flex flex-col justify-between min-h-115">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                  {currentQ.difficulty} Difficulty
                </span>
                <button
                  onClick={handleToggleFlag}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md transition-colors ${
                    flaggedForReview[currentQ.id]
                      ? 'bg-amber-100 text-amber-800 border border-amber-300'
                      : 'text-[#64748B] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <Flag size={13} className={flaggedForReview[currentQ.id] ? 'fill-amber-600 text-amber-600' : ''} />
                  <span>{flaggedForReview[currentQ.id] ? 'Flagged' : 'Flag for Review'}</span>
                </button>
              </div>

              {/* Question Text */}
              <h2 className="text-base sm:text-lg font-bold text-[#172033] leading-relaxed whitespace-pre-line">
                {currentQ.question}
              </h2>

              {/* Options List */}
              <div className="space-y-2.5 pt-2">
                {currentQ.options.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQ.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(optIdx)}
                      className={`w-full p-4 rounded-xl border text-left text-xs sm:text-sm transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-accent-600 bg-accent-50/50 text-accent-900 font-semibold ring-1 ring-accent-600 shadow-xs'
                          : 'border-[#E2E8F0] hover:border-[#CBD5E1] bg-white text-[#172033]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isSelected
                              ? 'bg-accent-600 text-white'
                              : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                          }`}
                        >
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <Check size={16} className="text-accent-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Question Controls */}
            <div className="pt-6 border-t border-[#E2E8F0] flex items-center justify-between gap-3">
              <button
                onClick={handleClearResponse}
                disabled={selectedAnswers[currentQ.id] === undefined}
                className="text-xs font-semibold text-[#64748B] hover:text-[#172033] disabled:opacity-30 disabled:pointer-events-none"
              >
                Clear Response
              </button>

              <div className="flex items-center gap-2">
                <Button
                  onClick={() => setCurrentIdx((p) => Math.max(0, p - 1))}
                  disabled={currentIdx === 0}
                  variant="outline"
                  size="sm"
                  leftIcon={<ChevronLeft size={16} />}
                  className="text-xs font-semibold"
                >
                  Previous
                </Button>
                {currentIdx < practiceQuestions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentIdx((p) => Math.min(practiceQuestions.length - 1, p + 1))}
                    size="sm"
                    className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold"
                    rightIcon={<ChevronRight size={16} />}
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    onClick={() => setShowConfirmSubmit(true)}
                    size="sm"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                    rightIcon={<Check size={16} />}
                  >
                    Finish
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Palette Sidebar (Col 4) */}
          <div className="bg-white p-5 rounded-2xl border border-[#E2E8F0] shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                Question Palette
              </h3>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                {answeredCount} of {practiceQuestions.length} answered
              </p>
            </div>

            {/* Grid of Numbered Tiles */}
            <div className="grid grid-cols-5 gap-2">
              {practiceQuestions.map((q, idx) => {
                const isAnswered = selectedAnswers[q.id] !== undefined;
                const isFlagged = flaggedForReview[q.id];
                const isCurrent = idx === currentIdx;

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIdx(idx)}
                    className={`h-9 rounded-lg font-bold text-xs flex items-center justify-center transition-all ${
                      isCurrent ? 'ring-2 ring-accent-600 ring-offset-1' : ''
                    } ${
                      isFlagged
                        ? 'bg-amber-100 text-amber-800 border border-amber-300'
                        : isAnswered
                        ? 'bg-accent-600 text-white'
                        : 'bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Palette Legend */}
            <div className="pt-4 border-t border-[#E2E8F0] space-y-1.5 text-[11px]">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-accent-600" />
                <span className="text-[#64748B]">Answered</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-amber-200 border border-amber-300" />
                <span className="text-[#64748B]">Flagged for review</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-sm bg-[#F8FAFC] border border-[#E2E8F0]" />
                <span className="text-[#64748B]">Not answered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Confirmation Modal */}
        <Modal
          isOpen={showConfirmSubmit}
          onClose={() => setShowConfirmSubmit(false)}
          title="Submit Daily Practice Exam?"
          size="sm"
        >
          <div className="space-y-4 p-1 font-sans text-[#172033]">
            <p className="text-xs text-[#64748B]">
              You have answered <strong className="text-[#172033]">{answeredCount}</strong> of{' '}
              <strong className="text-[#172033]">{practiceQuestions.length}</strong> questions.
              {answeredCount < practiceQuestions.length && (
                <span className="block mt-1 text-amber-600 font-semibold">
                  ⚠️ Unanswered questions will be scored as incorrect.
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowConfirmSubmit(false)}
                className="text-xs font-semibold"
              >
                Keep Practicing
              </Button>
              <Button
                size="sm"
                disabled={isSubmitting}
                onClick={handleFinalSubmit}
                className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold"
              >
                {isSubmitting ? 'Evaluating Answers...' : 'Confirm Submission'}
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // RENDER VIEW 3: PRACTICE RESULTS & EXPLANATIONS
  // ───────────────────────────────────────────────────────────────────────────
  if (view === 'results' && resultsData) {
    const isPassed = resultsData.percentage >= 60;

    return (
      <div className="max-w-4xl mx-auto space-y-6 pb-12 font-sans text-[#172033]">
        {/* Score Card Banner */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-accent-600">
                {resultsData.domain} Evaluation
              </span>
              <h2 className="text-2xl font-extrabold text-[#172033] tracking-tight">
                Practice Session Completed
              </h2>
              <p className="text-xs text-[#64748B]">
                Your answers have been verified and permanently recorded to ensure these questions do not repeat.
              </p>
            </div>

            {/* Score Pill */}
            <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-center min-w-35">
              <span className="text-[10px] uppercase font-bold text-[#64748B]">Final Score</span>
              <p className={`text-2xl font-black mt-0.5 ${isPassed ? 'text-emerald-600' : 'text-amber-600'}`}>
                {resultsData.correctCount} / {resultsData.totalAnswered}
              </p>
              <span className="text-xs font-bold text-[#64748B]">{resultsData.percentage}% Accuracy</span>
            </div>
          </div>

          {/* Streak Update Notification */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-900 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
                <Flame size={20} className="fill-white" />
              </span>
              <div>
                <h4 className="text-xs font-extrabold text-amber-950">
                  {resultsData.streak.isStreakExtendedToday
                    ? `🔥 Streak Extended: Now ${resultsData.streak.currentStreak} Days in ${resultsData.domain}!`
                    : `Active Streak: ${resultsData.streak.currentStreak} Days`}
                </h4>
                <p className="text-[11px] text-amber-800">
                  {resultsData.streak.isStreakExtendedToday
                    ? 'Congratulations! You achieved your daily goal for this domain today.'
                    : resultsData.dailyGoalAchieved
                    ? 'You have already met today’s streak requirement. Excellent extra practice!'
                    : `Complete ${resultsData.streak.dailyGoal - resultsData.streak.todayQuestionsCompleted} more questions to extend your streak today.`}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-amber-700 block">Best Record</span>
              <span className="text-xs font-black text-amber-950">{resultsData.streak.longestStreak} Days</span>
            </div>
          </div>

          {/* Action Row */}
          <div className="pt-2 flex flex-wrap items-center gap-3">
            <Button
              onClick={() => setView('dashboard')}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold"
              leftIcon={<Compass size={15} />}
            >
              Back to Aptitude Hub
            </Button>
            <Button
              onClick={() => handleOpenConfig(resultsData.domain)}
              variant="outline"
              className="text-xs font-semibold"
              rightIcon={<ArrowRight size={14} />}
            >
              Practice Another Set in {resultsData.domain}
            </Button>
          </div>
        </div>

        {/* Detailed Solutions Breakdown */}
        <div className="space-y-4">
          <h3 className="text-base font-bold text-[#172033]">
            Question Review & In-Depth Explanations
          </h3>

          <div className="space-y-4">
            {resultsData.results.map((res, idx) => (
              <div
                key={res.questionId}
                className={`p-5 rounded-2xl bg-white border shadow-xs space-y-4 ${
                  res.isCorrect ? 'border-emerald-200' : 'border-rose-200'
                }`}
              >
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-[#F8FAFC] text-[#64748B] border border-[#E2E8F0]">
                      Question {idx + 1} • {res.topic}
                    </span>
                    <span className="text-xs font-semibold text-[#64748B]">({res.difficulty})</span>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      res.isCorrect
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}
                  >
                    {res.isCorrect ? (
                      <>
                        <Check size={13} /> Correct (+1)
                      </>
                    ) : (
                      <>
                        <AlertCircle size={13} /> Incorrect (0)
                      </>
                    )}
                  </span>
                </div>

                {/* Question */}
                <p className="text-sm font-bold text-[#172033] leading-relaxed whitespace-pre-line">
                  {res.question}
                </p>

                {/* Options Review */}
                <div className="space-y-1.5 pt-1">
                  {res.options.map((opt, optIdx) => {
                    const isUserSelection = res.selectedOption === optIdx;
                    const isCorrectAnswer = res.correctIndex === optIdx;

                    let optionStyle = 'border-[#E2E8F0] bg-white text-[#64748B]';
                    if (isCorrectAnswer) {
                      optionStyle = 'border-emerald-300 bg-emerald-50/60 text-emerald-900 font-semibold';
                    } else if (isUserSelection && !res.isCorrect) {
                      optionStyle = 'border-rose-300 bg-rose-50/60 text-rose-900 font-semibold';
                    }

                    return (
                      <div
                        key={optIdx}
                        className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${optionStyle}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{String.fromCharCode(65 + optIdx)}.</span>
                          <span>{opt}</span>
                        </div>
                        {isCorrectAnswer && (
                          <span className="text-[10px] font-bold uppercase text-emerald-700">Correct Answer</span>
                        )}
                        {isUserSelection && !res.isCorrect && (
                          <span className="text-[10px] font-bold uppercase text-rose-700">Your Selection</span>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Explanation Box */}
                {res.explanation && (
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-1 text-xs">
                    <span className="font-bold text-[#172033] flex items-center gap-1.5">
                      <Sparkles size={13} className="text-accent-600" />
                      Step-by-Step Solution
                    </span>
                    <p className="text-[#64748B] leading-relaxed">{res.explanation}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}
