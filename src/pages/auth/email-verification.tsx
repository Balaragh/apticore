import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';

export default function EmailVerificationPage() {
  const [searchParams] = useSearchParams();
  const status = searchParams.get('status') || 'pending';

  const states = {
    success: {
      icon: <CheckCircle2 size={36} className="text-success-600" />,
      bg: 'bg-success-600/10 border border-success-600/20',
      title: 'Email Verified',
      message: 'Your email address has been verified. You can now access all features of AptiCore.',
    },
    error: {
      icon: <XCircle size={36} className="text-error-600" />,
      bg: 'bg-error-600/10 border border-error-600/20',
      title: 'Verification Failed',
      message: 'The verification link is invalid or has expired. Please request a new verification link.',
    },
    pending: {
      icon: <Clock size={36} className="text-warning-600" />,
      bg: 'bg-warning-600/10 border border-warning-600/20',
      title: 'Verify Your Email',
      message: 'We sent a verification email. Please check your inbox and click the link to activate your candidate profile.',
    },
  };

  const s = states[status as keyof typeof states] || states.pending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 font-sans text-[#172033]">
      <div className="w-full max-w-md text-center">
        <Link to="/" className="inline-block mb-8"><Logo size="lg" /></Link>

        <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-8 space-y-4">
          <div className={`w-16 h-16 rounded-full ${s.bg} flex items-center justify-center mx-auto mb-2`}>
            {s.icon}
          </div>
          <h1 className="text-xl font-bold text-[#172033]">{s.title}</h1>
          <p className="text-xs text-[#64748B] leading-relaxed max-w-xs mx-auto">{s.message}</p>

          <div className="pt-2">
            {status === 'success' ? (
              <Link to="/dashboard">
                <Button size="sm" className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
                  Go to Dashboard
                </Button>
              </Link>
            ) : status === 'error' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toast.success('New verification link dispatched to your email!')}
                className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
              >
                Resend Verification Email
              </Button>
            ) : (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toast.success('Verification email resent!')}
                  className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]"
                >
                  Resend Verification Email
                </Button>
                <p className="text-[11px] text-[#64748B]">Didn't receive it? Please check your spam folder.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
