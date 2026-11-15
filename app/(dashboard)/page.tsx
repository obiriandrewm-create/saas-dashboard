'use client'

import { useSession } from 'next-auth/react'
import { Users, CreditCard, Plug, FileText, TrendingUp, Activity } from 'lucide-react'
import Link from 'next/link'

const stats = [
  {
    name: 'Team Members',
    value: '12',
    change: '+2 this month',
    icon: Users,
    color: 'text-blue-600',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    href: '/dashboard/members',
  },
  {
    name: 'Monthly Revenue',
    value: '$2,450',
    change: '+12% vs last month',
    icon: CreditCard,
    color: 'text-green-600',
    bg: 'bg-green-100 dark:bg-green-900/30',
    href: '/dashboard/billing',
  },
  {
    name: 'Active Plugins',
    value: '5',
    change: '2 pending updates',
    icon: Plug,
    color: 'text-purple-600',
    bg: 'bg-purple-100 dark:bg-purple-900/30',
    href: '/dashboard/plugins',
  },
  {
    name: 'Audit Events (24h)',
    value: '47',
    change: '3 warnings',
    icon: FileText,
    color: 'text-orange-600',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
    href: '/dashboard/audit-logs',
  },
]

const recentActivity = [
  { action: 'New member joined', details: 'Sarah Chen joined as Admin', time: '2 hours ago', icon: Users, color: 'text-blue-600' },
  { action: 'Subscription updated', details: 'Upgraded to Team plan', time: '4 hours ago', icon: CreditCard, color: 'text-green-600' },
  { action: 'Plugin installed', details: 'Analytics Pro v2.1.0', time: '6 hours ago', icon: Plug, color: 'text-purple-600' },
  { action: 'API key created', details: 'New key for CI/CD pipeline', time: '1 day ago', icon: Key, color: 'text-orange-600' },
  { action: 'Security alert', details: 'Failed login attempts detected', time: '1 day ago', icon: Activity, color: 'text-red-600' },
]

export default function DashboardPage() {
  const { data: session } = useSession()
  const currentOrg = session?.memberships?.[0]?.organization

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">Dashboard</h1>
          <p className="text-sm text-fg-secondary">
            Welcome back, {session?.user?.name?.split(' ')[0] || 'there'}! Here&apos;s what&apos;s happening with {currentOrg?.name || 'your organization'}.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/dashboard/members/invite"
            className="hit-area press-scale inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors focus-ring"
          >
            <Users className="h-4 w-4" aria-hidden="true" />
            Invite Member
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.name}
              href={stat.href}
              className="surface-1 rounded-xl border border-border p-6 hover:shadow-md transition-shadow focus-ring block"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-fg-secondary">{stat.name}</p>
                  <p className="mt-1 text-3xl font-bold text-fg-primary tabular-nums">{stat.value}</p>
                  <p className="mt-2 text-xs text-fg-muted">{stat.change}</p>
                </div>
                <div className={`${stat.bg} ${stat.color} rounded-lg p-3`}>
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 surface-1 rounded-xl border border-border overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <h2 className="text-lg font-semibold text-fg-primary">Recent Activity</h2>
            <Link href="/dashboard/audit-logs" className="text-sm text-brand hover:underline focus-ring">
              View all
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon
              return (
                <div key={index} className="px-6 py-4 flex items-start gap-4 hover:bg-bg-secondary transition-colors">
                  <div className={`${activity.color} bg-opacity-10 rounded-lg p-2 flex-shrink-0`}>
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-fg-primary">{activity.action}</p>
                    <p className="text-sm text-fg-secondary">{activity.details}</p>
                  </div>
                  <time className="text-xs text-fg-muted whitespace-nowrap">{activity.time}</time>
                </div>
              )
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="surface-1 rounded-xl border border-border p-6 space-y-4">
          <h2 className="text-lg font-semibold text-fg-primary">Quick Actions</h2>
          <div className="space-y-3">
            <Link
              href="/dashboard/members/invite"
              className="hit-area press-scale flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-bg-secondary transition-colors focus-ring"
            >
              <div className="bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg p-2">
                <Users className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-fg-primary">Invite Team Member</p>
                <p className="text-xs text-fg-muted">Add a new member to your organization</p>
              </div>
            </Link>
            <Link
              href="/dashboard/billing"
              className="hit-area press-scale flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-bg-secondary transition-colors focus-ring"
            >
              <div className="bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg p-2">
                <CreditCard className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-fg-primary">Manage Billing</p>
                <p className="text-xs text-fg-muted">Update plan, payment method, view invoices</p>
              </div>
            </Link>
            <Link
              href="/dashboard/plugins"
              className="hit-area press-scale flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-bg-secondary transition-colors focus-ring"
            >
              <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 rounded-lg p-2">
                <Plug className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-fg-primary">Browse Plugins</p>
                <p className="text-xs text-fg-muted">Extend functionality with integrations</p>
              </div>
            </Link>
            <Link
              href="/dashboard/api-keys"
              className="hit-area press-scale flex items-center gap-3 rounded-lg border border-border p-4 hover:bg-bg-secondary transition-colors focus-ring"
            >
              <div className="bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg p-2">
                <Key className="h-5 w-5" aria-hidden="true" />
              </div>
              <div>
                <p className="text-sm font-medium text-fg-primary">Create API Key</p>
                <p className="text-xs text-fg-muted">Generate keys for programmatic access</p>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}