import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Info, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});
type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data.email, data.password);
      toast.success(t('auth.loginTitle'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 font-sans text-[#172033] relative">
      {/* Top Language Switcher */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageSelector variant="header" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[#172033]">{t('auth.loginTitle')}</h1>
          <p className="mt-1 text-sm text-[#64748B]">{t('auth.loginSubtitle')}</p>
        </div>

        {IS_DEMO && (
          <div className="mb-6 p-4 bg-accent-600/5 rounded-xl border border-accent-600/20 flex gap-3 text-xs">
            <Info size={18} className="text-accent-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#172033]">{t('common.demoBadge')}</p>
              <p className="text-[#64748B] mt-0.5">
                Enter any valid email and password to explore AptiCore.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-7 space-y-4">
          <Input
            label={t('auth.emailLabel')}
            type="email"
            placeholder={t('auth.emailPlaceholder')}
            error={errors.email?.message}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
            {...register('email')}
          />

          <div className="relative">
            <Input
              label={t('auth.passwordLabel')}
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.passwordPlaceholder')}
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

          <div className="flex items-center justify-between text-xs pt-1">
            <label className="flex items-center gap-2 text-[#64748B] cursor-pointer">
              <input type="checkbox" className="rounded border-[#E2E8F0] text-accent-600 accent-accent-600" />
              {t('auth.rememberMe')}
            </label>
            <Link to="/forgot-password" className="text-accent-600 hover:underline font-semibold">
              {t('auth.forgotPassword')}
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold py-2.5 shadow-xs"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight size={15} />}
          >
            {t('auth.signInButton')}
          </Button>
        </form>

        <p className="text-center mt-6 text-xs text-[#64748B]">
          {t('auth.noAccount')}{' '}
          <Link to="/register" className="text-accent-600 hover:underline font-semibold">
            {t('auth.registerHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
