interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'neutral' | 'success' | 'warning' | 'error' | 'accent';
  size?: 'sm' | 'md';
  className?: string;
}

const variantClasses = {
  default: 'bg-surface-100 text-[#172033] border border-surface-200',
  neutral: 'bg-surface-100 text-[#64748B] border border-surface-200',
  success: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border border-amber-200',
  error:   'bg-red-50 text-red-700 border border-red-200',
  accent:  'bg-accent-50 text-accent-700 border border-accent-200',
};

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[11px] font-medium',
  md: 'px-2.5 py-1 text-xs font-semibold',
};

export function Badge({ children, variant = 'default', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center font-medium rounded-md ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}>
      {children}
    </span>
  );
}
