'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail, Loader2, Check, AlertCircle, Shield, Users, Building } from 'lucide-react'
import { toast } from 'sonner'

const acceptSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
  confirmPassword: z.string().optional(),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

type AcceptForm = z.infer<typeof acceptSchema>

export default function InvitationPage() {
  const router = useRouter()
  const params = useParams()
  const token = params.token as string
  const [invitation, setInvitation] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [accepting, setAccepting] = useState(false)
  const [existingUser, setExistingUser] = useState(false)

  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<AcceptForm>({
    resolver: zodResolver(acceptSchema),
    defaultValues: { password: '', confirmPassword: '' },
  })

  useEffect(() => {
    fetchInvitation()
  }, [token])

  async function fetchInvitation() {
    try {
      const res = await fetch(`/api/auth/invitations/${token}`, { method: 'GET' })
      if (!res.ok) throw new Error('Invalid invitation')
      const data = await res.json()
      setInvitation(data)

      // Check if user already has account with this email
      const checkRes = await fetch(`/api/auth/check-email?email=${encodeURIComponent(data.invitation?.email || data.email)}`)
      if (checkRes.ok) {
        const checkData = await checkRes.json()
        setExistingUser(checkData.exists)
      }
    } catch {
      toast.error('Invalid or expired invitation')
      router.push('/login')
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(data: AcceptForm) {
    setAccepting(true)
    try {
      const res = await fetch(`/api/auth/invitations/${params.token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.password }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || 'Failed to accept invitation')
      }

      toast.success('Welcome to the team!')
      router.push('/dashboard')
    } catch (error: any) {
      toast.error(error.message || 'Failed to accept invitation')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    )
  }

  if (!invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-fg-primary mb-2">Invalid Invitation</h1>
          <p className="text-fg-secondary mb-6">This invitation link is invalid or has expired.</p>
          <Link href="/login" className="hit-area press-scale inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors focus-ring">
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  const { organization, role, email } = invitation.invitation || invitation

  return (
    <div className="min-h-screen bg-bg-secondary flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-brand hover:underline focus-ring rounded">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M9 9h6v6H9z" />
            </svg>
            <span className="text-xl font-bold text-fg-primary">SaaS Dashboard</span>
          </Link>
        </div>

        <div className="surface-1 rounded-2xl border border-border p-8 shadow-lg">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
                <Building className="h-7 w-7 text-brand" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-fg-primary">You're invited!</h1>
            <p className="text-sm text-fg-secondary mt-2">
              <strong>{organization?.name || 'An organization'}</strong> wants you to join as <strong>{role}</strong>
            </p>
          </div>

          <div className="space-y-1.5 p-4 rounded-lg bg-bg-secondary mb-6">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="h-4 w-4 text-fg-muted" />
              <span className="text-fg-primary">{email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Shield className="h-4 w-4 text-fg-muted" />
              <span className="text-fg-primary capitalize">{role}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Users className="h-4 w-4 text-fg-muted" />
              <span className="text-fg-secondary">Will have access to projects, analytics, and team features</span>
            </div>
          </div>

          {existingUser ? (
            <div className="space-y-4">
              <p className="text-sm text-fg-secondary text-center">You already have an account with this email. Just sign in to accept.</p>
              <button
                onClick={() => router.push(`/login?callbackUrl=/invitations/${params.token}/accept`)}
                className="hit-area press-scale w-full py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring"
              >
                Sign In to Accept
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-sm font-medium text-fg-primary">
                  Create Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    autoComplete="new-password"
                    className="hit-area w-full pl-4 pr-12 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="••••••••"
                    disabled={accepting}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary focus-ring rounded p-1"
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
                {errors.password && <p className="text-sm text-error">{errors.password.message}</p>}
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-sm font-medium text-fg-primary">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    {...register('confirmPassword')}
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    autoComplete="new-password"
                    className="hit-area w-full pl-4 pr-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    placeholder="••••••••"
                    disabled={accepting}
                  />
                </div>
                {errors.confirmPassword && <p className="text-sm text-error">{errors.confirmPassword.message}</p>}
              </div>

              <button
                type="submit"
                disabled={accepting}
                className="hit-area press-scale w-full py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {accepting ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Accepting...
                  </>
                ) : (
                  'Accept Invitation'
                )}
              </button>
            </form>
          )}

          <p className="mt-6 text-center text-xs text-fg-muted">
            By accepting, you agree to our <Link href="/terms" className="underline hover:text-brand">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-brand">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  )
}