import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
} from 'recharts';
import {
  Trophy, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, Download,
  BookOpen, ChevronDown, ChevronUp, Share2, Sparkles, MessageSquare,
  Shield, Star, Users, Calendar, Video, ArrowLeft
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/ui/progress-bar';
import { DEMO_FEEDBACK, DEMO_QUESTIONS } from '@/lib/mock-data';
import { getInterviewEvaluation, getInterviewByRoomCode } from '@/lib/scheduled-interviews';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

export default function InterviewFeedbackPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>('q1');

  // Check if this ID is a live meeting evaluation
  const liveEvaluation = id ? getInterviewEvaluation(id) : null;

  const feedback = DEMO_FEEDBACK;

  const radarData = [
    { subject: t('feedback.techAccuracy', 'Technical Accuracy'), score: feedback.technicalAccuracy, fullMark: 100 },
    { subject: t('feedback.relevance', 'Relevance to Rubric'), score: feedback.relevance, fullMark: 100 },
    { subject: t('feedback.communication', 'Communication & Clarity'), score: feedback.communication, fullMark: 100 },
    { subject: t('feedback.completeness', 'Completeness & Depth'), score: feedback.completeness, fullMark: 100 },
  ];

  const toggleExpand = (qId: string) => {
    setExpandedQuestion(expandedQuestion === qId ? null : qId);
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success-600';
    if (score >= 65) return 'text-warning-600';
    return 'text-error-600';
  };

  // ─── Case 1: Real Live Interview Evaluation ──────────────────────────────
  if (liveEvaluation) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-12 font-sans text-[#172033]">
        {/* Top Navigation & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
                {language === 'ta' ? 'அதிகாரப்பூர்வ மதிப்பீடு' : language === 'hi' ? 'आधिकारिक मूल्यांकन' : 'Official Interview Assessment'}
              </span>
              <span className="text-xs text-[#64748B] font-mono">Room: {liveEvaluation.roomCode}</span>
            </div>
            <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
              {language === 'ta' ? 'விண்ணப்பதாரர் மதிப்பீட்டு அறிக்கை' : language === 'hi' ? 'उम्मीदवार मूल्यांकन रिपोर्ट' : 'Candidate Evaluation Report'}
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
              Candidate: <strong className="text-[#172033]">{liveEvaluation.candidateName}</strong> • Role:{' '}
              <strong className="text-[#172033]">{liveEvaluation.role}</strong> • Evaluated by{' '}
              <strong className="text-[#172033]">{liveEvaluation.interviewerName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/interview/schedule')}
              className="text-xs flex items-center gap-1.5 bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
            >
              <ArrowLeft size={14} />
              {language === 'ta' ? 'அனைத்து நேர்காணல்கள்' : language === 'hi' ? 'सभी इंटरव्यू' : 'All Interviews'}
            </Button>
            <Button
              size="sm"
              onClick={() => navigate(`/interview/live/${liveEvaluation.roomCode}?role=interviewer`)}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs flex items-center gap-1.5 shadow-xs"
            >
              <Video size={14} />
              {language === 'ta' ? 'அறைக்கு மீண்டும் செல்' : language === 'hi' ? 'रूम में वापस जाएं' : 'Re-enter Room'}
            </Button>
          </div>
        </div>

        {/* Executive Summary Card with Recommendation */}
        <div className="bg-white rounded-2xl border border-[#E2E8F0] p-6 shadow-xs grid sm:grid-cols-12 gap-6 items-center">
          <div className="sm:col-span-8 space-y-2">
            <div className="flex items-center gap-3">
              <span
                className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                  liveEvaluation.recommendation === 'strong-hire'
                    ? 'bg-success-600/10 text-success-600 border border-success-600/30'
                    : liveEvaluation.recommendation === 'hire'
                    ? 'bg-accent-600/10 text-accent-600 border border-accent-600/30'
                    : liveEvaluation.recommendation === 'weak-hire'
                    ? 'bg-warning-600/10 text-warning-600 border border-warning-600/30'
                    : 'bg-error-600/10 text-error-600 border border-error-600/30'
                }`}
              >
                Recommendation: {liveEvaluation.recommendation.replace('-', ' ')}
              </span>
              <span className="text-xs text-[#64748B]">
                Submitted on {new Date(liveEvaluation.submittedAt).toLocaleDateString()}
              </span>
            </div>

            <h2 className="text-lg font-bold text-[#172033]">
              {language === 'ta' ? 'மதிப்பீட்டாளர் சுருக்கம்' : language === 'hi' ? 'साक्षात्कारकर्ता सारांश' : 'Interviewer Executive Narrative'}
            </h2>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              {liveEvaluation.publicFeedback}
            </p>
          </div>

          {/* Overall Composite Score */}
          <div className="sm:col-span-4 bg-[#F8FAFC] rounded-xl p-5 border border-[#E2E8F0] text-center space-y-1">
            <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
              {t('feedback.compositeRating', 'Composite Rating')}
            </span>
            <div className="text-4xl font-black text-[#172033] flex items-center justify-center gap-1">
              <span>{liveEvaluation.overallRating}</span>
              <span className="text-lg font-bold text-[#64748B]">/ 5.0</span>
            </div>
            <div className="flex justify-center gap-1 pt-1 text-warning-600">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  size={15}
                  fill={s <= Math.round(liveEvaluation.overallRating) ? 'currentColor' : 'none'}
                />
              ))}
            </div>
          </div>
        </div>

        {/* 3 Core Competency Scorecards */}
        <div className="grid sm:grid-cols-3 gap-4">
          <Card padding="md" className="space-y-2 bg-white border-[#E2E8F0] shadow-xs">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              {t('feedback.techAccuracy', 'Technical Knowledge')}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[#172033]">
                {liveEvaluation.technicalScore} / 5
              </span>
              <div className="flex text-warning-600">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    fill={s <= liveEvaluation.technicalScore ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
            <ProgressBar value={(liveEvaluation.technicalScore / 5) * 100} variant="accent" size="sm" />
            <p className="text-[11px] text-[#64748B]">Architecture foundations, framework internals & trade-offs.</p>
          </Card>

          <Card padding="md" className="space-y-2 bg-white border-[#E2E8F0] shadow-xs">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              {language === 'ta' ? 'சிக்கல் தீர்க்கும் திறன் & நிரலாக்கம்' : language === 'hi' ? 'समस्या निवारण एवं कोडिंग' : 'Problem Solving & Live Code'}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[#172033]">
                {liveEvaluation.problemSolvingScore} / 5
              </span>
              <div className="flex text-warning-600">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    fill={s <= liveEvaluation.problemSolvingScore ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
            <ProgressBar value={(liveEvaluation.problemSolvingScore / 5) * 100} variant="success" size="sm" />
            <p className="text-[11px] text-[#64748B]">Algorithm clarity, code hygiene, and edge-case handling.</p>
          </Card>

          <Card padding="md" className="space-y-2 bg-white border-[#E2E8F0] shadow-xs">
            <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">
              {t('feedback.communication', 'Communication & Articulation')}
            </span>
            <div className="flex items-center justify-between">
              <span className="text-2xl font-black text-[#172033]">
                {liveEvaluation.communicationScore} / 5
              </span>
              <div className="flex text-warning-600">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={14}
                    fill={s <= liveEvaluation.communicationScore ? 'currentColor' : 'none'}
                  />
                ))}
              </div>
            </div>
            <ProgressBar value={(liveEvaluation.communicationScore / 5) * 100} variant="accent" size="sm" />
            <p className="text-[11px] text-[#64748B]">Active listening, structured thinking, and collaborative demeanor.</p>
          </Card>
        </div>

        {/* Strengths & Growth Areas */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
            <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2 mb-3">
              <CheckCircle2 size={16} className="text-success-600" />
              {t('feedback.strengthsTitle', 'Key Demonstrated Strengths')}
            </h3>
            <ul className="space-y-2.5">
              {liveEvaluation.strengths.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-[#172033]">
                  <span className="w-4 h-4 rounded-full bg-success-600/10 text-success-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-success-600/20">
                    ✓
                  </span>
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
            <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2 mb-3">
              <AlertTriangle size={16} className="text-warning-600" />
              {t('feedback.improvementsTitle', 'Targeted Growth Areas')}
            </h3>
            <ul className="space-y-2.5">
              {liveEvaluation.improvements.map((imp, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-[#172033]">
                  <span className="w-4 h-4 rounded-full bg-warning-600/10 text-warning-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-warning-600/20">
                    !
                  </span>
                  <span>{imp}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        {/* Confidential Internal Hiring Notes */}
        {liveEvaluation.confidentialNotes && (
          <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl p-5 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-[#172033] flex items-center gap-2">
                <Shield size={14} className="text-[#64748B]" />
                Confidential Interviewer Deliberations
              </h4>
              <span className="text-[10px] text-[#64748B] font-semibold uppercase tracking-wider">
                Internal Hiring Team Record
              </span>
            </div>
            <p className="text-xs text-[#64748B] italic leading-relaxed">
              "{liveEvaluation.confidentialNotes}"
            </p>
          </div>
        )}
      </div>
    );
  }

  // ─── Case 2: Standard Practice Simulation Performance Report ─────────────
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans text-[#172033]">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-accent-600/10 text-accent-600 border border-accent-600/20">
              {t('feedback.sessionReport', 'Practice Simulation Report')}
            </span>
            <span className="text-xs text-[#64748B]">Session ID: {id || 's1-practice'}</span>
          </div>
          <h1 className="text-2xl font-bold text-[#172033] tracking-tight">
            {t('feedback.reportTitle', 'Interview Performance Report')}
          </h1>
          <p className="text-[#64748B] text-xs sm:text-sm mt-0.5">
            Role: <strong className="text-[#172033]">Frontend Developer</strong> • Evaluated on{' '}
            {new Date().toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/interview/schedule')}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
          >
            {t('feedback.liveRooms', 'Live Interview Rooms')}
          </Button>
          <Button
            size="sm"
            className="text-xs bg-accent-600 hover:bg-accent-700 text-white shadow-xs"
            leftIcon={<RefreshCw size={14} />}
            onClick={() => navigate('/interview/setup')}
          >
            {t('feedback.retakeButton', 'Retake Practice')}
          </Button>
        </div>
      </div>

      {/* Hero Score & Competency Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Overall Score Card */}
        <Card padding="lg" className="lg:col-span-5 flex flex-col justify-between bg-white border-[#E2E8F0] shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">
                {t('feedback.scoreLabel', 'Evaluation Score')}
              </span>
              <Badge variant="success" size="md">
                {language === 'ta' ? 'சிறந்த தகுதி' : language === 'hi' ? 'उत्कृष्ट उम्मीदवार' : 'Strong Candidate'}
              </Badge>
            </div>

            <div className="mt-4 flex items-baseline gap-3">
              <span className={`text-6xl font-black tracking-tight ${getScoreColor(feedback.overallScore)}`}>
                {feedback.overallScore}
              </span>
              <span className="text-xl font-bold text-[#64748B]">/ 100</span>
            </div>

            <p className="text-xs text-[#64748B] mt-2">
              {t('feedback.benchmarkNotice', 'Performance benchmark places you in the Top 18% of candidates evaluated.')}
            </p>
          </div>

          <div className="mt-6 pt-5 border-t border-[#E2E8F0] space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B]">{t('feedback.techAccuracy', 'Technical Accuracy')}</span>
                <span className="font-bold text-[#172033]">{feedback.technicalAccuracy}%</span>
              </div>
              <ProgressBar value={feedback.technicalAccuracy} variant="accent" size="sm" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B]">{t('feedback.relevance', 'Relevance to Rubric')}</span>
                <span className="font-bold text-[#172033]">{feedback.relevance}%</span>
              </div>
              <ProgressBar value={feedback.relevance} variant="success" size="sm" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B]">{t('feedback.communication', 'Communication & Clarity')}</span>
                <span className="font-bold text-[#172033]">{feedback.communication}%</span>
              </div>
              <ProgressBar value={feedback.communication} variant="accent" size="sm" />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[#64748B]">{t('feedback.completeness', 'Completeness & Depth')}</span>
                <span className="font-bold text-[#172033]">{feedback.completeness}%</span>
              </div>
              <ProgressBar value={feedback.completeness} variant="warning" size="sm" />
            </div>
          </div>
        </Card>

        {/* Competency Radar Chart */}
        <Card padding="lg" className="lg:col-span-7 flex flex-col justify-between bg-white border-[#E2E8F0] shadow-xs">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-sm font-bold flex items-center justify-between text-[#172033]">
              <span>{t('feedback.radarTitle', 'Competency Radar Breakdown')}</span>
              <span className="text-xs font-normal text-[#64748B]">Benchmark: 70% threshold</span>
            </CardTitle>
          </CardHeader>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#E2E8F0" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748B', fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#E2E8F0" />
                <Radar
                  name="Score"
                  dataKey="score"
                  stroke="#4F46E5"
                  fill="#4F46E5"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#E2E8F0] text-center">
            {radarData.map((d) => (
              <div key={d.subject} className="p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                <p className="text-[10px] text-[#64748B] truncate">{d.subject}</p>
                <p className="text-sm font-bold text-[#172033] mt-0.5">{d.score}%</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Strengths & Improvement Areas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
          <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2 mb-3">
            <CheckCircle2 size={16} className="text-success-600" />
            {t('feedback.strengthsTitle', 'Demonstrated Strengths')}
          </h3>
          <ul className="space-y-2.5">
            {feedback.strengths.map((str, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-[#172033]">
                <span className="w-5 h-5 rounded-md bg-success-600/10 text-success-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-success-600/20">
                  ✓
                </span>
                <span>{str}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
          <h3 className="font-bold text-sm text-[#172033] flex items-center gap-2 mb-3">
            <AlertTriangle size={16} className="text-warning-600" />
            {t('feedback.improvementsTitle', 'High-Impact Growth Areas')}
          </h3>
          <ul className="space-y-2.5">
            {feedback.improvements.map((imp, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-[#172033]">
                <span className="w-5 h-5 rounded-md bg-warning-600/10 text-warning-600 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5 border border-warning-600/20">
                  !
                </span>
                <span>{imp}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Question-by-Question Deep Dive */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-[#172033] flex items-center gap-2">
          <MessageSquare size={18} className="text-accent-600" />
          {t('feedback.rubricBreakdown', 'Question Breakdown & Graded Rubrics')}
        </h3>

        {feedback.questionFeedback.map((qf, index) => {
          const originalQ = DEMO_QUESTIONS.find((q) => q.id === qf.questionId) || DEMO_QUESTIONS[0];
          const isExpanded = expandedQuestion === qf.questionId;

          return (
            <Card key={qf.questionId} padding="md" className="overflow-hidden bg-white border-[#E2E8F0] shadow-xs">
              <button
                onClick={() => toggleExpand(qf.questionId)}
                className="w-full flex items-center justify-between text-left gap-4"
              >
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] font-bold text-xs flex items-center justify-center text-[#172033] shrink-0">
                    Q{index + 1}
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#172033] line-clamp-1">
                      {originalQ.text}
                    </h4>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-[#64748B]">
                      <span>{originalQ.topic}</span>
                      <span>•</span>
                      <Badge variant={originalQ.difficulty === 'hard' ? 'error' : 'warning'} size="sm">
                        {originalQ.difficulty}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-sm font-bold text-[#172033]">{qf.score}%</span>
                    <p className="text-[10px] text-[#64748B]">Score</p>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-[#64748B]" /> : <ChevronDown size={16} className="text-[#64748B]" />}
                </div>
              </button>

              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-[#E2E8F0] space-y-4">
                  <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs">
                    <p className="font-bold text-[#172033] mb-1">
                      Rubric Assessment:
                    </p>
                    <p className="text-[#64748B] leading-relaxed">
                      {qf.feedback}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-success-600/20">
                      <p className="font-bold text-success-600 mb-1.5 flex items-center gap-1.5">
                        <CheckCircle2 size={13} /> {t('feedback.pointsCovered', 'Key Points Covered')}:
                      </p>
                      <ul className="space-y-1 text-[#64748B] list-disc list-inside">
                        {qf.keyPointsCovered.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-warning-600/20">
                      <p className="font-bold text-warning-600 mb-1.5 flex items-center gap-1.5">
                        <AlertTriangle size={13} /> {t('feedback.missedPoints', 'Missed Critical Points')}:
                      </p>
                      <ul className="space-y-1 text-[#64748B] list-disc list-inside">
                        {qf.missedPoints.map((pt, pIdx) => (
                          <li key={pIdx}>{pt}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
