import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const { forgotPassword } = useAuth();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await forgotPassword(data.email);
      setSent(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 font-sans text-[#172033] relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-8">
        <LanguageSelector variant="header" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block"><Logo size="lg" /></Link>
        </div>

        {sent ? (
          <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-success-600/10 flex items-center justify-center mx-auto mb-2 border border-success-600/20">
              <CheckCircle2 size={32} className="text-success-600" />
            </div>
            <h2 className="text-xl font-bold text-[#172033]">{t('auth.forgotTitle', 'Check your email')}</h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {t('auth.forgotSubtitle', 'If an account with that email exists, we have sent instructions to reset your password.')}
            </p>
            <div className="pt-3">
              <Link to="/login">
                <Button variant="outline" size="sm" leftIcon={<ArrowLeft size={15} />} className="text-xs bg-white border-[#E2E8F0] text-[#172033] hover:bg-[#F8FAFC]">
                  {t('auth.backToLogin', 'Back to Sign In')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-accent-600/10 flex items-center justify-center mx-auto mb-3 border border-accent-600/20">
                <Mail size={24} className="text-accent-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#172033]">{t('auth.forgotTitle', 'Forgot your password?')}</h1>
              <p className="mt-1 text-xs text-[#64748B]">{t('auth.forgotSubtitle', "Enter your email and we'll send a secure password reset link.")}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-7 space-y-4">
              <Input
                label={t('auth.emailLabel', 'Email Address')}
                type="email"
                placeholder={t('auth.emailPlaceholder', 'you@example.com')}
                error={errors.email?.message}
                className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
                {...register('email')}
              />
              <Button
                type="submit"
                className="w-full bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold py-2.5 shadow-xs"
                isLoading={isSubmitting}
              >
                {t('auth.sendResetLink', 'Send Reset Link')}
              </Button>
            </form>

            <p className="text-center mt-6 text-xs text-[#64748B]">
              <Link to="/login" className="text-accent-600 hover:underline font-semibold flex items-center justify-center gap-1">
                <ArrowLeft size={14} /> {t('auth.backToLogin', 'Back to Sign In')}
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
