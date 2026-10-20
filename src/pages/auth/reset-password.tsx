import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, CheckCircle2, Lock } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

const schema = z.object({
  password: z.string().min(8, 'Minimum 8 characters').regex(/[A-Z]/, 'Must contain uppercase').regex(/[0-9]/, 'Must contain a number'),
  confirmPassword: z.string(),
}).refine(d => d.password === d.confirmPassword, { message: "Passwords don't match", path: ['confirmPassword'] });

export default function ResetPasswordPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const { resetPassword } = useAuth();
  const { t } = useLanguage();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: z.infer<typeof schema>) => {
    try {
      await resetPassword(token, data.password);
      setDone(true);
      toast.success('Password reset successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Reset failed');
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

        {done ? (
          <div className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-8 text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-success-600/10 flex items-center justify-center mx-auto mb-2 border border-success-600/20">
              <CheckCircle2 size={32} className="text-success-600" />
            </div>
            <h2 className="text-xl font-bold text-[#172033]">{t('auth.resetTitle', 'Password Reset Complete')}</h2>
            <p className="text-xs text-[#64748B] leading-relaxed">
              {t('auth.resetSubtitle', 'Your password has been successfully updated. You can now sign in with your new credentials.')}
            </p>
            <div className="pt-3">
              <Link to="/login">
                <Button size="sm" className="bg-accent-600 hover:bg-accent-700 text-white text-xs">
                  {t('auth.signInHere', 'Sign In to AptiCore')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-full bg-accent-600/10 flex items-center justify-center mx-auto mb-3 border border-accent-600/20">
                <Lock size={24} className="text-accent-600" />
              </div>
              <h1 className="text-2xl font-bold text-[#172033]">{t('auth.resetTitle', 'Set new password')}</h1>
              <p className="mt-1 text-xs text-[#64748B]">{t('auth.resetSubtitle', 'Choose a strong password with letters and numbers.')}</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-7 space-y-4">
              <div className="relative">
                <Input
                  label={t('auth.newPasswordLabel', 'New Password')}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Min. 8 characters"
                  error={errors.password?.message}
                  className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-8 text-[#64748B] hover:text-[#172033]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              <Input
                label={t('auth.confirmPasswordLabel', 'Confirm Password')}
                type="password"
                placeholder={t('auth.confirmPasswordPlaceholder', 'Re-enter password')}
                error={errors.confirmPassword?.message}
                className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
                {...register('confirmPassword')}
              />

              <Button
                type="submit"
                className="w-full bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold py-2.5 shadow-xs"
                isLoading={isSubmitting}
              >
                {t('auth.updatePasswordButton', 'Update Password & Sign In')}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
