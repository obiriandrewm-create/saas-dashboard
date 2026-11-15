'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CreditCard, Check, X, Loader2, ArrowUp, ArrowDown, Shield, Crown, Users, Zap } from 'lucide-react'
import { toast } from 'sonner'

const plans = [
  {
    key: 'FREE',
    name: 'Free',
    price: 0,
    period: '/month',
    seatsIncluded: 1,
    overagePrice: null,
    features: ['Up to 1 member', 'Community support', 'Basic analytics', '1 project'],
    cta: 'Current Plan',
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_FREE,
  },
  {
    key: 'PRO',
    name: 'Pro',
    price: 29,
    period: '/month',
    seatsIncluded: 1,
    overagePrice: 10,
    features: ['Unlimited members', 'Priority support', 'Advanced analytics', 'Custom domains', '10 projects'],
    cta: 'Upgrade to Pro',
    popular: true,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO_MONTHLY,
  },
  {
    key: 'TEAM',
    name: 'Team',
    price: 99,
    period: '/month',
    seatsIncluded: 5,
    overagePrice: 15,
    features: ['Everything in Pro', 'SSO (SAML/OIDC)', 'Audit logs export', 'API access', 'Unlimited projects'],
    cta: 'Upgrade to Team',
    popular: false,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_TEAM_MONTHLY,
  },
  {
    key: 'ENTERPRISE',
    name: 'Enterprise',
    price: null,
    period: '/month',
    seatsIncluded: null,
    overagePrice: null,
    features: ['Custom pricing', 'Dedicated support', 'SLA guarantee', 'On-premise option', 'Custom contracts', 'SSO + SCIM'],
    cta: 'Contact Sales',
    popular: false,
    priceId: null,
  },
]

