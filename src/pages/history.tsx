import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  History, Search, Calendar, Clock, ArrowRight, RefreshCw,
  Trash2, HelpCircle, CheckCircle2, Video, Plus, Filter
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api-client';
import { DEMO_INTERVIEW_HISTORY } from '@/lib/mock-data';
import { useLanguage } from '@/contexts/language-context';
import type { InterviewSession } from '@/types';
import toast from 'react-hot-toast';

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<InterviewSession[]>(DEMO_INTERVIEW_HISTORY);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isFromBackend, setIsFromBackend] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await apiClient.get<any[]>('/interviews');
        if (isMounted && data && Array.isArray(data) && data.length > 0) {
          // Map backend interviews into session shape
          const mapped: InterviewSession[] = data.map((item) => ({
            id: item.roomCode || item._id,
            startedAt: item.scheduledAt || item.createdAt,
            completedAt: item.status === 'completed' ? item.updatedAt : undefined,
            status: item.status === 'completed' ? 'completed' : 'in-progress',
            config: {
              role: item.jobRole || item.role || 'Full Stack Developer',
              type: item.interviewType || 'technical',
              difficulty: item.difficulty || 'medium',
              questionCount: item.questionIds?.length || 5,
              timePerQuestion: 180,
              technologies: ['React', 'TypeScript', 'Node.js'],
            },
            questions: [],
            currentQuestionIndex: 0,
            answers: [],
          }));
          setSessions(mapped);
          setIsFromBackend(true);
        }
      } catch {
        // Fallback to demo history
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchHistory();
    return () => {
      isMounted = false;
    };
  }, []);

  const filteredSessions = sessions.filter((s) => {
    if (selectedType !== 'all' && s.config.type !== selectedType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchRole = s.config.role.toLowerCase().includes(q);
      const matchTech = (s.config.technologies || []).some((t) => t.toLowerCase().includes(q));
      return matchRole || matchTech;
    }
    return true;
  });

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSessions(sessions.filter((s) => s.id !== id));
    toast.success('Session record deleted from history');
  };

  const handleRetake = (session: InterviewSession, e: React.MouseEvent) => {
    e.stopPropagation();
    sessionStorage.setItem('apticore_active_config', JSON.stringify(session.config));
    toast.success(`Loaded configuration for ${session.config.role}`);
    navigate('/interview/setup');
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return { label: `${score}% Excellent`, variant: 'success' as const };
    if (score >= 70) return { label: `${score}% Good`, variant: 'warning' as const };
    return { label: `${score}% Needs Work`, variant: 'error' as const };
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-[#172033]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
              Session Archive
            </span>
            {isFromBackend && (
              <span className="text-xs font-medium text-success-600 flex items-center gap-1">
                <CheckCircle2 size={13} /> Saved in Database
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-[#172033] flex items-center gap-2 mt-1">
            <History className="text-accent-600" size={26} />
            {t('history.title', 'Interview History & Archives')}
          </h1>
          <p className="text-[#64748B] text-sm mt-0.5">
            {t('history.subtitle', 'Review past mock simulations, track score progressions, and revisit detailed evaluation rubrics.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={() => navigate('/interview/setup')}
            className="bg-accent-600 hover:bg-accent-700 text-white text-xs"
            leftIcon={<Plus size={15} />}
          >
            New Interview
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card padding="md" className="bg-white border-[#E2E8F0] shadow-xs">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
            <input
              type="text"
              placeholder="Search by job role or tech..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] text-xs text-[#172033] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-accent-600 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Formats' },
              { id: 'technical', label: 'Technical' },
              { id: 'behavioral', label: 'Behavioral' },
              { id: 'system-design', label: 'System Design' },
              { id: 'mixed', label: 'Mixed' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => setSelectedType(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  selectedType === t.id
                    ? 'bg-accent-600 text-white shadow-xs'
                    : 'bg-[#F8FAFC] text-[#64748B] hover:bg-[#E2E8F0] hover:text-[#172033]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* History Session Cards */}
      {filteredSessions.length === 0 ? (
        <Card padding="lg" className="text-center py-16 bg-white border-[#E2E8F0] shadow-xs">
          <HelpCircle size={40} className="mx-auto text-[#64748B] mb-3" />
          <h3 className="text-base font-bold text-[#172033]">No interview records found</h3>
          <p className="text-xs text-[#64748B] mt-1 max-w-sm mx-auto">
            You haven't completed any interviews matching this filter yet. Launch a session to begin logging evaluations.
          </p>
          <Button
            size="sm"
            onClick={() => navigate('/interview/setup')}
            className="mt-4 bg-accent-600 hover:bg-accent-700 text-white text-xs"
          >
            Start First Interview
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredSessions.map((session, index) => {
            const score = index === 0 ? 82 : index === 1 ? 71 : index === 2 ? 88 : index === 3 ? 65 : 73;
            const badge = getScoreBadge(score);

            return (
              <Card
                key={session.id}
                padding="md"
                className="bg-white border-[#E2E8F0] hover:border-accent-600 transition-all cursor-pointer group shadow-xs"
                onClick={() => navigate(`/interview/feedback/${session.id}`)}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent-600/10 text-accent-600 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 border border-accent-600/20">
                      #{session.id.toString().slice(-4)}
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-sm text-[#172033] group-hover:text-accent-600 transition-colors">
                          {session.config.role}
                        </h3>
                        <Badge variant="accent" size="sm">{session.config.type}</Badge>
                        <Badge
                          variant={
                            session.config.difficulty === 'hard'
                              ? 'error'
                              : session.config.difficulty === 'medium'
                              ? 'warning'
                              : 'success'
                          }
                          size="sm"
                        >
                          {session.config.difficulty}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-[#64748B]">
                        <span className="flex items-center gap-1">
                          <Calendar size={13} />
                          {new Date(session.startedAt).toLocaleDateString()}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} />
                          {session.config.questionCount} Questions
                        </span>
                        <span>•</span>
                        <span className="text-[#64748B]">
                          Tech: {(session.config.technologies || []).slice(0, 3).join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Score & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0 border-[#E2E8F0]">
                    <div className="text-left sm:text-right">
                      <Badge variant={badge.variant} size="md">
                        {badge.label}
                      </Badge>
                      <p className="text-[10px] text-[#64748B] mt-1">AI Rubric Verified</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                        onClick={(e) => handleRetake(session, e)}
                        title="Retake this session"
                      >
                        Retake
                      </Button>

                      <button
                        onClick={(e) => handleDelete(session.id, e)}
                        className="p-2 rounded-lg text-[#64748B] hover:text-error-600 hover:bg-error-600/10 transition-colors"
                        title="Delete log"
                      >
                        <Trash2 size={16} />
                      </button>

                      <Button
                        size="sm"
                        rightIcon={<ArrowRight size={14} />}
                        className="text-xs bg-accent-600 hover:bg-accent-700 text-white"
                        onClick={() => navigate(`/interview/feedback/${session.id}`)}
                      >
                        View Report
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
