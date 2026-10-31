import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { FormField } from '../components/FormField';
import { Logo } from '../components/Logo';
import { Spinner } from '../components/Spinner';
import { useAuth } from '../features/auth/AuthContext';
import { ApiError } from '../lib/api';

const loginSchema = z.object({
  email: z.string().trim().pipe(z.email('Enter the email you use to sign in')),
  password: z.string().min(1, 'Enter your password'),
});
type LoginValues = z.infer<typeof loginSchema>;

export function LoginPage() {
  const { state, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) });

  const from = (location.state as { from?: string } | null)?.from ?? '/admin';

  if (state.status === 'authenticated') return <Navigate to={from} replace />;

  const onSubmit = handleSubmit(async ({ email, password }) => {
    setFormError(null);
    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'Could not sign in. Try again.');
    }
  });

  return (
    <div className="grid min-h-dvh place-items-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>
        <div className="rounded-2xl border border-line bg-white p-6 sm:p-8">
          <h1 className="text-2xl font-bold">Staff sign in</h1>
          <p className="mt-1 text-slate">Manage inquiries from parents, students and schools.</p>

          <form onSubmit={onSubmit} noValidate className="mt-7 space-y-5">
            {formError && (
              <div role="alert" className="rounded-lg border border-rose/30 bg-rose/5 px-3 py-2.5 text-sm text-rose">
                {formError}
              </div>
            )}

            <FormField id="email" label="Email" error={errors.email?.message}>
              {(a11y) => (
                <input {...a11y} {...register('email')} type="email" autoComplete="username" className="field-input" autoFocus />
              )}
            </FormField>

            <FormField id="password" label="Password" error={errors.password?.message}>
              {(a11y) => (
                <div className="relative">
                  <input
                    {...a11y}
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    className="field-input pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute inset-y-0 right-0 px-3 text-sm font-bold text-slate hover:text-ink"
                    aria-pressed={showPassword}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              )}
            </FormField>

            <button type="submit" className="btn-ink w-full py-3" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner /> Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>
        </div>
        <p className="mt-6 text-center text-sm text-slate">
          <Link to="/" className="underline underline-offset-2 hover:text-ink">
            Back to the inquiry form
          </Link>
        </p>
      </div>
    </div>
  );
}
