import { forwardRef, type InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#172033]">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`w-full px-3.5 py-2 rounded-lg border bg-white text-xs sm:text-sm text-[#172033] placeholder:text-surface-400 transition-colors focus:outline-none focus:ring-2 focus:ring-accent-600/20 focus:border-accent-600 ${
            error
              ? 'border-error-600'
              : 'border-surface-300'
          } ${className}`}
          {...props}
        />
        {error && <p className="text-xs text-error-600 font-medium">{error}</p>}
        {hint && !error && <p className="text-xs text-surface-500">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = 'Input';
