import { useState } from 'react';
import { Sparkles, Check, ArrowRight, Target, Briefcase, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { saveOnboardingProfile } from '@/lib/storage';
import type { InterviewType } from '@/types';
import toast from 'react-hot-toast';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ROLES = [
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Python Developer',
  'Java Developer',
  'Custom Role',
];

const INTERVIEW_TYPES: { type: InterviewType; label: string; desc: string }[] = [
  { type: 'technical', label: 'Technical & Architecture', desc: 'Framework internals, algorithms, and system design' },
  { type: 'behavioral', label: 'Behavioral & Leadership', desc: 'Conflict resolution, STAR stories, and team collaboration' },
  { type: 'mixed', label: 'Mixed Evaluation Round', desc: 'Balanced combination of technical questions and culture fit' },
];

const DAILY_GOALS = [
  { questions: 3, label: '3 questions/day (~15 mins) • Balanced' },
  { questions: 5, label: '5 questions/day (~30 mins) • Recommended' },
  { questions: 8, label: '8 questions/day (~45 mins) • Intensive Sprint' },
];

export function OnboardingModal({ isOpen, onClose }: OnboardingModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [targetRole, setTargetRole] = useState('Frontend Developer');
  const [customRole, setCustomRole] = useState('');
  const [preferredType, setPreferredType] = useState<InterviewType>('technical');
  const [dailyGoalChoice, setDailyGoalChoice] = useState(5);

  if (!isOpen) return null;

  const handleFinish = () => {
    const finalRole = targetRole === 'Custom Role' && customRole.trim() ? customRole.trim() : targetRole;
    saveOnboardingProfile({
      targetRole: finalRole,
      preferredInterviewType: preferredType,
      dailyQuestionGoal: dailyGoalChoice,
      completedOnboarding: true,
    });
    toast.success(`Preparation profile initialized for ${finalRole}!`);
    onClose();
  };

  const handleSkip = () => {
    saveOnboardingProfile({
      targetRole: 'Frontend Developer',
      preferredInterviewType: 'technical',
      dailyQuestionGoal: 5,
      completedOnboarding: true,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-xs font-sans text-[#172033]">
      <div className="w-full max-w-lg bg-white rounded-2xl border border-[#E2E8F0] shadow-xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-600/10 text-accent-600 flex items-center justify-center border border-accent-600/20">
              <Sparkles size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-[#172033]">
                Personalize Your Practice Path
              </h3>
              <p className="text-xs text-[#64748B]">Step {step} of 3 • Takes under 1 minute</p>
            </div>
          </div>
          <button
            onClick={handleSkip}
            className="text-xs text-[#64748B] hover:text-[#172033]"
          >
            Skip
          </button>
        </div>

        {/* Step Indicator */}
        <div className="w-full bg-[#E2E8F0] h-1">
          <div
            className="bg-accent-600 h-1 transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-4">
          {/* Step 1: Target Role */}
          {step === 1 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm text-[#172033] flex items-center gap-1.5">
                  <Briefcase size={16} className="text-accent-600" />
                  What role are you currently preparing for?
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  We will prioritize interview questions and roadmap topics for this specialty.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1">
                {ROLES.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => setTargetRole(role)}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-all ${
                      targetRole === role
                        ? 'border-accent-600 bg-accent-600/10 text-accent-600 ring-1 ring-accent-600'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-[#172033] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{role}</span>
                      {targetRole === role && <Check size={14} className="text-accent-600" />}
                    </div>
                  </button>
                ))}
              </div>

              {targetRole === 'Custom Role' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={customRole}
                    onChange={(e) => setCustomRole(e.target.value)}
                    placeholder="Enter custom title (e.g. iOS Engineer, DevOps)"
                    className="w-full text-xs p-2.5 rounded-lg border border-[#E2E8F0] bg-white text-[#172033] focus:outline-none focus:ring-1 focus:ring-accent-600"
                  />
                </div>
              )}
            </div>
          )}

          {/* Step 2: Preferred Interview Style */}
          {step === 2 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm text-[#172033] flex items-center gap-1.5">
                  <MessageSquare size={16} className="text-accent-600" />
                  What type of rounds do you want to train first?
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  You can change this anytime before every practice round.
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {INTERVIEW_TYPES.map((t) => (
                  <button
                    key={t.type}
                    type="button"
                    onClick={() => setPreferredType(t.type)}
                    className={`w-full p-3 rounded-xl border text-left text-xs transition-all ${
                      preferredType === t.type
                        ? 'border-accent-600 bg-accent-600/10 text-accent-600 ring-1 ring-accent-600'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-[#172033] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold">
                      <span>{t.label}</span>
                      {preferredType === t.type && <Check size={14} className="text-accent-600" />}
                    </div>
                    <p className="text-[11px] text-[#64748B] mt-0.5 font-normal">
                      {t.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Daily Practice Commitment */}
          {step === 3 && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm text-[#172033] flex items-center gap-1.5">
                  <Target size={16} className="text-accent-600" />
                  Set a daily practice goal
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Consistent small sessions lead to highest interview retention and confidence.
                </p>
              </div>

              <div className="space-y-2.5 pt-1">
                {DAILY_GOALS.map((g) => (
                  <button
                    key={g.questions}
                    type="button"
                    onClick={() => setDailyGoalChoice(g.questions)}
                    className={`w-full p-3.5 rounded-xl border text-left text-xs transition-all ${
                      dailyGoalChoice === g.questions
                        ? 'border-accent-600 bg-accent-600/10 text-accent-600 ring-1 ring-accent-600 font-bold'
                        : 'border-[#E2E8F0] hover:border-[#CBD5E1] text-[#172033] bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{g.label}</span>
                      {dailyGoalChoice === g.questions && <Check size={15} className="text-accent-600" />}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E2E8F0] bg-[#F8FAFC] flex items-center justify-between">
          {step > 1 ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
            >
              Back
            </Button>
          ) : (
            <button
              onClick={handleSkip}
              className="text-xs text-[#64748B] hover:text-[#172033]"
            >
              Set up later
            </button>
          )}

          {step < 3 ? (
            <Button
              size="sm"
              onClick={() => setStep((prev) => (prev + 1) as any)}
              rightIcon={<ArrowRight size={14} />}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs"
            >
              Continue
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={handleFinish}
              rightIcon={<Check size={14} />}
              className="bg-accent-600 hover:bg-accent-700 text-white text-xs"
            >
              Complete Setup
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
