'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Search, Filter, Download, Loader2, ChevronLeft, ChevronRight, Shield, User, Bell, Key, Plug, CreditCard, FileText, Users, Settings, Activity } from 'lucide-react'
import { toast } from 'sonner'

const mockAuditLogs = [
  { id: '1', action: 'member.invite', resourceType: 'member', resourceId: 'user_123', user: { name: 'Alex Chen', email: 'alex@example.com' }, metadata: { email: 'new@example.com', role: 'MEMBER' }, ip: '192.168.1.100', severity: 'INFO', createdAt: '2025-01-15T10:30:00Z' },
  { id: '2', action: 'subscription.update', resourceType: 'subscription', resourceId: 'sub_456', user: { name: 'Sarah Johnson', email: 'sarah@example.com' }, metadata: { plan: 'TEAM', previousPlan: 'PRO' }, ip: '192.168.1.101', severity: 'INFO', createdAt: '2025-01-15T09:15:00Z' },
  { id: '3', action: 'plugin.install', resourceType: 'plugin', resourceId: 'analytics-pro', user: { name: 'Mike Rodriguez', email: 'mike@example.com' }, metadata: { plugin: 'Analytics Pro', version: '2.1.0' }, ip: '192.168.1.102', severity: 'INFO', createdAt: '2025-01-15T08:45:00Z' },
  { id: '4', action: 'api_key.create', resourceType: 'api_key', resourceId: 'key_789', user: { name: 'Alex Chen', email: 'alex@example.com' }, metadata: { name: 'CI/CD Key', permissions: ['projects:read', 'projects:write'] }, ip: '192.168.1.100', severity: 'WARNING', createdAt: '2025-01-15T07:20:00Z' },
  { id: '5', action: 'login.failed', resourceType: 'session', resourceId: null, user: { name: 'Unknown', email: 'attacker@example.com' }, metadata: { reason: 'invalid_password', attempts: 5 }, ip: '45.77.123.45', severity: 'ERROR', createdAt: '2025-01-15T06:00:00Z' },
  { id: '6', action: 'member.remove', resourceType: 'member', resourceId: 'user_999', user: { name: 'Alex Chen', email: 'alex@example.com' }, metadata: { removedUser: 'john@example.com', role: 'MEMBER' }, ip: '192.168.1.100', severity: 'WARNING', createdAt: '2025-01-14T16:30:00Z' },
  { id: '7', action: 'settings.update', resourceType: 'organization', resourceId: 'org_123', user: { name: 'Sarah Johnson', email: 'sarah@example.com' }, metadata: { setting: 'custom_domain', value: 'app.example.com' }, ip: '192.168.1.101', severity: 'INFO', createdAt: '2025-01-14T14:10:00Z' },
  { id: '8', action: 'billing.portal_access', resourceType: 'subscription', resourceId: 'sub_456', user: { name: 'Alex Chen', email: 'alex@example.com' }, metadata: {}, ip: '192.168.1.100', severity: 'INFO', createdAt: '2025-01-14T11:00:00Z' },
  { id: '9', action: 'plugin.uninstall', resourceType: 'plugin', resourceId: 'old-plugin', user: { name: 'Mike Rodriguez', email: 'mike@example.com' }, metadata: { plugin: 'Old Plugin' }, ip: '192.168.1.102', severity: 'INFO', createdAt: '2025-01-14T09:45:00Z' },
  { id: '10', action: 'api_key.revoke', resourceType: 'api_key', resourceId: 'key_111', user: { name: 'Alex Chen', email: 'alex@example.com' }, metadata: { name: 'Old CI Key' }, ip: '192.168.1.100', severity: 'WARNING', createdAt: '2025-01-14T08:00:00Z' },
]

const actionIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  'member.invite': Users,
  'member.remove': Users,
  'subscription.update': CreditCard,
  'subscription.cancel': CreditCard,
  'plugin.install': Plug,
  'plugin.uninstall': Plug,
  'api_key.create': Key,
  'api_key.revoke': Key,
  'login.failed': Shield,
  'settings.update': Settings,
  'billing.portal_access': CreditCard,
  'default': Activity,
}

const actionColors: Record<string, string> = {
  'member.invite': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
  'member.remove': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  'subscription.update': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  'subscription.cancel': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200',
  'plugin.install': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
  'plugin.uninstall': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  'api_key.create': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200',
  'api_key.revoke': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  'login.failed': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  'settings.update': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  'billing.portal_access': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  'default': 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
}

const severityColors = {
  INFO: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
  WARNING: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200',
  ERROR: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200',
  DEBUG: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
}

