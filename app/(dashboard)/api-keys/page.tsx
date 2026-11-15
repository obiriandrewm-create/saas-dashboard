'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plus, Key, Copy, Trash2, Check, Loader2, AlertTriangle, Calendar, Clock, Shield, Search } from 'lucide-react'
import { toast } from 'sonner'

const mockApiKeys = [
  { id: '1', name: 'Production API', prefix: 'sk_live_abc1', permissions: ['projects:read', 'projects:write', 'members:read'], lastUsed: '2 hours ago', expiresAt: '2025-12-31', createdAt: '2024-01-15', revoked: false },
  { id: '2', name: 'CI/CD Pipeline', prefix: 'sk_live_def2', permissions: ['projects:read', 'projects:write', 'analytics:read'], lastUsed: '5 minutes ago', expiresAt: null, createdAt: '2024-02-20', revoked: false },
  { id: '3', name: 'Analytics Export', prefix: 'sk_live_ghi3', permissions: ['analytics:read', 'exports:write'], lastUsed: '3 days ago', expiresAt: '2025-06-30', createdAt: '2024-03-10', revoked: false },
  { id: '4', name: 'Old Test Key', prefix: 'sk_test_xyz9', permissions: ['projects:read'], lastUsed: 'Never', expiresAt: '2024-12-31', createdAt: '2023-11-01', revoked: true },
]

const allPermissions = [
  { category: 'Projects', permissions: ['projects:read', 'projects:write', 'projects:delete'] },
  { category: 'Members', permissions: ['members:read', 'members:write', 'members:invite'] },
  { category: 'Billing', permissions: ['billing:read', 'billing:write'] },
  { category: 'Analytics', permissions: ['analytics:read', 'analytics:write'] },
  { category: 'Plugins', permissions: ['plugins:read', 'plugins:install', 'plugins:configure'] },
  { category: 'Audit', permissions: ['audit:read', 'audit:export'] },
  { category: 'Settings', permissions: ['settings:read', 'settings:write'] },
  { category: 'Exports', permissions: ['exports:read', 'exports:write'] },
  { category: 'Webhooks', permissions: ['webhooks:read', 'webhooks:write'] },
]

