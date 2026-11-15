'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Plug, Package, Check, X, Loader2, ExternalLink, Settings, Trash2, Search, Shield, Zap, Database, Globe, Layers } from 'lucide-react'
import { toast } from 'sonner'

const mockMarketplacePlugins = [
  {
    id: 'analytics-pro',
    name: 'Analytics Pro',
    description: 'Advanced analytics and reporting with custom dashboards',
    version: '2.1.0',
    author: 'DataViz Inc.',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=analytics',
    capabilities: ['read:projects', 'write:projects', 'read:analytics'],
    permissions: { required: ['projects:read'], optional: ['analytics:write'] },
    isOfficial: true,
    downloads: 12500,
    rating: 4.8,
    category: 'Analytics',
  },
  {
    id: 'slack-integration',
    name: 'Slack Integration',
    description: 'Send notifications and reports to Slack channels',
    version: '1.5.2',
    author: 'DevTools Co.',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=slack',
    capabilities: ['read:projects', 'write:notifications'],
    permissions: { required: ['notifications:write'], optional: [] },
    isOfficial: true,
    downloads: 8900,
    rating: 4.6,
    category: 'Communication',
  },
  {
    id: 'github-sync',
    name: 'GitHub Sync',
    description: 'Sync issues, PRs, and commits with your projects',
    version: '3.0.1',
    author: 'CodeFlow Labs',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=github',
    capabilities: ['read:projects', 'write:projects', 'read:github'],
    permissions: { required: ['projects:write'], optional: ['github:read'] },
    isOfficial: false,
    downloads: 5400,
    rating: 4.7,
    category: 'Development',
  },
  {
    id: 'custom-forms',
    name: 'Custom Forms',
    description: 'Build and embed custom forms with validation',
    version: '1.2.0',
    author: 'FormCraft',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=forms',
    capabilities: ['read:projects', 'write:forms'],
    permissions: { required: ['forms:write'], optional: [] },
    isOfficial: false,
    downloads: 3200,
    rating: 4.4,
    category: 'Productivity',
  },
  {
    id: 'webhook-relay',
    name: 'Webhook Relay',
    description: 'Forward webhooks to multiple endpoints with retry logic',
    version: '2.3.0',
    author: 'InfraTeam',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=webhook',
    capabilities: ['read:webhooks', 'write:webhooks'],
    permissions: { required: ['webhooks:write'], optional: ['webhooks:read'] },
    isOfficial: true,
    downloads: 4100,
    rating: 4.9,
    category: 'Infrastructure',
  },
  {
    id: 'export-pdf',
    name: 'PDF Export',
    description: 'Export reports and dashboards as PDF documents',
    version: '1.0.5',
    author: 'DocuGen',
    icon: 'https://api.dicebear.com/7.x/shapes/svg?seed=pdf',
    capabilities: ['read:projects', 'write:exports'],
    permissions: { required: ['exports:write'], optional: [] },
    isOfficial: false,
    downloads: 2800,
    rating: 4.3,
    category: 'Productivity',
  },
]

const mockInstalledPlugins = [
  {
    id: 'analytics-pro',
    name: 'Analytics Pro',
    version: '2.1.0',
    enabled: true,
    config: { refreshInterval: 300, defaultDashboard: 'overview' },
    installedAt: '2024-03-15',
  },
  {
    id: 'slack-integration',
    name: 'Slack Integration',
    version: '1.5.2',
    enabled: true,
    config: { webhookUrl: 'https://hooks.slack.com/services/***', channel: '#reports' },
    installedAt: '2024-03-20',
  },
]

