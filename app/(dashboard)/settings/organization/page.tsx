'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Building, Users, Shield, Globe, Trash2, Loader2, Save, AlertTriangle, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function OrganizationSettingsPage() {
  const { data: session } = useSession()
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'domains' | 'security' | 'danger'>('general')
  const [saving, setSaving] = useState(false)

  // General
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [orgLogo, setOrgLogo] = useState('')

  // Domains
  const [customDomain, setCustomDomain] = useState('')
  const [verifyingDomain, setVerifyingDomain] = useState(false)

  // Security
  const [enforceMFA, setEnforceMFA] = useState(false)
  const [sessionTimeout, setSessionTimeout] = useState(30) // minutes
  const [ipAllowlist, setIpAllowlist] = useState('')

  // Danger zone
  const [deleteConfirm, setDeleteConfirm] = useState('')

  const currentOrg = session?.memberships?.[0]?.organization
  const userRole = session?.memberships?.[0]?.role
  const isOwner = userRole === 'OWNER'
  const isAdmin = userRole === 'ADMIN' || isOwner

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'members', label: 'Members', icon: Users },
    { id: 'domains', label: 'Domains', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: Trash2 },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-fg-primary">Organization Settings</h1>
          <p className="text-sm text-fg-secondary">Manage your organization settings and configuration</p>
        </div>
        {currentOrg && (
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-brand/10 text-brand">
            Plan: {currentOrg.plan}
          </span>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="surface-1 rounded-xl border border-border p-1">
        <div className="flex gap-1" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              disabled={id === 'danger' && !isOwner}
              className={`hit-area press-scale flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors focus-ring flex items-center justify-center gap-2 ${
                activeTab === id
                  ? 'bg-brand text-white'
                  : id === 'danger' && !isOwner
                  ? 'text-fg-muted cursor-not-allowed opacity-50'
                  : 'text-fg-secondary hover:text-fg-primary'
              }`}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="surface-1 rounded-xl border border-border p-6 max-w-3xl">
        {activeTab === 'general' && (
          <form onSubmit={e => { e.preventDefault(); handleSave() }} className="space-y-6">
            <h2 className="text-lg font-semibold text-fg-primary">General Settings</h2>

            <div className="space-y-1.5">
              <label htmlFor="orgName" className="text-sm font-medium text-fg-primary">Organization Name</label>
              <input
                id="orgName"
                type="text"
                value={orgName || currentOrg?.name || ''}
                onChange={e => setOrgName(e.target.value)}
                className="hit-area w-full px-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="orgSlug" className="text-sm font-medium text-fg-primary">Slug (URL)</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-muted">https://app.example.com/</span>
                <input
                  id="orgSlug"
                  type="text"
                  value={orgSlug || currentOrg?.slug || ''}
                  onChange={e => setOrgSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                  className="hit-area w-full pl-4 pr-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  required
                />
              </div>
              <p className="text-xs text-fg-muted">This will be part of your organization's URL. Changing it will update all member links.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-fg-primary">Logo</label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-bold text-2xl image-outline">
                    {orgLogo ? <img src={orgLogo} alt="" className="h-20 w-20 rounded-lg image-outline" /> : 'LOGO'}
                  </div>
                  <label className="absolute bottom-0 right-0 hit-area p-2 rounded-full bg-brand text-white hover:bg-brand-hover transition-colors focus-ring cursor-pointer">
                    <input type="file" accept="image/*" className="sr-only" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => setOrgLogo(reader.result as string); reader.readAsDataURL(file); }} />
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                  </label>
                </div>
                <div>
                  <p className="text-sm text-fg-secondary">Recommended: 200x200px, PNG or SVG</p>
                  <button type="button" className="hit-area press-scale mt-2 px-3 py-1.5 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm hover:bg-bg-secondary transition-colors focus-ring">Remove Logo</button>
                </div>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="hit-area press-scale px-6 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'members' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-fg-primary">Team Members</h2>
              <p className="text-sm text-fg-secondary">Manage member roles and permissions from the <a href="/dashboard/members" className="text-brand hover:underline">Members page</a></p>
            </div>

            <div className="surface-1 rounded-xl border border-border p-6">
              <h3 className="font-semibold text-fg-primary mb-4">Role Hierarchy</h3>
              <div className="space-y-3">
                <RoleRow role="OWNER" description="Full access including billing, organization deletion, and member management" permissions={['All permissions', 'Delete organization', 'Manage billing', 'Invite/remove members', 'Configure SSO']} />
                <RoleRow role="ADMIN" description="Full access except organization deletion" permissions={['All permissions except deletion', 'Manage billing', 'Invite/remove members', 'Configure plugins']} />
                <RoleRow role="MEMBER" description="Standard access for day-to-day work" permissions={['View projects', 'Create/edit projects', 'View analytics', 'Use plugins']} />
                <RoleRow role="VIEWER" description="Read-only access" permissions={['View projects', 'View analytics', 'Comment on projects']} />
              </div>
            </div>

            <div className="surface-1 rounded-xl border border-border p-6">
              <h3 className="font-semibold text-fg-primary mb-4">Custom Roles (Enterprise)</h3>
              <p className="text-sm text-fg-secondary mb-4">Create custom roles with granular permissions for your team's specific needs.</p>
              <button className="hit-area press-scale px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring">
                Create Custom Role
              </button>
            </div>
          </div>
        )}

        {activeTab === 'domains' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-fg-primary">Custom Domains</h2>
            <p className="text-sm text-fg-secondary">Configure a custom domain for your organization (e.g., app.yourcompany.com)</p>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <div className="space-y-1.5">
                <label htmlFor="customDomain" className="text-sm font-medium text-fg-primary">Custom Domain</label>
                <div className="flex gap-3">
                  <input
                    id="customDomain"
                    type="text"
                    value={customDomain}
                    onChange={e => setCustomDomain(e.target.value)}
                    placeholder="app.yourcompany.com"
                    className="hit-area flex-1 px-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                  <button onClick={handleVerifyDomain} disabled={verifyingDomain || !customDomain} className="hit-area press-scale px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50">
                    {verifyingDomain ? 'Verifying...' : 'Verify Domain'}
                  </button>
                </div>
                <p className="text-xs text-fg-muted">Add a CNAME record pointing to <code className="bg-bg-tertiary px-1.5 py-0.5 rounded text-xs font-mono">cname.example.com</code> in your DNS provider.</p>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-fg-primary mb-4">DNS Configuration</h3>
                <div className="surface-1 rounded-lg border border-border p-4 font-mono text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-fg-muted">Type</span><span>CNAME</span></div>
                  <div className="flex justify-between"><span className="text-fg-muted">Name</span><span>app (or your subdomain)</span></div>
                  <div className="flex justify-between"><span className="text-fg-muted">Value</span><span>cname.example.com</span></div>
                  <div className="flex justify-between"><span className="text-fg-muted">TTL</span><span>3600 (1 hour)</span></div>
                </div>
                <p className="text-xs text-fg-muted mt-2">SSL certificates are automatically provisioned via Let's Encrypt after DNS verification.</p>
              </div>

              <div className="border-t border-border pt-6">
                <h3 className="font-semibold text-fg-primary mb-4">SSL Certificate</h3>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg-primary">Automatic SSL</p>
                    <p className="text-sm text-fg-secondary">Automatically provision and renew SSL certificates</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border bg-bg-primary text-brand focus:ring-brand focus:ring-2" />
                    <span className="text-sm text-fg-secondary">Enabled</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-fg-primary">Organization Security</h2>
            <p className="text-sm text-fg-secondary">Configure security policies for your organization</p>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <h3 className="font-semibold text-fg-primary">MFA Enforcement</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-fg-primary">Require MFA for all members</p>
                  <p className="text-sm text-fg-secondary">Members without MFA will be prompted to set it up on next login</p>
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={enforceMFA} onChange={e => setEnforceMFA(e.target.checked)} className="h-4 w-4 rounded border-border bg-bg-primary text-brand focus:ring-brand focus:ring-2" />
                  <span className="text-sm text-fg-secondary">Enforce MFA</span>
                </label>
              </div>
            </div>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <h3 className="font-semibold text-fg-primary">Session Management</h3>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="sessionTimeout" className="text-sm font-medium text-fg-primary">Session Timeout</label>
                  <select id="sessionTimeout" value={sessionTimeout} onChange={e => setSessionTimeout(Number(e.target.value))} className="hit-area w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={60}>1 hour</option>
                    <option value={240}>4 hours</option>
                    <option value={480}>8 hours</option>
                    <option value={1440}>24 hours</option>
                  </select>
                  <p className="text-xs text-fg-muted">Automatically sign out inactive users</p>
                </div>
              </div>
            </div>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <h3 className="font-semibold text-fg-primary">IP Allowlist</h3>
              <p className="text-sm text-fg-secondary">Restrict access to specific IP addresses or ranges (CIDR notation). Leave empty to allow all.</p>
              <textarea
                value={ipAllowlist}
                onChange={e => setIpAllowlist(e.target.value)}
                placeholder="192.168.1.0/24&#10;10.0.0.1/32&#10;2001:db8::/32"
                rows={4}
                className="hit-area w-full px-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary font-mono text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              />
            </div>
          </div>
        )}

        {activeTab === 'danger' && (
          <div className="space-y-6">
            <div className="surface-1 rounded-xl border border-error bg-error-bg/50 p-6">
              <div className="flex items-start gap-4">
                <AlertTriangle className="h-6 w-6 text-error flex-shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="text-lg font-semibold text-error mb-2">Danger Zone</h2>
                  <p className="text-sm text-fg-secondary">These actions are irreversible. Please be absolutely certain before proceeding.</p>
                </div>
              </div>
            </div>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <h3 className="font-semibold text-fg-primary">Transfer Ownership</h3>
              <p className="text-sm text-fg-secondary">Transfer organization ownership to another member. You will become an Admin.</p>
              <div className="flex gap-3">
                <select className="hit-area flex-1 max-w-xs px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                  <option value="">Select a member...</option>
                  <option value="member_1">Sarah Johnson (Admin)</option>
                  <option value="member_2">Mike Rodriguez (Member)</option>
                </select>
                <button className="hit-area press-scale px-4 py-2 rounded-lg border border-warning bg-warning-bg text-warning font-medium hover:bg-warning-bg/50 transition-colors focus-ring">Transfer Ownership</button>
              </div>
            </div>

            <div className="surface-1 rounded-xl border border-error bg-error-bg/50 p-6 space-y-6">
              <h3 className="font-semibold text-error">Delete Organization</h3>
              <p className="text-sm text-fg-secondary">Permanently delete this organization and all its data. This action cannot be undone.</p>
              <div className="space-y-4">
                <p className="text-sm text-fg-secondary">Type the organization name to confirm:</p>
                <input
                  type="text"
                  value={deleteConfirm}
                  onChange={e => setDeleteConfirm(e.target.value)}
                  placeholder="Type organization name to confirm"
                  className="hit-area w-full max-w-md px-4 py-3 rounded-lg border border-error bg-bg-primary text-fg-primary focus:border-error focus:outline-none focus:ring-2 focus:ring-error/20"
                />
                <button disabled={deleteConfirm !== currentOrg?.name} className="hit-area press-scale px-6 py-2.5 rounded-lg bg-error text-white font-medium hover:bg-error/90 transition-colors focus-ring disabled:opacity-50 disabled:cursor-not-allowed">
                  Delete Organization Permanently
                </button>
                <p className="text-xs text-fg-muted">This will delete all projects, members, billing data, and audit logs. This cannot be undone.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RoleRow({ role, description, permissions }: { role: string; description: string; permissions: string[] }) {
  const roleColors = {
    OWNER: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200',
    ADMIN: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200',
    MEMBER: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200',
    VIEWER: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
  }

  return (
    <div className="surface-1 rounded-lg border border-border p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[role as keyof typeof roleColors] || 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'}`}>
              {role}
            </span>
          </div>
          <p className="text-sm text-fg-secondary">{description}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1">
        {permissions.map((p, i) => (
          <span key={i} className="px-2 py-0.5 rounded text-xs bg-bg-tertiary text-fg-secondary font-mono">{p}</span>
        ))}
      </div>
    </div>
  )
}