export default function BillingPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [subscription, setSubscription] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [upgrading, setUpgrading] = useState<string | null>(null)

  useEffect(() => {
    fetchSubscription()
  }, [])

  async function fetchSubscription() {
    try {
      const res = await fetch('/api/billing/subscription')
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch {
      // Ignore
    } finally {
      setLoading(false)
    }
  }

  async function handleUpgrade(planKey: string) {
    const plan = plans.find(p => p.key === planKey)
    if (!plan || !plan.priceId) {
      if (planKey === 'ENTERPRISE') {
        router.push('/contact?plan=enterprise')
      }
      return
    }

    setUpgrading(planKey)
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId, action: 'create_checkout' }),
      })

      if (!res.ok) throw new Error('Failed to create checkout session')

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Failed to start checkout. Please try again.')
    } finally {
      setUpgrading(null)
    }
  }

  async function handleManageBilling() {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' })
      if (!res.ok) throw new Error('Failed to create portal session')

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      }
    } catch {
      toast.error('Failed to open billing portal.')
    }
  }

  async function handleCancel() {
    if (!confirm('Are you sure you want to cancel your subscription? You\'ll retain access until the end of the billing period.')) return

    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel' }),
      })

      if (!res.ok) throw new Error('Failed to cancel')

      toast.success('Subscription will be canceled at the end of the billing period.')
      fetchSubscription()
    } catch {
      toast.error('Failed to cancel subscription.')
    }
  }

  async function handleResume() {
    try {
      const res = await fetch('/api/billing/subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'resume' }),
      })

      if (!res.ok) throw new Error('Failed to resume')

      toast.success('Subscription resumed!')
      fetchSubscription()
    } catch {
      toast.error('Failed to resume subscription.')
    }
  }

  const currentPlanKey = subscription?.plan || 'FREE'
  const currentPlan = plans.find(p => p.key === currentPlanKey) || plans[0]
  const isCanceled = subscription?.cancelAtPeriodEnd && subscription?.status === 'ACTIVE'
  const isPastDue = subscription?.status === 'PAST_DUE'

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">Billing</h1>
          <p className="text-sm text-fg-secondary">Manage your subscription, payment methods, and invoices</p>
        </div>
        {subscription?.status && subscription.status !== 'FREE' && (
          <button
            onClick={handleManageBilling}
            className="hit-area press-scale inline-flex items-center gap-2 rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm font-medium text-fg-primary hover:bg-bg-secondary transition-colors focus-ring"
          >
            <CreditCard className="h-4 w-4" aria-hidden="true" />
            Manage in Stripe Portal
          </button>
        )}
      </div>

      {/* Current Plan Status */}
      {subscription?.status && subscription.status !== 'FREE' && (
        <div className={`surface-1 rounded-xl border border-border p-6 ${isPastDue ? 'border-error' : ''}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${currentPlan.popular ? 'bg-brand/10' : 'bg-bg-tertiary'}`}>
                {currentPlan.popular && <Crown className="h-6 w-6 text-brand" aria-hidden="true" />}
                {!currentPlan.popular && <Shield className="h-6 w-6 text-fg-secondary" aria-hidden="true" />}
              </div>
              <div>
                <h2 className="text-lg font-semibold text-fg-primary">{currentPlan.name} Plan</h2>
                <p className="text-sm text-fg-secondary">
                  {isCanceled
                    ? `Cancels on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`
                    : isPastDue
                    ? 'Payment past due — update payment method'
                    : `Renews on ${new Date(subscription.currentPeriodEnd).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              {isCanceled && (
                <button
                  onClick={handleResume}
                  className="hit-area press-scale inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors focus-ring"
                >
                  Resume Subscription
                </button>
              )}
              {!isCanceled && subscription.status !== 'FREE' && (
                <button
                  onClick={handleCancel}
                  className="hit-area press-scale inline-flex items-center gap-2 rounded-lg border border-error bg-error-bg text-error px-4 py-2 text-sm font-medium hover:bg-error-bg/50 transition-colors focus-ring"
                >
                  Cancel Subscription
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="surface-1 rounded-xl border border-border p-6">
        <h2 className="text-lg font-semibold text-fg-primary mb-6">
          {subscription?.status ? 'Available Plans' : 'Choose Your Plan'}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {plans.map((plan) => {
            const isCurrent = plan.key === currentPlanKey
            const isUpgrade = plans.findIndex(p => p.key === plan.key) > plans.findIndex(p => p.key === currentPlanKey)

            return (
              <div
                key={plan.key}
                className={`relative rounded-xl border p-6 transition-all ${
                  isCurrent
                    ? 'border-brand bg-brand/5'
                    : 'border-border hover:border-brand/50 hover:shadow-md'
                } ${plan.popular ? 'ring-2 ring-brand/20' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-brand text-white text-xs font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                {isCurrent && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 text-sm text-brand">
                    <Check className="h-4 w-4" aria-hidden="true" />
                    Current
                  </div>
                )}

                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-fg-primary">{plan.name}</h3>
                    {plan.price !== null ? (
                      <div className="mt-1 flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-fg-primary tabular-nums">${plan.price}</span>
                        <span className="text-fg-secondary">{plan.period}</span>
                      </div>
                    ) : (
                      <div className="mt-1 text-4xl font-bold text-fg-primary">Custom</div>
                    )}
                    {plan.overagePrice && (
                      <p className="text-xs text-fg-muted">+ ${plan.overagePrice}/seat over {plan.seatsIncluded} seats</p>
                    )}
                  </div>

                  <ul className="space-y-3" role="list">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-fg-secondary">
                        <Check className="h-5 w-5 text-success flex-shrink-0 mt-0.5" aria-hidden="true" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <button
                    onClick={() => handleUpgrade(plan.key)}
                    disabled={isCurrent || upgrading === plan.key || !plan.priceId}
                    className={`hit-area press-scale w-full py-3 rounded-lg text-sm font-medium transition-colors focus-ring ${
                      isCurrent
                        ? 'bg-bg-tertiary text-fg-muted cursor-not-allowed'
                        : plan.popular
                        ? 'bg-brand text-white hover:bg-brand-hover'
                        : 'border border-border bg-bg-primary text-fg-primary hover:bg-bg-secondary'
                    }`}
                  >
                    {upgrading === plan.key ? (
                      <Loader2 className="h-4 w-4 animate-spin mx-auto" aria-hidden="true" />
                    ) : plan.cta}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Usage Section */}
      {subscription?.status && subscription.status !== 'FREE' && (
        <div className="surface-1 rounded-xl border border-border p-6">
          <h2 className="text-lg font-semibold text-fg-primary mb-4">Current Usage</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <UsageCard label="Team Members" value="3" limit={currentPlan.seatsIncluded || 1} icon={Users} />
            <UsageCard label="Projects" value="7" limit={currentPlan.key === 'FREE' ? 1 : currentPlan.key === 'PRO' ? 10 : null} icon={Zap} />
            <UsageCard label="API Calls (monthly)" value="12,450" limit={currentPlan.key === 'FREE' ? 10000 : currentPlan.key === 'PRO' ? 100000 : null} icon={ArrowUp} />
          </div>
        </div>
      )}

      {/* Invoices */}
      <div className="surface-1 rounded-xl border border-border">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-fg-primary">Recent Invoices</h2>
          <Link href="/dashboard/billing/invoices" className="text-sm text-brand hover:underline focus-ring">
            View all
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b border-border">
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              <tr>
                <td className="px-6 py-4 text-sm text-fg-primary">Jan 15, 2025</td>
                <td className="px-6 py-4 text-sm text-fg-primary tabular-nums">$29.00</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Paid</span></td>
                <td className="px-6 py-4"><a href="#" className="text-sm text-brand hover:underline focus-ring">Download PDF</a></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-fg-primary">Dec 15, 2024</td>
                <td className="px-6 py-4 text-sm text-fg-primary tabular-nums">$29.00</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Paid</span></td>
                <td className="px-6 py-4"><a href="#" className="text-sm text-brand hover:underline focus-ring">Download PDF</a></td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-sm text-fg-primary">Nov 15, 2024</td>
                <td className="px-6 py-4 text-sm text-fg-primary tabular-nums">$29.00</td>
                <td className="px-6 py-4"><span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Paid</span></td>
                <td className="px-6 py-4"><a href="#" className="text-sm text-brand hover:underline focus-ring">Download PDF</a></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function UsageCard({ label, value, limit, icon: Icon }: { label: string; value: string | number; limit: number | null; icon: React.ComponentType<{ className?: string }> }) {
  const percentage = limit ? Math.min(100, (Number(value) / limit) * 100) : 0
  const isWarning = limit && percentage > 80
  const isDanger = limit && percentage >= 100

  return (
    <div className="p-4 rounded-lg border border-border bg-bg-secondary">
      <div className="flex items-center justify-between mb-2">
        <Icon className="h-5 w-5 text-fg-secondary" aria-hidden="true" />
        {limit && (
          <span className={`text-xs font-medium ${isDanger ? 'text-error' : isWarning ? 'text-warning' : 'text-fg-muted'}`}>
            {Math.round(percentage)}% used
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-fg-primary tabular-nums">{value}</p>
      <p className="text-sm text-fg-secondary">{label}</p>
      {limit && (
        <div className="mt-3 h-2 bg-bg-tertiary rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${isDanger ? 'bg-error' : isWarning ? 'bg-warning' : 'bg-brand'}`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      )}
    </div>
  )
}