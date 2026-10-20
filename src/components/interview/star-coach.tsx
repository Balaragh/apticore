import { useState } from 'react';
import { Sparkles, Copy, Check, Info, Lightbulb, ArrowRight, BookOpen } from 'lucide-react';
import type { STARAnswer } from '@/types';
import toast from 'react-hot-toast';

interface STARCoachProps {
  initialStar?: STARAnswer;
  onApplyStar?: (fullText: string) => void;
  sampleGuide?: {
    situation: string;
    task: string;
    action: string;
    result: string;
  };
  compact?: boolean;
}

const STAR_SECTIONS = [
  {
    key: 'situation' as const,
    label: 'Situation',
    letter: 'S',
    color: 'bg-accent-600/10 text-accent-600 border-accent-600/20',
    prompt: 'Set the scene. Where were you working, when was this, and what was the high-stakes context?',
    starter: 'While working as an engineer on our core payment platform during peak Q4 traffic...',
  },
  {
    key: 'task' as const,
    label: 'Task',
    letter: 'T',
    color: 'bg-accent-600/10 text-accent-600 border-accent-600/20',
    prompt: 'What was your specific responsibility? What challenge or objective were you tasked with overcoming?',
    starter: 'I was directly responsible for identifying the bottleneck and keeping API response times below 200ms...',
  },
  {
    key: 'action' as const,
    label: 'Action',
    letter: 'A',
    color: 'bg-success-600/10 text-success-600 border-success-600/20',
    prompt: 'What specific actions did YOU take? Highlight technical decisions, debugging steps, and leadership.',
    starter: 'I analyzed slow query logs, identified unindexed joins in Postgres, and implemented Redis caching...',
  },
  {
    key: 'result' as const,
    label: 'Result',
    letter: 'R',
    color: 'bg-success-600/10 text-success-600 border-success-600/20',
    prompt: 'What was the quantifiable business or technical outcome? What did you learn?',
    starter: 'As a result, we reduced query latency by 68%, eliminated customer checkout errors, and saved $25k...',
  },
];

