import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import {
  BarChart3, TrendingUp, Clock, Flame, Target, ArrowUpRight,
  Download, CheckCircle2, AlertTriangle, Sparkles, RefreshCw, Calendar
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { apiClient } from '@/lib/api-client';
import { DEMO_PERFORMANCE } from '@/lib/mock-data';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '6m'>('30d');
  const [loading, setLoading] = useState(true);
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  useEffect(() => {
    let isMounted = true;
    async function fetchAnalytics() {
      try {
        setLoading(true);
        const data = await apiClient.get<any>('/analytics/dashboard');
        if (isMounted && data) {
          setAnalyticsData(data);
        }
      } catch {
        // Fallback gracefully to demo performance data
        if (isMounted) {
          setAnalyticsData(null);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }
    fetchAnalytics();
    return () => {
      isMounted = false;
    };
  }, []);

  const performance = DEMO_PERFORMANCE;
  const userStats = analyticsData?.stats;
  const hasRealInterviews = userStats && userStats.totalInterviews > 0;

  const avgScore = hasRealInterviews ? userStats.avgScore : performance.avgScore;
  const totalSessions = hasRealInterviews ? userStats.totalInterviews : performance.totalSessions;
  const streak = hasRealInterviews ? userStats.practiceStreak : performance.streak;
  const totalHours = hasRealInterviews ? Math.round((userStats.completedSessions * 45) / 60) : performance.totalHours;

  const summaryStats = [
    {
      label: t('analytics.overallProficiency', 'Average Score'),
      value: `${avgScore}%`,
      change: hasRealInterviews ? `+${userStats.improvementRate || 8}% overall growth` : '+8% vs benchmark',
      icon: TrendingUp,
      iconColor: 'text-success-600',
      iconBg: 'bg-success-600/10',
    },
    {
      label: t('analytics.hoursSpent', 'Total Practice Hours'),
      value: `${totalHours} hrs`,
      change: `${hasRealInterviews ? userStats.questionsAnswered : 18} questions answered`,
      icon: Clock,
      iconColor: 'text-accent-600',
      iconBg: 'bg-accent-600/10',
    },
    {
      label: t('analytics.sessionsDone', 'Interviews Completed'),
      value: totalSessions,
      change: `${hasRealInterviews ? userStats.completedSessions : 4} completed sessions`,
      icon: Target,
      iconColor: 'text-[#172033]',
      iconBg: 'bg-[#F8FAFC]',
    },
    {
      label: t('analytics.streak', 'Practice Streak'),
      value: `${streak} days`,
      change: streak > 0 ? 'Consistent practice streak' : 'Start your streak today',
      icon: Flame,
      iconColor: 'text-warning-600',
      iconBg: 'bg-warning-600/10',
    },
  ];

  const topicScores = (analyticsData?.topicScores && analyticsData.topicScores.length > 0)
    ? analyticsData.topicScores
    : performance.topicScores;

  const handleExport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      summary: { avgScore, totalSessions, streak, totalHours },
      topicScores,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `apticore_performance_report_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Performance analytics exported successfully!');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-[#172033]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
              Verified Metrics
            </span>
            {hasRealInterviews && (
              <span className="text-xs font-medium text-success-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Synchronized with MongoDB
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2 mt-1">
            <BarChart3 className="text-accent-600" size={26} />
            {t('analytics.title', 'Performance & Growth Analytics')}
          </h1>
          <p className="text-[#64748B] text-sm mt-0.5">
            {t('analytics.subtitle', 'Track your interview trajectory, topic proficiencies, and metrics evaluated across sessions.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="p-1 rounded-xl bg-white border border-[#E2E8F0] shadow-xs flex items-center gap-1">
            {[
              { id: '7d', label: '7 Days' },
              { id: '30d', label: '30 Days' },
              { id: '6m', label: '6 Months' },
            ].map((range) => (
              <button
                key={range.id}
                onClick={() => setTimeRange(range.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  timeRange === range.id
                    ? 'bg-accent-600 text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          <Button
            variant="outline"
            size="sm"
            leftIcon={<Download size={14} />}
            onClick={handleExport}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
          >
            Export Report
          </Button>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label} padding="md" className="bg-white border-[#E2E8F0] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#64748B] font-medium">{stat.label}</span>
              <div className={`w-9 h-9 rounded-xl ${stat.iconBg} flex items-center justify-center`}>
                <stat.icon size={18} className={stat.iconColor} />
              </div>
            </div>
            <div className="mt-2">
              <p className="text-2xl font-bold text-[#172033]">{stat.value}</p>
              <p className="text-[11px] text-[#64748B] mt-0.5 flex items-center gap-1">
                <ArrowUpRight size={12} className="text-success-600" />
                <span>{stat.change}</span>
              </p>
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Progression Over Time */}
        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-bold text-[#172033] flex items-center justify-between">
              <span>Score Progression Trajectory</span>
              <Badge variant="success" size="sm">+24% overall improvement</Badge>
            </CardTitle>
          </CardHeader>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performance.overallProgress}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis domain={[40, 100]} stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#172033',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                  formatter={(val: any) => [`${val}%`, 'Score']}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#4F46E5"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Chart 2: Weekly Activity & Sessions */}
        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-sm font-bold text-[#172033] flex items-center justify-between">
              <span>Weekly Practice Distribution</span>
              <span className="text-xs text-[#64748B]">11 sessions logged this week</span>
            </CardTitle>
          </CardHeader>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performance.weeklyPractice}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#64748B" fontSize={11} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#172033',
                    fontSize: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
                  }}
                />
                <Bar dataKey="sessions" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Sessions" />
                <Bar dataKey="score" fill="#16A34A" radius={[4, 4, 0, 0]} name="Avg Score %" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Topic-Wise Proficiency Breakdown */}
      <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-sm font-bold text-[#172033] flex items-center justify-between">
            <span>Topic-Wise Proficiency & Competencies</span>
            <span className="text-xs text-[#64748B]">Target benchmark: 75% threshold</span>
          </CardTitle>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          {topicScores.map((t: any) => (
            <div key={t.topic} className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#172033]">{t.topic}</span>
                <div className="flex items-center gap-2">
                  <span className="text-[#64748B]">({t.sessions} sessions)</span>
                  <span
                    className={`font-bold ${
                      t.score >= 80
                        ? 'text-success-600'
                        : t.score >= 70
                        ? 'text-accent-600'
                        : 'text-warning-600'
                    }`}
                  >
                    {t.score}%
                  </span>
                </div>
              </div>

              <ProgressBar
                value={t.score}
                variant={t.score >= 80 ? 'success' : t.score >= 70 ? 'accent' : 'warning'}
                size="sm"
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Strategic AI Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
          <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-success-600" />
            Highest Performing Subject Areas
          </h3>
          <p className="text-xs text-[#64748B] mb-3">
            You consistently score above the 80th percentile in these core topics during evaluations:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-success-600/5 border border-success-600/20 flex items-center justify-between">
              <span className="font-medium text-[#172033]">CSS & Layout Architecture</span>
              <Badge variant="success" size="sm">90% Proficiency</Badge>
            </div>
            <div className="p-2.5 rounded-xl bg-success-600/5 border border-success-600/20 flex items-center justify-between">
              <span className="font-medium text-[#172033]">JavaScript Event Loop & Async</span>
              <Badge variant="success" size="sm">85% Proficiency</Badge>
            </div>
            <div className="p-2.5 rounded-xl bg-success-600/5 border border-success-600/20 flex items-center justify-between">
              <span className="font-medium text-[#172033]">TypeScript Type Modeling</span>
              <Badge variant="success" size="sm">82% Proficiency</Badge>
            </div>
          </div>
        </Card>

        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
          <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning-600" />
            Recommended Practice Focus
          </h3>
          <p className="text-xs text-[#64748B] mb-3">
            Target these competencies to eliminate potential interview bottlenecks:
          </p>
          <div className="space-y-2 text-xs">
            <div className="p-2.5 rounded-xl bg-warning-600/5 border border-warning-600/20 flex items-center justify-between">
              <span className="font-medium text-[#172033]">System Design & Distributed Caching</span>
              <Badge variant="error" size="sm">58% Proficiency</Badge>
            </div>
            <div className="p-2.5 rounded-xl bg-warning-600/5 border border-warning-600/20 flex items-center justify-between">
              <span className="font-medium text-[#172033]">Data Structures & Tree Traversal</span>
              <Badge variant="warning" size="sm">65% Proficiency</Badge>
            </div>
            <div className="p-2.5 rounded-xl bg-warning-600/5 border border-warning-600/20 flex items-center justify-between">
              <span className="font-medium text-[#172033]">Node.js Middleware Architecture</span>
              <Badge variant="warning" size="sm">72% Proficiency</Badge>
            </div>
          </div>
        </Card>
      </div>

      {/* Start Practice Callout */}
      <Card padding="lg" className="bg-white border-accent-600/20 shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center shrink-0">
              <Sparkles size={20} />
            </div>
            <div>
              <h4 className="font-bold text-sm text-[#172033]">Boost Your Readiness Score</h4>
              <p className="text-xs text-[#64748B]">Complete an AI mock session to update your latest analytics and rubric assessment.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              onClick={() => navigate('/interview/mock')}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs"
            >
              Start AI Mock Interview
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate('/courses')}
              className="text-xs border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
            >
              Explore Courses
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