export default function AuditLogsPage() {
  const { data: session } = useSession()
  const [logs, setLogs] = useState(mockAuditLogs)
  const [filteredLogs, setFilteredLogs] = useState(mockAuditLogs)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const pageSize = 10

  const canView = ['OWNER', 'ADMIN'].includes(session?.memberships?.[0]?.role || '')

  const uniqueActions = [...new Set(mockAuditLogs.map(l => l.action))].sort()

  useEffect(() => {
    let result = [...logs]

    if (search) {
      const s = search.toLowerCase()
      result = result.filter(l =>
        l.action.toLowerCase().includes(s) ||
        l.resourceType.toLowerCase().includes(s) ||
        l.user?.name?.toLowerCase().includes(s) ||
        l.user?.email?.toLowerCase().includes(s) ||
        l.ip?.includes(s)
      )
    }

    if (severityFilter !== 'all') {
      result = result.filter(l => l.severity === severityFilter)
    }

    if (actionFilter !== 'all') {
      result = result.filter(l => l.action === actionFilter)
    }

    setFilteredLogs(result)
    setPage(1)
  }, [logs, search, severityFilter, actionFilter])

  const totalPages = Math.ceil(filteredLogs.length / pageSize)
  const paginatedLogs = filteredLogs.slice((page - 1) * pageSize, page * pageSize)

  function formatAction(action: string) {
    return action.split('.').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString()
  }

  async function handleExport() {
    try {
      setLoading(true)
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Audit log export ready for download')
    } catch {
      toast.error('Export failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">Audit Logs</h1>
          <p className="text-sm text-fg-secondary">Track all organization activity and security events</p>
        </div>
        <button
          onClick={handleExport}
          disabled={loading}
          className="hit-area press-scale inline-flex items-center gap-2 rounded-lg border border-border bg-bg-primary px-4 py-2 text-sm font-medium text-fg-primary hover:bg-bg-secondary transition-colors focus-ring disabled:opacity-50"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          {loading ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Filters */}
      <div className="surface-1 rounded-xl border border-border p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search actions, users, resources, IPs..."
              className="hit-area w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
              aria-label="Search audit logs"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className="hit-area px-3 py-2.5 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              aria-label="Filter by severity"
            >
              <option value="all">All Severities</option>
              <option value="INFO">Info</option>
              <option value="WARNING">Warning</option>
              <option value="ERROR">Error</option>
              <option value="CRITICAL">Critical</option>
            </select>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="hit-area px-3 py-2.5 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              aria-label="Filter by action"
            >
              <option value="all">All Actions</option>
              {uniqueActions.map(action => (
                <option key={action} value={action}>{formatAction(action)}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="surface-1 rounded-xl border border-border overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <Activity className="h-12 w-12 text-fg-muted mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-fg-primary mb-2">No audit logs found</h3>
            <p className="text-sm text-fg-secondary">Try adjusting your filters</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="border-b border-border bg-bg-secondary">
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Resource</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">IP Address</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Severity</th>
                    <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {paginatedLogs.map((log) => {
                    const Icon = actionIcons[log.action] || actionIcons.default
                    return (
                      <tr key={log.id} className="hover:bg-bg-secondary transition-colors">
                        <td className="px-6 py-4 text-sm text-fg-primary whitespace-nowrap tabular-nums">{formatDate(log.createdAt)}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${actionColors[log.action] || actionColors.default}`}>
                            <Icon className="h-3 w-3" aria-hidden="true" />
                            {formatAction(log.action)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-fg-primary">{log.user?.name || 'System'}</p>
                            <p className="text-xs text-fg-secondary">{log.user?.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm text-fg-primary">{log.resourceType}</p>
                            {log.resourceId && <p className="text-xs text-fg-secondary font-mono">{log.resourceId}</p>}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-fg-secondary font-mono">{log.ip}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${severityColors[log.severity as keyof typeof severityColors]}`}>
                            {log.severity}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            className="hit-area p-1.5 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring"
                            aria-label={`View details for ${formatAction(log.action)}`}
                          >
                            <FileText className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-border flex items-center justify-between">
                <p className="text-sm text-fg-secondary">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="hit-area p-2 rounded-lg border border-border bg-bg-primary text-fg-primary hover:bg-bg-secondary transition-colors focus-ring disabled:opacity-50"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <span className="text-sm text-fg-secondary">Page {page} of {totalPages}</span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="hit-area p-2 rounded-lg border border-border bg-bg-primary text-fg-primary hover:bg-bg-secondary transition-colors focus-ring disabled:opacity-50"
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}