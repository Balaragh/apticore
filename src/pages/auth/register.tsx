import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Logo } from '@/components/ui/logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
import toast from 'react-hot-toast';

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
type RegisterFormData = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: authRegister } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authRegister(data.name, data.email, data.password);
      toast.success(t('auth.registerTitle'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC] px-4 py-12 font-sans text-[#172033] relative">
      {/* Top Language Switcher */}
      <div className="absolute top-5 right-5 z-20">
        <LanguageSelector variant="header" />
      </div>

      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            <Logo size="lg" />
          </Link>
          <h1 className="mt-6 text-2xl font-bold text-[#172033]">{t('auth.registerTitle')}</h1>
          <p className="mt-1 text-sm text-[#64748B]">{t('auth.registerSubtitle')}</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-2xl shadow-xs border border-[#E2E8F0] p-7 space-y-4">
          <Input
            label={t('auth.nameLabel')}
            placeholder={t('auth.namePlaceholder')}
            error={errors.name?.message}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
            {...register('name')}
          />

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
              placeholder="Min. 8 chars (1 uppercase, 1 number)"
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
            label={t('auth.confirmPasswordLabel')}
            type="password"
            placeholder={t('auth.confirmPasswordPlaceholder')}
            error={errors.confirmPassword?.message}
            className="text-xs bg-white border-[#E2E8F0] text-[#172033]"
            {...register('confirmPassword')}
          />

          <Button
            type="submit"
            className="w-full bg-accent-600 hover:bg-accent-700 text-white text-xs font-semibold py-2.5 shadow-xs"
            isLoading={isSubmitting}
            rightIcon={<ArrowRight size={15} />}
          >
            {t('auth.createAccountButton')}
          </Button>
        </form>

        <p className="text-center mt-6 text-xs text-[#64748B]">
          {t('auth.alreadyHaveAccount')}{' '}
          <Link to="/login" className="text-accent-600 hover:underline font-semibold">
            {t('auth.signInHere')}
          </Link>
        </p>
      </div>
    </div>
  );
}
