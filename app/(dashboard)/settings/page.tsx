'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { User, Mail, Bell, Globe, Save, Loader2, Check, Shield, Key, Smartphone, QrCode, Trash2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'appearance' | 'security'>('profile')
  const [saving, setSaving] = useState(false)

  // Profile
  const [name, setName] = useState(session?.user?.name || '')
  const [email, setEmail] = useState(session?.user?.email || '')
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || '')

  // Notifications
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [pushNotifications, setPushNotifications] = useState(false)
  const [weeklyDigest, setWeeklyDigest] = useState(true)
  const [securityAlerts, setSecurityAlerts] = useState(true)
  const [billingAlerts, setBillingAlerts] = useState(true)
  const [marketingEmails, setMarketingEmails] = useState(false)

  // Appearance
  const [darkMode, setDarkMode] = useState(false)
  const [compactMode, setCompactMode] = useState(false)
  const [language, setLanguage] = useState('en')
  const [timezone, setTimezone] = useState('UTC')
  const [dateFormat, setDateFormat] = useState('MM/DD/YYYY')

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setDarkMode(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (darkMode) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [darkMode])

  async function handleSaveProfile() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      // update({ name }) // NextAuth update
      toast.success('Profile updated')
    } catch {
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveNotifications() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      toast.success('Notification preferences saved')
    } catch {
      toast.error('Failed to save preferences')
    } finally {
      setSaving(false)
    }
  }

  async function handleSaveAppearance() {
    setSaving(true)
    try {
      await new Promise(r => setTimeout(r, 500))
      toast.success('Appearance settings saved')
    } catch {
      toast.error('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'appearance', label: 'Appearance', icon: Globe },
    { id: 'security', label: 'Security', icon: Shield },
  ] as const

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg-primary">Settings</h1>
        <p className="text-sm text-fg-secondary">Manage your account preferences and security</p>
      </div>

      {/* Tab Navigation */}
      <div className="surface-1 rounded-xl border border-border p-1">
        <div className="flex gap-1" role="tablist">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id as typeof activeTab)}
              className={`hit-area press-scale flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors focus-ring flex items-center justify-center gap-2 ${
                activeTab === id
                  ? 'bg-brand text-white'
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
      <div className="surface-1 rounded-xl border border-border p-6">
        {activeTab === 'profile' && (
          <form onSubmit={e => { e.preventDefault(); handleSaveProfile() }} className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-fg-primary">Profile Information</h2>

            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="h-24 w-24 rounded-full bg-brand/10 flex items-center justify-center text-brand font-bold text-3xl image-outline">
                  {avatarUrl ? <img src={avatarUrl} alt="" className="h-24 w-24 rounded-full image-outline" /> : name?.charAt(0).toUpperCase() || 'U'}
                </div>
                <label className="absolute bottom-0 right-0 hit-area p-2 rounded-full bg-brand text-white hover:bg-brand-hover transition-colors focus-ring cursor-pointer">
                  <input type="file" accept="image/*" className="sr-only" onChange={e => { const file = e.target.files?.[0]; if (file) { const reader = new FileReader(); reader.onload = () => setAvatarUrl(reader.result as string); reader.readAsDataURL(file); }} />
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                </label>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="name" className="text-sm font-medium text-fg-primary">Full Name</label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="hit-area w-full px-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="email" className="text-sm font-medium text-fg-primary">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="hit-area w-full px-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    required
                  />
                  <p className="text-xs text-fg-muted">Changing your email will require verification</p>
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

        {activeTab === 'notifications' && (
          <form onSubmit={e => { e.preventDefault(); handleSaveNotifications() }} className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-fg-primary">Notification Preferences</h2>

            <NotificationGroup title="Product Updates" items={[
              { id: 'weeklyDigest', label: 'Weekly digest email', description: 'Summary of your organization\'s activity', checked: weeklyDigest, onChange: e => setWeeklyDigest(e.target.checked) },
              { id: 'marketingEmails', label: 'Marketing emails', description: 'Tips, announcements, and product news', checked: marketingEmails, onChange: e => setMarketingEmails(e.target.checked) },
            ]} />

            <NotificationGroup title="Security & Alerts" items={[
              { id: 'securityAlerts', label: 'Security alerts', description: 'Suspicious login attempts, new devices', checked: securityAlerts, onChange: e => setSecurityAlerts(e.target.checked) },
              { id: 'billingAlerts', label: 'Billing notifications', description: 'Invoice reminders, payment failures', checked: billingAlerts, onChange: e => setBillingAlerts(e.target.checked) },
            ]} />

            <NotificationGroup title="Real-time" items={[
              { id: 'pushNotifications', label: 'Push notifications', description: 'Browser notifications for mentions and alerts', checked: pushNotifications, onChange: e => setPushNotifications(e.target.checked) },
              { id: 'emailNotifications', label: 'Email notifications', description: 'Email for all real-time events', checked: emailNotifications, onChange: e => setEmailNotifications(e.target.checked) },
            ]} />

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="hit-area press-scale px-6 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Preferences'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'appearance' && (
          <form onSubmit={e => { e.preventDefault(); handleSaveAppearance() }} className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-fg-primary">Appearance</h2>

            <div className="space-y-6">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-fg-primary">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  {['light', 'dark', 'system'].map(mode => (
                    <label key={mode} className={`hit-area p-4 rounded-lg border-2 text-center cursor-pointer transition-colors ${darkMode === (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) ? 'border-brand bg-brand/5' : 'border-border hover:border-brand/50'}`}>
                      <input type="radio" name="theme" value={mode} checked={darkMode === (mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))} onChange={() => setDarkMode(mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches))} className="sr-only" />
                      <div className="flex flex-col items-center gap-2">
                        <div className={`w-12 h-12 rounded-lg mx-auto flex items-center justify-center ${mode === 'dark' ? 'bg-gray-900' : mode === 'light' ? 'bg-white' : 'bg-gradient-to-r from-white to-gray-900'}`}>
                          <span className="text-2xl">{mode === 'dark' ? '🌙' : mode === 'light' ? '☀️' : '💻'}</span>
                        </div>
                        <span className="text-sm font-medium capitalize">{mode}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-fg-primary">Display Density</label>
                <div className="flex gap-3">
                  {['comfortable', 'compact'].map(mode => (
                    <label key={mode} className={`hit-area flex-1 p-4 rounded-lg border-2 text-center cursor-pointer transition-colors ${compactMode === (mode === 'compact') ? 'border-brand bg-brand/5' : 'border-border hover:border-brand/50'}`}>
                      <input type="radio" name="density" value={mode} checked={compactMode === (mode === 'compact')} onChange={() => setCompactMode(mode === 'compact')} className="sr-only" />
                      <span className="text-sm font-medium capitalize">{mode}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="language" className="text-sm font-medium text-fg-primary">Language</label>
                  <select id="language" value={language} onChange={e => setLanguage(e.target.value)} className="hit-area w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="ja">Japanese</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="timezone" className="text-sm font-medium text-fg-primary">Timezone</label>
                  <select id="timezone" value={timezone} onChange={e => setTimezone(e.target.value)} className="hit-area w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                    <option value="UTC">UTC</option>
                    <option value="America/New_York">Eastern Time</option>
                    <option value="America/Chicago">Central Time</option>
                    <option value="America/Denver">Mountain Time</option>
                    <option value="America/Los_Angeles">Pacific Time</option>
                    <option value="Europe/London">London</option>
                    <option value="Europe/Paris">Paris</option>
                    <option value="Asia/Tokyo">Tokyo</option>
                    <option value="Asia/Shanghai">Shanghai</option>
                    <option value="Australia/Sydney">Sydney</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="dateFormat" className="text-sm font-medium text-fg-primary">Date Format</label>
                <select id="dateFormat" value={dateFormat} onChange={e => setDateFormat(e.target.value)} className="hit-area w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20">
                  <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                  <option value="DD/MM/YYYY">DD/MM/YYYY (UK/EU)</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
                  <option value="MMM D, YYYY">MMM D, YYYY</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button type="submit" disabled={saving} className="hit-area press-scale px-6 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'security' && (
          <div className="space-y-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-fg-primary">Security Settings</h2>
            <p className="text-sm text-fg-secondary">Manage your authentication and account security</p>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-md font-semibold text-fg-primary flex items-center gap-2"><Key className="h-5 w-5" aria-hidden="true" /> Password</h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-fg-primary">Change Password</p>
                  <p className="text-sm text-fg-secondary">Last changed 3 months ago</p>
                </div>
                <button className="hit-area press-scale px-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring">Change Password</button>
              </div>
            </div>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-md font-semibold text-fg-primary flex items-center gap-2"><Shield className="h-5 w-5" aria-hidden="true" /> Two-Factor Authentication (2FA)</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg-primary">Authenticator App (TOTP)</p>
                    <p className="text-sm text-fg-secondary">Enabled — Last used 2 hours ago</p>
                  </div>
                  <button className="hit-area press-scale px-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring">Manage</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg-primary">Security Keys (WebAuthn)</p>
                    <p className="text-sm text-fg-secondary">2 keys registered</p>
                  </div>
                  <button className="hit-area press-scale px-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring">Manage Keys</button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg-primary">Backup Codes</p>
                    <p className="text-sm text-fg-secondary">4 codes remaining</p>
                  </div>
                  <button className="hit-area press-scale px-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring">Regenerate Codes</button>
                </div>
              </div>
            </div>

            <div className="surface-1 rounded-xl border border-border p-6 space-y-6">
              <h3 className="text-md font-semibold text-fg-primary flex items-center gap-2"><Smartphone className="h-5 w-5" aria-hidden="true" /> Active Sessions</h3>
              <p className="text-sm text-fg-secondary">Manage devices logged into your account</p>
              <div className="space-y-3">
                <SessionRow current={true} device="Chrome on macOS" location="San Francisco, CA" lastActive="Current session" />
                <SessionRow current={false} device="Chrome on iOS" location="New York, NY" lastActive="2 hours ago" />
                <SessionRow current={false} device="Firefox on Windows" location="London, UK" lastActive="3 days ago" />
              </div>
              <button className="hit-area press-scale w-full py-2 rounded-lg border border-error bg-error-bg text-error font-medium hover:bg-error-bg/50 transition-colors focus-ring">Revoke All Other Sessions</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function NotificationGroup({ title, items }: { title: string; items: Array<{ id: string; label: string; description: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> }) {
  return (
    <div className="surface-1 rounded-xl border border-border p-6 space-y-4">
      <h3 className="text-md font-semibold text-fg-primary">{title}</h3>
      <div className="space-y-3">
        {items.map(item => (
          <label key={item.id} className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              id={item.id}
              checked={item.checked}
              onChange={item.onChange}
              className="mt-1 h-4 w-4 rounded border-border bg-bg-primary text-brand focus:ring-brand focus:ring-2"
            />
            <div className="flex-1">
              <p className="font-medium text-fg-primary">{item.label}</p>
              <p className="text-sm text-fg-secondary">{item.description}</p>
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

function SessionRow({ current, device, location, lastActive }: { current: boolean; device: string; location: string; lastActive: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-bg-secondary">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-brand/10 flex items-center justify-center">
          <svg className="h-5 w-5 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" /></svg>
        </div>
        <div>
          <p className="font-medium text-fg-primary">{device}</p>
          <p className="text-sm text-fg-secondary">{location}</p>
        </div>
        {current && <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-medium bg-brand/10 text-brand">Current</span>}
      </div>
      <div className="text-right">
        <p className="text-sm text-fg-primary">{lastActive}</p>
        <p className="text-xs text-fg-muted">Active now</p>
      </div>
    </div>
  )
}