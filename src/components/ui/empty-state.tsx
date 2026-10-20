import type { ReactNode } from 'react';
import { FileQuestion, AlertCircle, Inbox } from 'lucide-react';
import { Button } from './button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center font-sans text-[#172033]">
      <div className="w-16 h-16 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-center mb-4">
        {icon || <Inbox size={28} className="text-[#64748B]" />}
      </div>
      <h3 className="text-base font-bold text-[#172033] mb-1">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-md mb-5 leading-relaxed">{description}</p>
      {action && (
        <Button size="sm" onClick={action.onClick} className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
          {action.label}
        </Button>
      )}
    </div>
  );
}

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center font-sans text-[#172033]">
      <div className="w-16 h-16 rounded-2xl bg-error-600/10 border border-error-600/20 flex items-center justify-center mb-4">
        <AlertCircle size={28} className="text-error-600" />
      </div>
      <h3 className="text-base font-bold text-[#172033] mb-1">{title}</h3>
      <p className="text-xs text-[#64748B] max-w-md mb-5 leading-relaxed">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]">
          Try Again
        </Button>
      )}
    </div>
  );
}

export function NotFoundState() {
  return (
    <EmptyState
      icon={<FileQuestion size={28} className="text-[#64748B]" />}
      title="Page Not Found"
      description="The page you're looking for doesn't exist or has been moved."
    />
  );
}
