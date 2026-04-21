import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/context';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormData = z.infer<typeof loginSchema>;

const LoginPage = () => {
  const { t } = useTranslation('auth');
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      const response = await authService.login(data);
      const { accessToken } = response.data;

      login(accessToken);
      toast.success(t('login.success'));
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string }; status?: number } };
      if (error.response?.status === 401) {
        toast.error(t('errors.invalidCredentials'));
      } else if (error.response?.status === 403) {
        toast.error(t('errors.unauthorized'));
      } else {
        toast.error(error.response?.data?.message || t('errors.invalidCredentials'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-navy-950 via-surface-900 to-navy-950 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="absolute top-20 left-20 w-72 h-72 bg-brand-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-32 right-16 w-96 h-96 bg-brand-600/8 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 flex flex-col justify-center px-16">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-bold text-xl">CW</span>
            </div>
            <span className="text-white font-bold text-2xl tracking-tight">CrediWise</span>
          </div>

          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            {t('login.title')}
            <br />
            <span className="bg-gradient-to-r from-brand-400 to-brand-300 bg-clip-text text-transparent">
              Made Simple
            </span>
          </h1>
          <p className="text-surface-400 text-lg max-w-md leading-relaxed">
            Streamline your banking operations with our comprehensive
            gestionnaire dashboard. Manage branches, teams, and operations
            from a single platform.
          </p>

          <div className="mt-12 grid grid-cols-2 gap-6">
            {[
              { label: 'Active Branches', value: '120+' },
              { label: 'Team Members', value: '850+' },
              { label: 'Daily Transactions', value: '10k+' },
              { label: 'Uptime', value: '99.9%' },
            ].map((stat) => (
              <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-surface-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-surface-50 dark:bg-surface-900 transition-colors">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-10 justify-center">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center">
              <span className="text-white font-bold">CW</span>
            </div>
            <span className="font-bold text-xl text-surface-900 dark:text-surface-50">CrediWise</span>
          </div>

          <div className="mb-8">
            <h2 className="text-page-title text-surface-900 dark:text-surface-50">{t('login.title')}</h2>
            <p className="text-caption text-surface-600 dark:text-surface-400 mt-2">{t('login.subtitle')}</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-label text-surface-600 dark:text-surface-400 mb-2">
                {t('login.email')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  {...register('email')}
                  className={`block w-full rounded-lg border bg-white dark:bg-surface-800 pl-10 pr-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-smooth focus-ring ${
                    errors.email ? 'border-rose-500 dark:border-rose-400' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400'
                  }`}
                  placeholder={t('login.emailPlaceholder')}
                />
              </div>
              {errors.email && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-label text-surface-600 dark:text-surface-400 mb-2">
                {t('login.password')}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-surface-400 dark:text-surface-500">
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  {...register('password')}
                  className={`block w-full rounded-lg border bg-white dark:bg-surface-800 pl-10 pr-4 py-2.5 text-sm text-surface-800 dark:text-surface-200 placeholder:text-surface-400 dark:placeholder:text-surface-500 transition-smooth focus-ring ${
                    errors.password ? 'border-rose-500 dark:border-rose-400' : 'border-surface-200 dark:border-surface-700 hover:border-surface-300 dark:hover:border-surface-600 focus:border-brand-500 dark:focus:border-brand-400'
                  }`}
                  placeholder={t('login.passwordPlaceholder')}
                />
              </div>
              {errors.password && (
                <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-brand-600 dark:bg-brand-600 text-white py-2.5 rounded-lg font-500 text-sm hover:bg-brand-700 dark:hover:bg-brand-700 active:bg-brand-800 dark:active:bg-brand-800 transition-smooth focus-ring disabled:opacity-60 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {t('login.loading')}
                </>
              ) : (
                t('login.submit')
              )}
            </button>
          </form>

          <p className="mt-8 text-center text-caption text-surface-500 dark:text-surface-400">
            Secured by CrediWise Banking Platform
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