export function STARCoach({
  initialStar,
  onApplyStar,
  sampleGuide,
  compact = false,
}: STARCoachProps) {
  const [starData, setStarData] = useState<STARAnswer>(
    initialStar || {
      situation: sampleGuide?.situation || '',
      task: sampleGuide?.task || '',
      action: sampleGuide?.action || '',
      result: sampleGuide?.result || '',
    }
  );
  const [activePillar, setActivePillar] = useState<'situation' | 'task' | 'action' | 'result'>('situation');
  const [copied, setCopied] = useState(false);

  const handleChange = (pillar: keyof STARAnswer, value: string) => {
    setStarData((prev) => ({ ...prev, [pillar]: value }));
  };

  const getCombinedText = () => {
    const parts = [
      starData.situation ? `Situation: ${starData.situation}` : '',
      starData.task ? `Task: ${starData.task}` : '',
      starData.action ? `Action: ${starData.action}` : '',
      starData.result ? `Result: ${starData.result}` : '',
    ].filter(Boolean);
    return parts.join('\n\n');
  };

  const handleCopy = () => {
    const text = getCombinedText();
    if (!text.trim()) {
      toast.error('STAR structure is currently empty');
      return;
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('STAR formatted answer copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApply = () => {
    const text = getCombinedText();
    if (onApplyStar) {
      onApplyStar(text);
      toast.success('Applied STAR answer into your answer notes!');
    }
  };

  const currentSection = STAR_SECTIONS.find((s) => s.key === activePillar)!;

  return (
    <div className="bg-white border border-[#E2E8F0] rounded-xl overflow-hidden shadow-xs font-sans text-[#172033]">
      {/* Header */}
      <div className="px-4 py-3 bg-[#F8FAFC] border-b border-[#E2E8F0] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-accent-600/10 text-accent-600 flex items-center justify-center font-bold text-xs border border-accent-600/20">
            STAR
          </div>
          <div>
            <h4 className="text-sm font-bold text-[#172033] flex items-center gap-1.5">
              STAR Answer Coach
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-accent-600/10 text-accent-600">
                Practice Guide
              </span>
            </h4>
            {!compact && (
              <p className="text-[11px] text-[#64748B]">
                Structure compelling behavioral stories: Situation, Task, Action, and Measurable Result.
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopy}
            className="p-1.5 rounded-lg text-[#64748B] hover:text-[#172033] hover:bg-white transition-colors text-xs flex items-center gap-1"
            title="Copy STAR structure"
          >
            {copied ? <Check size={14} className="text-success-600" /> : <Copy size={14} />}
            <span className="hidden sm:inline">Copy</span>
          </button>
          {onApplyStar && (
            <button
              onClick={handleApply}
              className="px-2.5 py-1 rounded-lg bg-accent-600 hover:bg-accent-700 text-white font-medium text-xs transition-colors flex items-center gap-1 shadow-xs"
            >
              Insert
            </button>
          )}
        </div>
      </div>

      {/* Pillar Tabs */}
      <div className="grid grid-cols-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
        {STAR_SECTIONS.map((sec) => {
          const hasContent = Boolean(starData[sec.key]?.trim());
          const isActive = activePillar === sec.key;
          return (
            <button
              key={sec.key}
              onClick={() => setActivePillar(sec.key)}
              className={`py-2 px-2 text-center transition-colors border-b-2 relative ${
                isActive
                  ? 'border-accent-600 text-accent-600 bg-white font-bold'
                  : 'border-transparent text-[#64748B] hover:text-[#172033]'
              }`}
            >
              <div className="flex items-center justify-center gap-1">
                <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-bold ${sec.color}`}>
                  {sec.letter}
                </span>
                <span className="text-xs truncate">{sec.label}</span>
                {hasContent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-success-600 shrink-0" />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Active Pillar Editor */}
      <div className="p-4 space-y-3">
        <div className="flex items-start gap-2 text-xs text-[#64748B] bg-[#F8FAFC] p-2.5 rounded-lg border border-[#E2E8F0]">
          <Info size={15} className="text-accent-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">{currentSection.prompt}</p>
        </div>

        <div>
          <textarea
            value={starData[activePillar] || ''}
            onChange={(e) => handleChange(activePillar, e.target.value)}
            placeholder={`Example: ${currentSection.starter}`}
            rows={compact ? 3 : 4}
            className="w-full text-xs sm:text-sm bg-white border border-[#E2E8F0] rounded-lg p-2.5 text-[#172033] placeholder-[#64748B] focus:outline-none focus:ring-1 focus:ring-accent-600 resize-none"
          />
          <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-1">
            <span>
              {(starData[activePillar] || '').length} characters
            </span>
            <button
              type="button"
              onClick={() => {
                const nextIdx = (STAR_SECTIONS.findIndex((s) => s.key === activePillar) + 1) % STAR_SECTIONS.length;
                setActivePillar(STAR_SECTIONS[nextIdx].key);
              }}
              className="text-accent-600 hover:underline flex items-center gap-1 font-semibold"
            >
              Next Pillar <ArrowRight size={12} />
            </button>
          </div>
        </div>

        {/* Sample Guidance Drawer if available */}
        {sampleGuide && (
          <div className="mt-2 pt-2 border-t border-[#E2E8F0]">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
                <Lightbulb size={12} className="text-warning-600" />
                Sample Answer Model:
              </span>
              <button
                type="button"
                onClick={() => {
                  setStarData({
                    situation: sampleGuide.situation,
                    task: sampleGuide.task,
                    action: sampleGuide.action,
                    result: sampleGuide.result,
                  });
                  toast.success('Loaded sample STAR answer model!');
                }}
                className="text-[11px] text-accent-600 hover:underline font-medium"
              >
                Use sample response
              </button>
            </div>
            <p className="text-[11px] text-[#64748B] italic mt-1 bg-[#F8FAFC] p-2 rounded border border-[#E2E8F0]">
              "{sampleGuide[activePillar]}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