export default function PluginsPage() {
  const { data: session } = useSession()
  const [tab, setTab] = useState<'installed' | 'marketplace'>('installed')
  const [search, setSearch] = useState('')
  const [installing, setInstalling] = useState<string | null>(null)
  const [configuring, setConfiguring] = useState<string | null>(null)
  const [configModal, setConfigModal] = useState<{ plugin: any; config: any } | null>(null)

  const canManage = session?.memberships?.[0]?.role === 'OWNER' || session?.memberships?.[0]?.role === 'ADMIN'

  const filteredMarketplace = mockMarketplacePlugins.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.description.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  )

  const installedIds = new Set(mockInstalledPlugins.map(p => p.id))

  async function handleInstall(pluginId: string) {
    const plugin = mockMarketplacePlugins.find(p => p.id === pluginId)
    if (!plugin) return

    setInstalling(pluginId)
    try {
      await new Promise(r => setTimeout(r, 1500))
      toast.success(`${plugin.name} installed successfully`)
      setTab('installed')
    } catch {
      toast.error('Installation failed')
    } finally {
      setInstalling(null)
    }
  }

  async function handleUninstall(pluginId: string) {
    if (!confirm('Uninstall this plugin? This will remove all its data.')) return

    try {
      await new Promise(r => setTimeout(r, 500))
      toast.success('Plugin uninstalled')
    } catch {
      toast.error('Failed to uninstall')
    }
  }

  async function handleToggleEnabled(pluginId: string, enabled: boolean) {
    try {
      await new Promise(r => setTimeout(r, 300))
      toast.success(`Plugin ${enabled ? 'enabled' : 'disabled'}`)
    } catch {
      toast.error('Failed to update')
    }
  }

  function handleOpenConfig(plugin: any) {
    setConfigModal({ plugin, config: { ...plugin.config } })
  }

  async function handleSaveConfig() {
    if (!configModal) return

    try {
      await new Promise(r => setTimeout(r, 500))
      toast.success('Configuration saved')
      setConfigModal(null)
    } catch {
      toast.error('Failed to save')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">Plugins</h1>
          <p className="text-sm text-fg-secondary">Extend functionality with integrations and add-ons</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="surface-1 rounded-xl border border-border p-1">
        <div className="flex gap-1" role="tablist">
          <button
            role="tab"
            aria-selected={tab === 'installed'}
            onClick={() => setTab('installed')}
            className={`hit-area press-scale flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors focus-ring ${
              tab === 'installed'
                ? 'bg-brand text-white'
                : 'text-fg-secondary hover:text-fg-primary'
            }`}
          >
            <Plug className="h-4 w-4 inline mr-2" aria-hidden="true" />
            Installed ({mockInstalledPlugins.length})
          </button>
          <button
            role="tab"
            aria-selected={tab === 'marketplace'}
            onClick={() => setTab('marketplace')}
            className={`hit-area press-scale flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors focus-ring ${
              tab === 'marketplace'
                ? 'bg-brand text-white'
                : 'text-fg-secondary hover:text-fg-primary'
            }`}
          >
            <Package className="h-4 w-4 inline mr-2" aria-hidden="true" />
            Marketplace
          </button>
        </div>
      </div>

      {/* Content */}
      {tab === 'installed' && (
        <div className="surface-1 rounded-xl border border-border overflow-hidden">
          {mockInstalledPlugins.length === 0 ? (
            <div className="p-12 text-center">
              <Plug className="h-12 w-12 text-fg-muted mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-fg-primary mb-2">No plugins installed</h3>
              <p className="text-sm text-fg-secondary mb-6">Browse the Marketplace to add functionality</p>
              <button
                onClick={() => setTab('marketplace')}
                className="hit-area press-scale inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-hover transition-colors focus-ring"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                Browse Marketplace
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {mockInstalledPlugins.map((plugin) => (
                <div key={plugin.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center">
                      <img src={`https://api.dicebear.com/7.x/shapes/svg?seed=${plugin.id}`} alt="" className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-fg-primary">{plugin.name}</h3>
                        <span className="text-xs text-fg-muted">v{plugin.version}</span>
                      </div>
                      <p className="text-sm text-fg-secondary">Installed {plugin.installedAt}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={plugin.enabled}
                        onChange={e => handleToggleEnabled(plugin.id, e.target.checked)}
                        className="h-4 w-4 rounded border-border bg-bg-primary text-brand focus:ring-brand focus:ring-2"
                        disabled={!canManage}
                      />
                      <span className="text-sm text-fg-secondary">{plugin.enabled ? 'Enabled' : 'Disabled'}</span>
                    </label>
                    {canManage && (
                      <>
                        <button
                          onClick={() => handleOpenConfig(plugin)}
                          className="hit-area p-2 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring"
                          aria-label={`Configure ${plugin.name}`}
                        >
                          <Settings className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          onClick={() => handleUninstall(plugin.id)}
                          className="hit-area p-2 rounded-lg text-error hover:bg-error-bg focus-ring"
                          aria-label={`Uninstall ${plugin.name}`}
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'marketplace' && (
        <div className="space-y-4">
          {/* Search */}
          <div className="surface-1 rounded-xl border border-border p-4">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" aria-hidden="true" />
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search plugins..."
                className="hit-area w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                aria-label="Search marketplace"
              />
            </div>
          </div>

          {/* Plugin Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMarketplace.map((plugin) => {
              const isInstalled = installedIds.has(plugin.id)
              const Icon = ({ className }: { className?: string }) => (
                <img src={plugin.icon} alt="" className={className} />
              )

              return (
                <div
                  key={plugin.id}
                  className={`surface-1 rounded-xl border border-border p-6 transition-all hover:shadow-md ${
                    isInstalled ? 'border-brand/50 bg-brand/5' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center">
                      <Icon className="h-8 w-8" />
                    </div>
                    {plugin.isOfficial && (
                      <Shield className="h-4 w-4 text-brand flex-shrink-0" aria-label="Official plugin" title="Official plugin" />
                    )}
                  </div>
                  <h3 className="font-semibold text-fg-primary mb-1">{plugin.name}</h3>
                  <p className="text-sm text-fg-secondary mb-3 line-clamp-2">{plugin.description}</p>

                  <div className="flex flex-wrap gap-1 mb-4">
                    <span className="px-2 py-0.5 rounded-full text-xs text-fg-muted bg-bg-tertiary">{plugin.category}</span>
                    {plugin.isOfficial && <span className="px-2 py-0.5 rounded-full text-xs bg-brand/10 text-brand">Official</span>}
                  </div>

                  <div className="flex items-center gap-4 text-xs text-fg-muted mb-4">
                    <span className="flex items-center gap-1"><Zap className="h-3 w-3" aria-hidden="true" /> {plugin.downloads.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3" aria-hidden="true" /> {plugin.rating}</span>
                  </div>

                  <div className="flex flex-wrap gap-1 mb-4">
                    {plugin.capabilities.slice(0, 3).map((cap, i) => (
                      <span key={i} className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-fg-secondary font-mono">{cap}</span>
                    ))}
                    {plugin.capabilities.length > 3 && (
                      <span className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-fg-muted">+{plugin.capabilities.length - 3} more</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isInstalled ? (
                      <button className="hit-area press-scale flex-1 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring disabled:opacity-50" disabled>
                        Installed
                      </button>
                    ) : (
                      <button
                        onClick={() => handleInstall(plugin.id)}
                        disabled={installing === plugin.id}
                        className="hit-area press-scale flex-1 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50"
                      >
                        {installing === plugin.id ? <Loader2 className="h-4 w-4 animate-spin mx-auto" aria-hidden="true" /> : 'Install'}
                      </button>
                    )}
                    <a
                      href={`https://example.com/plugins/${plugin.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hit-area p-2 rounded-lg border border-border bg-bg-primary text-fg-secondary hover:bg-bg-secondary transition-colors focus-ring"
                      aria-label={`View details for ${plugin.name}`}
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              )
            })}
          </div>

          {filteredMarketplace.length === 0 && (
            <div className="surface-1 rounded-xl border border-border p-12 text-center">
              <Search className="h-12 w-12 text-fg-muted mx-auto mb-4" aria-hidden="true" />
              <h3 className="text-lg font-medium text-fg-primary mb-2">No plugins found</h3>
              <p className="text-sm text-fg-secondary">Try adjusting your search</p>
            </div>
          )}
        </div>
      )}

      {/* Config Modal */}
      {configModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setConfigModal(null)}>
          <div className="surface-1 rounded-xl border border-border p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-fg-primary">Configure {configModal.plugin.name}</h2>
              <button onClick={() => setConfigModal(null)} className="hit-area p-2 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring">
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <div className="space-y-4">
              {Object.entries(configModal.config).map(([key, value]) => (
                <div key={key} className="space-y-1.5">
                  <label className="text-sm font-medium text-fg-primary capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                  <input
                    type={typeof value === 'boolean' ? 'checkbox' : 'text'}
                    defaultChecked={value as boolean}
                    defaultValue={typeof value === 'boolean' ? '' : value as string}
                    className="hit-area w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfigModal(null)}
                className="hit-area press-scale flex-1 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary font-medium hover:bg-bg-secondary transition-colors focus-ring"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveConfig}
                className="hit-area press-scale flex-1 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}