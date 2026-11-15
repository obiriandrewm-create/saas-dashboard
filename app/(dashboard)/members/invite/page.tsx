'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Mail, UserPlus, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

const inviteSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
})

type InviteForm = z.infer<typeof inviteSchema>

export default function InviteMemberPage() {
  const router = useRouter()
  const [inviting, setInviting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { role: 'MEMBER' },
  })

  const onSubmit = async (data: InviteForm) => {
    setInviting(true)
    try {
      const res = await fetch('/api/orgs/current/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error?.message || 'Failed to send invitation')
      }

      toast.success('Invitation sent!')
      router.push('/dashboard/members')
    } catch (error: any) {
      toast.error(error.message || 'Failed to send invitation')
    } finally {
      setInviting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/members"
          className="hit-area p-2 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring"
          aria-label="Back to members"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">Invite Member</h1>
          <p className="text-sm text-fg-secondary">Add a new team member to your organization</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-md" noValidate>
        <div className="surface-1 rounded-xl border border-border p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-brand/10 flex items-center justify-center">
              <UserPlus className="h-6 w-6 text-brand" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-fg-primary">Send Invitation</h2>
              <p className="text-sm text-fg-secondary">The invitee will receive an email with a link to join</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="email" className="text-sm font-medium text-fg-primary">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-fg-muted" />
              <input
                {...register('email')}
                type="email"
                id="email"
                autoComplete="email"
                className="hit-area w-full pl-10 pr-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                placeholder="colleague@company.com"
                disabled={inviting}
              />
            </div>
            {errors.email && <p className="text-sm text-error">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fg-primary">Role</label>
            <select {...register('role')} className="hit-area w-full px-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20" disabled={inviting}>
              <option value="ADMIN">Admin — Full access except deletion</option>
              <option value="MEMBER">Member — Standard access</option>
              <option value="VIEWER">Viewer — Read-only access</option>
            </select>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              The invitee will receive an email with a secure link to join. The link expires in 7 days.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Link
              href="/dashboard/members"
              className="hit-area press-scale flex-1 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary font-medium hover:bg-bg-secondary transition-colors focus-ring text-center"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={inviting}
              className="hit-area press-scale flex-1 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {inviting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invitation
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}