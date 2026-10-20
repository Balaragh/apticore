import { useState, useEffect } from 'react';
import {
  CheckCircle2, Circle, RotateCcw, ShieldCheck, Video, Mic, Wifi,
  FileText, Sparkles, Volume2, Coffee, Check
} from 'lucide-react';
import { getPrepChecklist, toggleChecklistItem, resetPrepChecklist } from '@/lib/storage';
import type { InterviewChecklistItem } from '@/types';
import toast from 'react-hot-toast';

interface PrepChecklistProps {
  compact?: boolean;
  onAllCompleted?: () => void;
}

export function PrepChecklist({ compact = false }: PrepChecklistProps) {
  const [checklist, setChecklist] = useState<InterviewChecklistItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<'all' | 'devices' | 'environment' | 'materials' | 'mindset'>('all');

  useEffect(() => {
    setChecklist(getPrepChecklist());
  }, []);

  const handleToggle = (id: string) => {
    const updated = toggleChecklistItem(id);
    setChecklist(updated);
  };

  const handleReset = () => {
    const reset = resetPrepChecklist();
    setChecklist(reset);
    toast.success('Checklist reset to defaults');
  };

  const completedCount = checklist.filter((item) => item.checked).length;
  const totalCount = checklist.length;
  const progressPercent = totalCount ? Math.round((completedCount / totalCount) * 100) : 0;

  const filteredItems = checklist.filter((item) => {
    if (activeCategory === 'all') return true;
    return item.category === activeCategory;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'devices':
        return <Video size={14} className="text-[#8A806F]" />;
      case 'environment':
        return <Wifi size={14} className="text-success-500" />;
      case 'materials':
        return <FileText size={14} className="text-[#202020] dark:text-surface-300" />;
      case 'mindset':
        return <Sparkles size={14} className="text-[#8A806F]" />;
      default:
        return <ShieldCheck size={14} className="text-surface-400" />;
    }
  };

  return (
    <div className="bg-white dark:bg-navy-900 border border-surface-200 dark:border-navy-700 rounded-xl overflow-hidden shadow-sm">
      {/* Header */}
      <div className="p-4 border-b border-surface-200 dark:border-navy-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-emerald-600 dark:text-emerald-400" />
            <h4 className="font-semibold text-sm sm:text-base text-navy-800 dark:text-white">
              Interview Readiness Checklist
            </h4>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">
              {completedCount} / {totalCount} ready
            </span>
          </div>
          {!compact && (
            <p className="text-xs text-surface-500 mt-1">
              Verify your equipment, lighting, and environment before launching your live video session.
            </p>
          )}
        </div>

        <button
          onClick={handleReset}
          className="text-xs text-surface-400 hover:text-navy-800 dark:hover:text-surface-200 flex items-center gap-1 self-start sm:self-auto"
          title="Reset checklist"
        >
          <RotateCcw size={13} />
          Reset
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-surface-100 dark:bg-navy-800 h-1.5">
        <div
          className="bg-emerald-500 h-1.5 transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Category Filter Pills (if not compact) */}
      {!compact && (
        <div className="px-4 py-2 border-b border-surface-100 dark:border-navy-800/80 flex items-center gap-1 overflow-x-auto text-xs">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'devices', label: 'Devices' },
            { id: 'environment', label: 'Environment' },
            { id: 'materials', label: 'Materials' },
            { id: 'mindset', label: 'Mindset' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                activeCategory === cat.id
                  ? 'bg-accent-50 dark:bg-accent-900/30 text-accent-700 dark:text-accent-400 font-semibold'
                  : 'text-surface-500 hover:text-navy-800 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Checklist items list */}
      <div className="divide-y divide-surface-100 dark:divide-navy-800/60 max-h-72 overflow-y-auto">
        {filteredItems.map((item) => (
          <div
            key={item.id}
            onClick={() => handleToggle(item.id)}
            className={`p-3 sm:px-4 flex items-start gap-3 cursor-pointer transition-colors ${
              item.checked
                ? 'bg-surface-50/50 dark:bg-navy-800/20'
                : 'hover:bg-surface-50 dark:hover:bg-navy-900'
            }`}
          >
            <button
              type="button"
              className="mt-0.5 shrink-0 text-surface-400 hover:text-emerald-500 focus:outline-none"
              aria-label={`Toggle ${item.title}`}
            >
              {item.checked ? (
                <CheckCircle2 size={18} className="text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
              ) : (
                <Circle size={18} className="text-surface-300 dark:text-navy-600" />
              )}
            </button>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="shrink-0">{getCategoryIcon(item.category)}</span>
                <p
                  className={`text-xs sm:text-sm font-medium ${
                    item.checked
                      ? 'text-surface-500 line-through dark:text-surface-400'
                      : 'text-navy-800 dark:text-white'
                  }`}
                >
                  {item.title}
                </p>
              </div>
              {!compact && (
                <p className="text-[11px] text-surface-500 mt-0.5 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
