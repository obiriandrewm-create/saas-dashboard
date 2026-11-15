'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, Eye, EyeOff, Github, Chrome, Window } from 'lucide-react'
import { toast } from 'sonner'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
  totpCode: z.string().length(6, 'TOTP code must be 6 digits').optional(),
  rememberMe: z.boolean().optional(),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'
  const error = searchParams.get('error')

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [totpRequired, setTotpRequired] = useState(false)

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
    watch,
    setValue,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { rememberMe: false },
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        totpCode: data.totpCode,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'TOTP_REQUIRED') {
          setTotpRequired(true)
          setError('totpCode', { type: 'manual', message: 'Enter your 6-digit TOTP code' })
          return
        }
        toast.error(result.error)
        return
      }

      if (result?.ok) {
        toast.success('Welcome back!')
        router.push(callbackUrl)
        router.refresh()
      }
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    signIn(provider, { callbackUrl })
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-fg-primary">Welcome back</h1>
        <p className="text-sm text-fg-secondary">Sign in to your account</p>
      </div>

      {(error || totpRequired) && (
        <div
          className="flex items-center gap-2 rounded-lg bg-error-bg p-3 text-sm text-error role-alert"
          aria-live="polite"
        >
          <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            {totpRequired
              ? 'Two-factor authentication required. Enter your TOTP code.'
              : error === 'CredentialsSignin'
              ? 'Invalid email or password.'
              : error === 'AccessDenied'
              ? 'Access denied. Please contact support.'
              : 'An error occurred. Please try again.'}
          </span>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="email" className="text-sm font-medium text-fg-primary">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" aria-hidden="true" />
            <input
              {...register('email')}
              type="email"
              id="email"
              autoComplete="email"
              className="hit-area w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
              placeholder="you@example.com"
              disabled={isLoading}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
          </div>
          {errors.email && (
            <p id="email-error" className="text-sm text-error" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="text-sm font-medium text-fg-primary">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" aria-hidden="true" />
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              className="hit-area w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
              placeholder="••••••••"
              disabled={isLoading}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary focus-ring rounded p-1"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && (
            <p id="password-error" className="text-sm text-error" role="alert">
              {errors.password.message}
            </p>
          )}
        </div>

        {totpRequired && (
          <div className="space-y-1.5">
            <label htmlFor="totpCode" className="text-sm font-medium text-fg-primary">
              TOTP Code (6 digits)
            </label>
            <input
              {...register('totpCode')}
              type="text"
              id="totpCode"
              autoComplete="one-time-code"
              inputMode="numeric"
              maxLength={6}
              className="hit-area w-full pl-4 pr-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors text-center tracking-widest"
              placeholder="000000"
              disabled={isLoading}
              aria-invalid={errors.totpCode ? 'true' : 'false'}
              aria-describedby={errors.totpCode ? 'totp-error' : undefined}
            />
            {errors.totpCode && (
              <p id="totp-error" className="text-sm text-error" role="alert">
                {errors.totpCode.message}
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              {...register('rememberMe')}
              type="checkbox"
              className="h-4 w-4 rounded border-border bg-bg-primary text-brand focus:ring-brand focus:ring-2"
              disabled={isLoading}
            />
            <span className="text-sm text-fg-secondary">Remember me</span>
          </label>
          <Link
            href="/forgot-password"
            className="text-sm text-brand hover:underline focus-ring rounded"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="hit-area press-scale w-full py-3 rounded-lg bg-brand text-white font-medium transition-colors hover:bg-brand-hover focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </button>
      </form>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-bg-secondary px-4 text-fg-muted">Or continue with</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <button
          onClick={() => handleOAuthSignIn('github')}
          disabled={isLoading}
          className="hit-area press-scale inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-primary py-2.5 text-sm font-medium text-fg-primary hover:bg-bg-secondary transition-colors focus-ring disabled:opacity-50"
          type="button"
        >
          <Github className="h-5 w-5" aria-hidden="true" />
          GitHub
        </button>
        <button
          onClick={() => handleOAuthSignIn('google')}
          disabled={isLoading}
          className="hit-area press-scale inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-primary py-2.5 text-sm font-medium text-fg-primary hover:bg-bg-secondary transition-colors focus-ring disabled:opacity-50"
          type="button"
        >
          <Chrome className="h-5 w-5" aria-hidden="true" />
          Google
        </button>
        <button
          onClick={() => handleOAuthSignIn('microsoft-entra-id')}
          disabled={isLoading}
          className="hit-area press-scale inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-bg-primary py-2.5 text-sm font-medium text-fg-primary hover:bg-bg-secondary transition-colors focus-ring disabled:opacity-50"
          type="button"
        >
          <Window className="h-5 w-5" aria-hidden="true" />
          Microsoft
        </button>
      </div>

      <p className="text-center text-sm text-fg-secondary">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-medium text-brand hover:underline focus-ring rounded">
          Create one
        </Link>
      </p>
    </div>
  )
}