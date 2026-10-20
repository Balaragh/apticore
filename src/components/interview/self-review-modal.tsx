import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Star, CheckCircle2, AlertTriangle, ArrowRight, Save, Clock,
  HelpCircle, Sparkles, BookOpen, RotateCcw, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveSelfReview, recordPracticeProgress } from '@/lib/storage';
import type { InterviewQuestion, SelfReview } from '@/types';
import toast from 'react-hot-toast';

interface SelfReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  role: string;
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  elapsedSeconds: number;
}

export function SelfReviewModal({
  isOpen,
  onClose,
  sessionId,
  role,
  questions,
  answers,
  elapsedSeconds,
}: SelfReviewModalProps) {
  const navigate = useNavigate();

  const [confidence, setConfidence] = useState<number>(4);
  const [clarity, setClarity] = useState<number>(4);
  const [difficulty, setDifficulty] = useState<number>(3);
  const [keyTakeaway, setKeyTakeaway] = useState<string>('');
  const [areasToImprove, setAreasToImprove] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const answeredCount = Object.keys(answers).filter((k) => (answers[k] || '').trim().length > 0).length;
  const unansweredCount = questions.length - answeredCount;
  const minutes = Math.max(1, Math.round(elapsedSeconds / 60));

  const handleSaveReview = () => {
    const review: SelfReview = {
      sessionId,
      confidence,
      clarity,
      difficulty,
      keyTakeaway: keyTakeaway.trim() || 'Reviewed fundamentals and practiced structured delivery under timed pressure.',
      areasToImprove: areasToImprove.trim() || 'Focus on concise STAR framing and deepening system edge cases.',
      savedAt: new Date().toISOString(),
    };

    saveSelfReview(review);
    recordPracticeProgress(answeredCount, minutes);
    setIsSaved(true);
    toast.success('Self-review and practice progress recorded!');
  };

  const handleNavigateFeedback = () => {
    handleSaveReview();
    navigate(`/interview/feedback/${sessionId}`);
  };

  const handleBackToDashboard = () => {
    handleSaveReview();
    navigate('/dashboard');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/75 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-white dark:bg-navy-900 rounded-2xl border border-surface-200 dark:border-navy-700 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-surface-200 dark:border-navy-700 bg-surface-50 dark:bg-navy-800/50 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-300">
                Practice Session Completed
              </span>
              <span className="text-xs text-surface-400">Target Role: {role}</span>
            </div>
            <h3 className="text-lg font-bold text-navy-800 dark:text-white mt-1">
              Session Summary & Self-Review
            </h3>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-surface-50 dark:bg-navy-800/50 border border-surface-200 dark:border-navy-700 text-center">
            <div>
              <p className="text-xs text-surface-500">Duration</p>
              <p className="text-lg font-bold text-navy-800 dark:text-white mt-0.5">
                {Math.floor(elapsedSeconds / 60)}m {elapsedSeconds % 60}s
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Answered</p>
              <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {answeredCount} of {questions.length}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Unanswered</p>
              <p className="text-lg font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                {unansweredCount}
              </p>
            </div>
          </div>

          {/* Self-Rating Sliders / Stars */}
          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-surface-500 dark:text-surface-400">
              Record Your Self-Evaluation
            </h4>

            {/* Confidence */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-navy-700">
              <div>
                <p className="text-sm font-medium text-navy-800 dark:text-white">Delivery Confidence</p>
                <p className="text-xs text-surface-500">How composed and sure did you feel speaking?</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setConfidence(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={20}
                      className={star <= confidence ? 'text-amber-400 fill-amber-400' : 'text-surface-300 dark:text-navy-600'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Clarity */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-navy-700">
              <div>
                <p className="text-sm font-medium text-navy-800 dark:text-white">Explanation Clarity</p>
                <p className="text-xs text-surface-500">Were your points crisp, structured, and easy to follow?</p>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setClarity(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      size={20}
                      className={star <= clarity ? 'text-accent-500 fill-accent-500' : 'text-surface-300 dark:text-navy-600'}
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Perceived Difficulty */}
            <div className="flex items-center justify-between p-3 rounded-lg border border-surface-200 dark:border-navy-700">
              <div>
                <p className="text-sm font-medium text-navy-800 dark:text-white">Perceived Difficulty</p>
                <p className="text-xs text-surface-500">How challenging were these questions for your current level?</p>
              </div>
              <div className="flex items-center gap-1.5 text-xs">
                {[
                  { val: 1, label: 'Easy' },
                  { val: 3, label: 'Moderate' },
                  { val: 5, label: 'Hard' },
                ].map((d) => (
                  <button
                    key={d.val}
                    type="button"
                    onClick={() => setDifficulty(d.val)}
                    className={`px-3 py-1 rounded-lg border transition-all ${
                      difficulty === d.val
                        ? 'bg-accent-600 text-white border-accent-600 font-semibold'
                        : 'border-surface-200 dark:border-navy-700 text-surface-600 dark:text-surface-300'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Self-Reflection Inputs */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-navy-700 dark:text-surface-300">
                Key Personal Takeaway (What went well?)
              </label>
              <input
                type="text"
                value={keyTakeaway}
                onChange={(e) => setKeyTakeaway(e.target.value)}
                placeholder="e.g. Good explanation of virtual DOM reconciliation and event loop"
                className="mt-1 w-full text-xs sm:text-sm bg-surface-50 dark:bg-navy-950 border border-surface-200 dark:border-navy-700 rounded-lg p-2.5 text-navy-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-navy-700 dark:text-surface-300">
                Focus Area for Next Practice Session
              </label>
              <input
                type="text"
                value={areasToImprove}
                onChange={(e) => setAreasToImprove(e.target.value)}
                placeholder="e.g. Structure behavioral answers using STAR method more strictly"
                className="mt-1 w-full text-xs sm:text-sm bg-surface-50 dark:bg-navy-950 border border-surface-200 dark:border-navy-700 rounded-lg p-2.5 text-navy-800 dark:text-surface-100 placeholder:text-surface-400 focus:outline-none focus:ring-1 focus:ring-accent-500"
              />
            </div>
          </div>

          {/* Transparent Notice */}
          <div className="p-3 rounded-lg bg-surface-50 dark:bg-navy-800/40 border border-surface-200/80 dark:border-navy-700/60 text-[11px] text-surface-500">
            <strong>Training Note:</strong> In this frontend simulation phase, self-reviews empower you to track genuine progress. When your backend evaluation service is connected, simulated metrics will be replaced with real-time speech and accuracy scoring.
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-200 dark:border-navy-700 bg-surface-50/50 dark:bg-navy-800/40 flex flex-col sm:flex-row items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleBackToDashboard}
          >
            Dashboard
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSaveReview}
              leftIcon={<Save size={15} />}
            >
              {isSaved ? 'Saved!' : 'Save Review'}
            </Button>
            <Button
              size="sm"
              onClick={handleNavigateFeedback}
              rightIcon={<ArrowRight size={15} />}
            >
              View Feedback Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
