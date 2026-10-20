interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'accent' | 'success' | 'warning' | 'error';
  variant?: 'accent' | 'success' | 'warning' | 'error';
  showLabel?: boolean;
  className?: string;
}

const colorClasses = {
  accent:  'bg-accent-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  error:   'bg-error-600',
};

const heightClasses = {
  sm: 'h-1.5',
  md: 'h-2',
  lg: 'h-3',
};

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'accent',
  variant,
  showLabel = false,
  className = '',
}: ProgressBarProps) {
  const activeColor = variant || color;
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={`w-full ${className}`}>
      {showLabel && (
        <div className="flex justify-between text-xs mb-1 text-[#64748B]">
          <span>Progress</span>
          <span className="font-semibold text-[#172033]">{Math.round(pct)}%</span>
        </div>
      )}
      <div className={`w-full bg-[#E2E8F0] rounded-full overflow-hidden ${heightClasses[size]}`}>
        <div
          className={`${colorClasses[activeColor]} ${heightClasses[size]} rounded-full transition-all duration-300`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
