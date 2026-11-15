'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, Lock, User, Eye, EyeOff, Github, Chrome, Window, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters').max(128),
  confirmPassword: z.string(),
  terms: z.boolean().refine(val => val, 'You must accept the terms'),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type RegisterForm = z.infer<typeof registerSchema>

export default function RegisterPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { terms: false },
  })

  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        toast.error(result.error?.message || 'Registration failed')
        if (result.error?.field) {
          // Set field error manually if needed
        }
        return
      }

      toast.success('Account created! Please check your email to verify.')
      router.push('/login?registered=true')
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleOAuthSignIn = (provider: string) => {
    window.location.href = `/api/auth/signin/${provider}?callbackUrl=/dashboard`
  }

  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  const strength = getPasswordStrength(password)
  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-error', 'bg-error', 'bg-warning', 'bg-success', 'bg-success']

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-fg-primary">Create your account</h1>
        <p className="text-sm text-fg-secondary">Start your 14-day free trial. No credit card required.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
        <div className="space-y-1.5">
          <label htmlFor="name" className="text-sm font-medium text-fg-primary">
            Full Name
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" aria-hidden="true" />
            <input
              {...register('name')}
              type="text"
              id="name"
              autoComplete="name"
              className="hit-area w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
              placeholder="John Doe"
              disabled={isLoading}
              aria-invalid={errors.name ? 'true' : 'false'}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
          </div>
          {errors.name && (
            <p id="name-error" className="text-sm text-error" role="alert">
              {errors.name.message}
            </p>
          )}
        </div>

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
              autoComplete="new-password"
              className="hit-area w-full pl-10 pr-12 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
              placeholder="••••••••"
              disabled={isLoading}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : 'password-hint'}
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
          {!errors.password && password && (
            <div id="password-hint" className="space-y-1.5" role="status" aria-live="polite">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full transition-all duration-300"
                    style={{
                      width: `${(strength / 5) * 100}%`,
                      backgroundColor: strengthColors[strength - 1] || 'transparent',
                    }}
                  />
                </div>
                <span className="text-xs text-fg-muted">{strengthLabels[strength - 1] || ''}</span>
              </div>
              <p className="text-xs text-fg-muted">
                {password.length < 8 && '• At least 8 characters'}
                {!/[A-Z]/.test(password) && '• One uppercase letter'}
                {!/[a-z]/.test(password) && '• One lowercase letter'}
                {!/[0-9]/.test(password) && '• One number'}
                {!/[^A-Za-z0-9]/.test(password) && '• One special character'}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="confirmPassword" className="text-sm font-medium text-fg-primary">
            Confirm Password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" aria-hidden="true" />
            <input
              {...register('confirmPassword')}
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              className="hit-area w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-colors"
              placeholder="••••••••"
              disabled={isLoading}
              aria-invalid={errors.confirmPassword ? 'true' : 'false'}
              aria-describedby={errors.confirmPassword ? 'confirm-error' : undefined}
            />
          </div>
          {errors.confirmPassword && (
            <p id="confirm-error" className="text-sm text-error" role="alert">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label className="flex items-start gap-2 cursor-pointer">
            <input
              {...register('terms')}
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-border bg-bg-primary text-brand focus:ring-brand focus:ring-2"
              disabled={isLoading}
            />
            <span className="text-sm text-fg-secondary">
              I agree to the{' '}
              <Link href="/terms" className="underline hover:text-brand focus-ring rounded">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="underline hover:text-brand focus-ring rounded">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.terms && (
            <p className="text-sm text-error" role="alert">
              {errors.terms.message}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="hit-area press-scale w-full py-3 rounded-lg bg-brand text-white font-medium transition-colors hover:bg-brand-hover focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
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
        Already have an account?{' '}
        <Link href="/login" className="font-medium text-brand hover:underline focus-ring rounded">
          Sign in
        </Link>
      </p>
    </div>
  )
}