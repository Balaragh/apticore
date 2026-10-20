import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, Mic, MicOff, AlertCircle, ChevronRight, ChevronLeft, Sparkles,
  HelpCircle, CheckCircle2, Flag, Send, RefreshCw, Volume2, ShieldAlert
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { ProgressBar } from '@/components/ui/progress-bar';
import { DEMO_QUESTIONS } from '@/lib/mock-data';
import { STARCoach } from '@/components/interview/star-coach';
import { SelfReviewModal } from '@/components/interview/self-review-modal';
import { recordPracticeProgress } from '@/lib/storage';
import { useLanguage } from '@/contexts/language-context';
import { useVoice } from '@/contexts/voice-context';
import { createSpeechRecognizer, isSpeechRecognitionSupported, type SpeechRecognitionController } from '@/lib/speech';
import type { InterviewConfig, InterviewQuestion } from '@/types';
import toast from 'react-hot-toast';

export default function InterviewSessionPage() {
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { speak, stop, isSpeaking, voiceState } = useVoice();

  // Load config or fallback
  const [config, setConfig] = useState<InterviewConfig>(() => {
    const saved = sessionStorage.getItem('apticore_active_config');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      role: 'Frontend Developer',
      technologies: ['React', 'TypeScript', 'JavaScript'],
      difficulty: 'medium',
      type: 'technical',
      questionCount: 5,
      timePerQuestion: 180,
    };
  });

  const questions: InterviewQuestion[] = DEMO_QUESTIONS.slice(0, config.questionCount);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({
    q1: 'In React, the Virtual DOM is a lightweight JavaScript representation of the actual DOM in memory. When state updates occur, React computes the difference between the new and old virtual trees using the reconciliation algorithm (React Fiber), and efficiently batches minimum DOM updates to avoid expensive real DOM reflows.',
  });
  const [timeLeft, setTimeLeft] = useState(config.timePerQuestion);
  const [isTimerPaused, setIsTimerPaused] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<Record<number, boolean>>({});
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showSelfReviewModal, setShowSelfReviewModal] = useState(false);
  const [showStarCoach, setShowStarCoach] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const currentQuestion = questions[currentIndex] || questions[0];
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const recognizerRef = useRef<SpeechRecognitionController | null>(null);

  // Stop any active speech synthesis when leaving or changing question
  useEffect(() => {
    return () => {
      stop();
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isTimerPaused || isEvaluating) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          toast(language === 'ta' ? 'இந்தக் கேள்விக்கான நேரம் முடிவடைந்தது!' : language === 'hi' ? 'इस प्रश्न के लिए समय समाप्त!' : 'Time up for this question! Proceeding or wrap up your answer.', { icon: '⏳' });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, isTimerPaused, isEvaluating, language]);

  // Reset timer on question change
  const handleSelectQuestion = (index: number) => {
    stop();
    setCurrentIndex(index);
    setTimeLeft(config.timePerQuestion);
    setShowHint(false);
  };

  const handleTextChange = (text: string) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: text,
    }));
  };

  const toggleRecording = () => {
    if (!isRecording) {
      if (!isSpeechRecognitionSupported()) {
        toast.error(
          language === 'ta'
            ? 'உங்கள் உலாவியில் பேச்சு அறிதல் வசதி கிடைக்கவில்லை. தட்டச்சு செய்யலாம்.'
            : language === 'hi'
            ? 'आपके ब्राउज़र में स्पीच रिकग्निशन समर्थित नहीं है। कृपया टाइप करें।'
            : 'Speech recognition is not supported in this browser. Please type your response.'
        );
        return;
      }

      setIsRecording(true);
      toast.success(
        language === 'ta'
          ? 'மைக்ரோஃபோன் கேட்கிறது... (பேசுங்கள்)'
          : language === 'hi'
          ? 'माइक्रोफ़ोन सुन रहा है... (बोलें)'
          : 'Microphone listening... (Voice dictation active)'
      );

      recognizerRef.current = createSpeechRecognizer(
        (chunk, isFinal) => {
          if (isFinal) {
            setAnswers((prev) => {
              const existing = prev[currentQuestion.id] || '';
              return {
                ...prev,
                [currentQuestion.id]: existing ? `${existing} ${chunk.trim()}` : chunk.trim(),
              };
            });
          }
        },
        (err) => {
          setIsRecording(false);
          toast.error(err);
        },
        language
      );

      recognizerRef.current.start();
    } else {
      if (recognizerRef.current) {
        recognizerRef.current.stop();
      }
      setIsRecording(false);
      toast(language === 'ta' ? 'மைக்ரோஃபோன் நிறுத்தப்பட்டது.' : language === 'hi' ? 'माइक्रोफ़ोन रुका।' : 'Microphone paused.', { icon: '🛑' });
    }
  };

  const handleSpeakQuestion = () => {
    if (isSpeaking) {
      stop();
    } else {
      const qPrefix =
        language === 'ta'
          ? `கேள்வி ${currentIndex + 1}. `
          : language === 'hi'
          ? `प्रश्न ${currentIndex + 1}. `
          : `Question ${currentIndex + 1}. `;
      speak(`${qPrefix}${currentQuestion.text}`, language);
    }
  };

  const toggleFlag = () => {
    setFlaggedQuestions((prev) => ({
      ...prev,
      [currentIndex]: !prev[currentIndex],
    }));
  };

  const handleNext = () => {
    stop();
    if (currentIndex < questions.length - 1) {
      handleSelectQuestion(currentIndex + 1);
    } else {
      setShowFinishModal(true);
    }
  };

  const handlePrev = () => {
    stop();
    if (currentIndex > 0) {
      handleSelectQuestion(currentIndex - 1);
    }
  };

  const handleFinish = () => {
    setShowFinishModal(false);
    setIsEvaluating(true);
    stop();

    recordPracticeProgress(questions.length, Math.round(config.questionCount * 3));

    toast.loading(language === 'ta' ? 'பதில்கள் மதிப்பீடு செய்யப்படுகின்றன...' : language === 'hi' ? 'उत्तरों का मूल्यांकन किया जा रहा है...' : 'Analyzing responses against rubric criteria...', { duration: 1500 });

    setTimeout(() => {
      setIsEvaluating(false);
      navigate('/interview/feedback/session-mock-latest');
    }, 1800);
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const currentAnswer = answers[currentQuestion.id] || '';
  const wordCount = currentAnswer.trim() ? currentAnswer.trim().split(/\s+/).length : 0;
  const answeredCount = Object.keys(answers).filter((k) => (answers[k] || '').trim().length > 0).length;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pb-16 font-sans text-[#172033]">
      {/* Top Bar with Timer and Progress */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-[#E2E8F0] shadow-xs">
        <div className="flex items-center gap-3">
          <Badge variant="accent" size="md">{config.role}</Badge>
          <span className="text-xs text-[#64748B]">
            {t('interviewSession.questionNum', 'Question')} <strong className="text-[#172033]">{currentIndex + 1}</strong> / {questions.length}
          </span>
          <span className="text-xs text-[#64748B]">({answeredCount} {t('interviewSession.answeredCount', 'Answered')})</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Timer Display */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
              timeLeft < 30
                ? 'bg-error-600/10 text-error-600 border-error-600/30 animate-pulse'
                : 'bg-[#F8FAFC] text-[#172033] border-[#E2E8F0]'
            }`}
          >
            <Clock size={14} className={timeLeft < 30 ? 'text-error-600' : 'text-accent-600'} />
            <span>{formatTimer(timeLeft)}</span>
            <button
              onClick={() => setIsTimerPaused(!isTimerPaused)}
              className="ml-1 text-[10px] text-[#64748B] hover:text-[#172033] underline"
            >
              {isTimerPaused ? t('voice.resume', 'Resume') : t('voice.pause', 'Pause')}
            </button>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={toggleFlag}
            leftIcon={<Flag size={14} className={flaggedQuestions[currentIndex] ? 'fill-warning-600 text-warning-600' : 'text-[#64748B]'} />}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
          >
            {flaggedQuestions[currentIndex] ? t('interviewSession.flagged', 'Flagged') : t('interviewSession.flagQuestion', 'Flag')}
          </Button>

          <Button
            size="sm"
            onClick={() => setShowFinishModal(true)}
            className="bg-success-600 hover:bg-[#15803D] text-white text-xs shadow-xs"
          >
            {t('interviewSession.finishEarly', 'Finish Early')}
          </Button>
        </div>
      </div>

      {/* Question Selector Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {questions.map((q, idx) => {
          const isAnswered = (answers[q.id] || '').trim().length > 0;
          const isFlagged = flaggedQuestions[idx];
          const isCurrent = idx === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => handleSelectQuestion(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 transition-all flex items-center gap-1.5 border ${
                isCurrent
                  ? 'bg-accent-600 text-white border-accent-600 shadow-xs'
                  : isAnswered
                  ? 'bg-success-600/10 text-success-600 border-success-600/30'
                  : 'bg-white text-[#64748B] border-[#E2E8F0] hover:bg-[#F8FAFC]'
              }`}
            >
              <span>Q{idx + 1}</span>
              {isFlagged && <Flag size={10} className="fill-warning-600 text-warning-600" />}
              {isAnswered && !isCurrent && <CheckCircle2 size={12} className="text-success-600" />}
            </button>
          );
        })}
      </div>

      {/* Main Workspace Split: Question & Answer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column: Question Prompt & Hints */}
        <div className="lg:col-span-12 space-y-4">
          <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <Badge variant="accent" size="sm">{currentQuestion.topic}</Badge>
                <Badge variant={currentQuestion.difficulty === 'hard' ? 'error' : 'warning'} size="sm">
                  {currentQuestion.difficulty}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                {/* Sweet Friendly AI Voice Question Reader Button */}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSpeakQuestion}
                  leftIcon={
                    <Volume2
                      size={14}
                      className={isSpeaking ? 'text-accent-600 animate-pulse' : 'text-[#64748B]'}
                    />
                  }
                  className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                >
                  {isSpeaking ? t('voice.stop', 'Stop Speaking') : (language === 'ta' ? 'கேள்வியைக் கேளுங்கள்' : language === 'hi' ? 'प्रश्न सुनें' : 'Listen to Question')}
                </Button>

                <button
                  onClick={() => setShowHint(!showHint)}
                  className="text-xs font-medium text-accent-600 hover:underline flex items-center gap-1"
                >
                  <HelpCircle size={14} />
                  {showHint ? t('interviewSession.hideHint', 'Hide Guidance') : t('interviewSession.viewHint', 'View Question Hint')}
                </button>
              </div>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#172033] leading-snug">
              {currentQuestion.text}
            </h2>

            {/* Hint Box */}
            {showHint && currentQuestion.hints && (
              <div className="mt-4 p-3.5 rounded-xl bg-accent-600/5 border border-accent-600/20 text-xs text-[#172033] space-y-1">
                <p className="font-bold text-accent-600">{t('interviewSession.hintTitle', 'Interviewer Coaching Hint:')}</p>
                <ul className="list-disc list-inside space-y-0.5 text-[#64748B]">
                  {currentQuestion.hints.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>

          {/* Answer Editor Area */}
          <Card padding="lg" className="bg-white border-[#E2E8F0] shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#172033]">
                  {t('interviewSession.candidateResponse', 'Candidate Response')}
                </span>
                <span className="text-xs text-[#64748B]">
                  ({wordCount} {t('interviewSession.words', 'words')})
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleRecording}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isRecording
                      ? 'bg-error-600 text-white animate-pulse shadow-xs'
                      : 'bg-[#F8FAFC] border border-[#E2E8F0] text-[#172033] hover:bg-[#E2E8F0]'
                  }`}
                >
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} className="text-accent-600" />}
                  <span>{isRecording ? t('interviewSession.listening', 'Listening...') : t('interviewSession.voiceDictation', 'Voice Dictation')}</span>
                </button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowStarCoach(!showStarCoach)}
                  leftIcon={<Sparkles size={13} className="text-accent-600" />}
                  className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                >
                  {showStarCoach ? t('interviewSession.hideStarHelper', 'Hide STAR Helper') : t('interviewSession.showStarHelper', 'STAR Answer Guide')}
                </Button>
              </div>
            </div>

            {/* STAR Answer Framework Helper Drawer */}
            {showStarCoach && (
              <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-2">
                <h4 className="font-bold text-[#172033]">{t('interviewSession.showStarHelper', 'Recommended STAR Structure:')}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0]">
                    <span className="font-bold text-accent-600 block">S - Situation</span>
                    <span className="text-[11px] text-[#64748B]">{t('interviewSession.starSituation', 'Context, team size, challenge.')}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0]">
                    <span className="font-bold text-accent-600 block">T - Task</span>
                    <span className="text-[11px] text-[#64748B]">{t('interviewSession.starTask', 'Goal you personally owned.')}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0]">
                    <span className="font-bold text-accent-600 block">A - Action</span>
                    <span className="text-[11px] text-[#64748B]">{t('interviewSession.starAction', 'Tools, code, architectural decisions.')}</span>
                  </div>
                  <div className="p-2 rounded-lg bg-white border border-[#E2E8F0]">
                    <span className="font-bold text-accent-600 block">R - Result</span>
                    <span className="text-[11px] text-[#64748B]">{t('interviewSession.starResult', 'Metrics, outcomes, lessons learned.')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Textarea */}
            <textarea
              value={currentAnswer}
              onChange={(e) => handleTextChange(e.target.value)}
              placeholder={t('interviewSession.answerPlaceholder', "Type your structured answer here, or click 'Voice Dictation' to speak aloud...")}
              rows={8}
              className="w-full p-3.5 rounded-xl border border-[#E2E8F0] bg-white text-xs sm:text-sm text-[#172033] placeholder-[#64748B] focus:outline-none focus:ring-2 focus:ring-accent-600 leading-relaxed resize-none transition-all"
            />

            {/* Bottom Nav Buttons */}
            <div className="flex items-center justify-between pt-2 border-t border-[#E2E8F0]">
              <Button
                size="sm"
                variant="outline"
                onClick={handlePrev}
                disabled={currentIndex === 0}
                leftIcon={<ChevronLeft size={16} />}
                className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
              >
                {t('interviewSession.prevQuestion', 'Previous Question')}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleNext}
                  rightIcon={<ChevronRight size={16} />}
                  className="bg-accent-600 hover:bg-accent-700 text-white text-xs shadow-xs"
                >
                  {currentIndex === questions.length - 1 ? t('interviewSession.reviewSubmit', 'Review & Submit') : t('interviewSession.nextQuestion', 'Next Question')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Confirmation Finish Modal */}
      <Modal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        title={t('interviewSession.confirmFinishTitle', 'Complete Mock Interview Session?')}
      >
        <div className="space-y-4">
          <p className="text-xs text-[#64748B] leading-relaxed">
            {t('interviewSession.confirmFinishDesc', 'Your answers will be evaluated against real corporate scoring rubrics.')}
          </p>

          <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-[#64748B]">{t('interviewSession.answeredCount', 'Answered Questions')}:</span>
              <span className="font-bold text-success-600">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#64748B]">{t('interviewSession.unansweredCount', 'Unanswered Questions')}:</span>
              <span className="font-bold text-warning-600">{questions.length - answeredCount}</span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFinishModal(false)}
              className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
            >
              {t('interviewSession.continueAnswering', 'Continue Answering')}
            </Button>
            <Button
              size="sm"
              onClick={handleFinish}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs shadow-xs"
            >
              {t('interviewSession.submitAndGrade', 'Submit & Grade')}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