export default function ApiKeysPage() {
  const { data: session } = useSession()
  const [keys, setKeys] = useState(mockApiKeys)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([])
  const [expiresIn, setExpiresIn] = useState('never')
  const [creating, setCreating] = useState(false)
  const [newKey, setNewKey] = useState<string | null>(null)
  const [copying, setCopying] = useState<string | null>(null)
  const [revoking, setRevoking] = useState<string | null>(null)

  const canManage = session?.memberships?.[0]?.role === 'OWNER' || session?.memberships?.[0]?.role === 'ADMIN'

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    if (!newKeyName.trim() || selectedPermissions.length === 0) return

    setCreating(true)
    try {
      await new Promise(r => setTimeout(r, 1500))

      // Simulate key generation
      const prefix = 'sk_live_' + Math.random().toString(36).substring(2, 6)
      const fullKey = `${prefix}_${Math.random().toString(36).substring(2, 15)}`

      const newKeyObj = {
        id: Date.now().toString(),
        name: newKeyName,
        prefix,
        permissions: selectedPermissions,
        lastUsed: 'Never',
        expiresAt: expiresIn === 'never' ? null : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date().toISOString().split('T')[0],
        revoked: false,
      }

      setKeys(prev => [newKeyObj, ...prev])
      setNewKey(fullKey)
      setShowCreateModal(false)
      setNewKeyName('')
      setSelectedPermissions([])
      setExpiresIn('never')
      toast.success('API key created successfully')
    } catch {
      toast.error('Failed to create API key')
    } finally {
      setCreating(false)
    }
  }

  async function handleCopy(key: string) {
    setCopying(key)
    try {
      await navigator.clipboard.writeText(key)
      toast.success('Copied to clipboard')
    } catch {
      toast.error('Failed to copy')
    } finally {
      setCopying(null)
    }
  }

  async function handleRevoke(keyId: string) {
    if (!confirm('Revoke this API key? This action cannot be undone.')) return

    setRevoking(keyId)
    try {
      await new Promise(r => setTimeout(r, 500))
      setKeys(prev => prev.map(k => k.id === keyId ? { ...k, revoked: true } : k))
      toast.success('API key revoked')
    } catch {
      toast.error('Failed to revoke key')
    } finally {
      setRevoking(null)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'Never'
    return new Date(dateStr).toLocaleDateString()
  }

  function isExpired(expiresAt: string | null) {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">API Keys</h1>
          <p className="text-sm text-fg-secondary">Manage API keys for programmatic access</p>
        </div>
        {canManage && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="hit-area press-scale inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors focus-ring"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Create API Key
          </button>
        )}
      </div>

      {/* Security Notice */}
      <div className="surface-1 rounded-xl border border-border p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" aria-hidden="true" />
          <div className="text-sm text-fg-secondary">
            <p className="font-medium text-fg-primary mb-1">Security Best Practices</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Store keys securely — they won&apos;t be shown again after creation</li>
              <li>Use environment variables, never commit keys to version control</li>
              <li>Rotate keys regularly and revoke unused keys</li>
              <li>Use scoped permissions — grant only what&apos;s needed</li>
              <li>Set expiration dates for temporary access</li>
            </ul>
          </div>
        </div>
      </div>

      {/* API Keys Table */}
      <div className="surface-1 rounded-xl border border-border overflow-hidden">
        {keys.length === 0 ? (
          <div className="p-12 text-center">
            <Key className="h-12 w-12 text-fg-muted mx-auto mb-4" aria-hidden="true" />
            <h3 className="text-lg font-medium text-fg-primary mb-2">No API keys yet</h3>
            <p className="text-sm text-fg-secondary mb-6">Create your first API key to start integrating</p>
            {canManage && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="hit-area press-scale inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors focus-ring"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Create API Key
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full" role="table">
              <thead>
                <tr className="border-b border-border bg-bg-secondary">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Prefix</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Permissions</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Last Used</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-fg-muted uppercase tracking-wider">Expires</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-fg-muted uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {keys.map((key) => (
                  <tr key={key.id} className={`hover:bg-bg-secondary transition-colors ${key.revoked ? 'opacity-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-fg-primary">{key.name}</p>
                        <p className="text-xs text-fg-secondary">Created {formatDate(key.createdAt)}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-sm text-fg-primary bg-bg-tertiary px-2 py-1 rounded font-mono">{key.prefix}••••</code>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {key.permissions.slice(0, 3).map((p, i) => (
                          <span key={i} className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-fg-secondary font-mono">{p}</span>
                        ))}
                        {key.permissions.length > 3 && (
                          <span className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-fg-muted">+{key.permissions.length - 3} more</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {key.revoked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                          <X className="h-3 w-3" aria-hidden="true" />
                          Revoked
                        </span>
                      ) : isExpired(key.expiresAt) ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200">
                          <AlertTriangle className="h-3 w-3" aria-hidden="true" />
                          Expired
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
                          <Shield className="h-3 w-3" aria-hidden="true" />
                          Active
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-fg-secondary">{key.lastUsed}</td>
                    <td className="px-6 py-4">
                      {key.expiresAt ? (
                        <>
                          <p className="text-sm text-fg-primary">{formatDate(key.expiresAt)}</p>
                          {isExpired(key.expiresAt) && <p className="text-xs text-warning">Expired</p>}
                        </>
                      ) : (
                        <span className="text-sm text-fg-muted">Never</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!key.revoked && (
                          <button
                            onClick={() => handleCopy(`${key.prefix}_${'x'.repeat(24)}`)}
                            disabled={copying === key.id}
                            className="hit-area p-2 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring"
                            aria-label={`Copy ${key.name} key`}
                          >
                            {copying === key.id ? (
                              <Check className="h-4 w-4 text-success" aria-hidden="true" />
                            ) : (
                              <Copy className="h-4 w-4" aria-hidden="true" />
                            )}
                          </button>
                        )}
                        {!key.revoked && canManage && (
                          <button
                            onClick={() => handleRevoke(key.id)}
                            disabled={revoking === key.id}
                            className="hit-area p-2 rounded-lg text-error hover:bg-error-bg focus-ring"
                            aria-label={`Revoke ${key.name}`}
                          >
                            {revoking === key.id ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Trash2 className="h-4 w-4" aria-hidden="true" />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowCreateModal(false)}>
          <div className="surface-1 rounded-xl border border-border p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-fg-primary">Create API Key</h2>
              <button onClick={() => setShowCreateModal(false)} className="hit-area p-2 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="keyName" className="text-sm font-medium text-fg-primary">Key Name</label>
                <input
                  id="keyName"
                  type="text"
                  value={newKeyName}
                  onChange={e => setNewKeyName(e.target.value)}
                  placeholder="e.g., Production API, CI/CD Pipeline"
                  className="hit-area w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  required
                  disabled={creating}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-fg-primary">Permissions</label>
                <div className="flex flex-wrap gap-2">
                  {allPermissions.map(({ category, permissions }) => (
                    <fieldset key={category} className="border border-border rounded-lg p-3 min-w-[200px]">
                      <legend className="text-xs font-medium text-fg-secondary mb-2">{category}</legend>
                      <div className="space-y-1.5">
                        {permissions.map(perm => (
                          <label key={perm} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedPermissions.includes(perm)}
                              onChange={e => togglePermission(perm)}
                              className="h-4 w-4 rounded border-border bg-bg-primary text-brand focus:ring-brand focus:ring-2"
                              disabled={creating}
                            />
                            <span className="text-sm text-fg-primary font-mono">{perm}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-fg-primary">Expiration</label>
                <select
                  value={expiresIn}
                  onChange={e => setExpiresIn(e.target.value)}
                  className="hit-area w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  disabled={creating}
                >
                  <option value="never">Never expires</option>
                  <option value="30">30 days</option>
                  <option value="90">90 days</option>
                  <option value="180">180 days</option>
                  <option value="365">1 year</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="hit-area press-scale flex-1 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary font-medium hover:bg-bg-secondary transition-colors focus-ring"
                  disabled={creating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="hit-area press-scale flex-1 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring"
                  disabled={creating || selectedPermissions.length === 0 || !newKeyName.trim()}
                >
                  {creating ? <Loader2 className="h-4 w-4 animate-spin mx-auto" aria-hidden="true" /> : 'Create API Key'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Key Modal */}
      {newKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setNewKey(null)}>
          <div className="surface-1 rounded-xl border border-border p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-fg-primary">API Key Created</h2>
            </div>
            <div className="space-y-4">
              <div className="bg-bg-tertiary rounded-lg p-4">
                <code className="text-sm font-mono text-fg-primary break-all">{newKey}</code>
              </div>
              <div className="flex items-center gap-2 text-sm text-warning">
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                <span>This is the only time you&apos;ll see this key. Copy it now and store it securely.</span>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => handleCopy(newKey)}
                  disabled={copying === newKey}
                  className="hit-area press-scale flex-1 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring"
                >
                  {copying === newKey ? <Check className="h-4 w-4 mx-auto" aria-hidden="true" /> : 'Copy Key'}
                </button>
                <button
                  onClick={() => setNewKey(null)}
                  className="hit-area press-scale flex-1 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary font-medium hover:bg-bg-secondary transition-colors focus-ring"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}