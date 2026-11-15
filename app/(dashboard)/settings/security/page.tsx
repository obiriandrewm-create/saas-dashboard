'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Shield, Key, Smartphone, QrCode, Check, Loader2, X, Eye, EyeOff, Trash2, Plus, Download, Copy, AlertTriangle, Clock, ArrowRight, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export default function SecuritySettingsPage() {
  const { data: session, update } = useSession()
  const [activeSection, setActiveSection] = useState<'totp' | 'webauthn' | 'backup' | 'password' | 'sessions'>('totp')

  // TOTP
  const [totpEnabled, setTotpEnabled] = useState(false)
  const [totpSecret, setTotpSecret] = useState('')
  const [totpUri, setTotpUri] = useState('')
  const [totpCode, setTotpCode] = useState('')
  const [totpSetupStep, setTotpSetupStep] = useState<'idle' | 'verify' | 'complete'>('idle')
  const [verifyingTotp, setVerifyingTotp] = useState(false)

  // WebAuthn
  const [webauthnKeys, setWebauthnKeys] = useState([
    { id: '1', name: 'YubiKey 5 NFC', type: 'USB/NFC', lastUsed: '2 hours ago', createdAt: '2024-01-15' },
    { id: '2', name: 'iCloud Keychain', type: 'Platform', lastUsed: '5 minutes ago', createdAt: '2024-03-20' },
  ])
  const [registeringKey, setRegisteringKey] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')

  // Backup Codes
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [showBackupCodes, setShowBackupCodes] = useState(false)
  const [regeneratingCodes, setRegeneratingCodes] = useState(false)

  // Password
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState(0)

  const sections = [
    { id: 'totp', label: 'Authenticator App', icon: Smartphone },
    { id: 'webauthn', label: 'Security Keys', icon: Shield },
    { id: 'backup', label: 'Backup Codes', icon: Download },
    { id: 'password', label: 'Password', icon: Key },
  ] as const

  const getPasswordStrength = (pwd: string) => {
    let strength = 0
    if (pwd.length >= 8) strength++
    if (/[A-Z]/.test(pwd)) strength++
    if (/[a-z]/.test(pwd)) strength++
    if (/[0-9]/.test(pwd)) strength++
    if (/[^A-Za-z0-9]/.test(pwd)) strength++
    return strength
  }

  useEffect(() => {
    setPasswordStrength(getPasswordStrength(newPassword))
  }, [newPassword])

  // TOTP Functions
  async function handleEnableTotp() {
    setTotpSetupStep('verify')
    try {
      const res = await fetch('/api/auth/mfa/totp/enable', { method: 'POST' })
      const data = await res.json()
      if (data.secret && data.uri) {
        setTotpSecret(data.secret)
        setTotpUri(data.uri)
      }
    } catch {
      toast.error('Failed to start TOTP setup')
    }
  }

  async function handleVerifyTotp() {
    if (totpCode.length !== 6) return
    setVerifyingTotp(true)
    try {
      const res = await fetch('/api/auth/mfa/totp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: totpCode }),
      })
      if (res.ok) {
        setTotpEnabled(true)
        setTotpSetupStep('complete')
        setTotpCode('')
        toast.success('Authenticator app enabled')
      } else {
        toast.error('Invalid code')
      }
    } catch {
      toast.error('Verification failed')
    } finally {
      setVerifyingTotp(false)
    }
  }

  async function handleDisableTotp() {
    if (!confirm('Disable authenticator app? You\'ll need to set it up again to re-enable.')) return
    try {
      const res = await fetch('/api/auth/mfa/totp/disable', { method: 'POST' })
      if (res.ok) {
        setTotpEnabled(false)
        setTotpSetupStep('idle')
        toast.success('Authenticator app disabled')
      } else {
        toast.error('Failed to disable')
      }
    } catch {
      toast.error('Failed to disable')
    }
  }

  // WebAuthn
  async function handleRegisterKey() {
    if (!newKeyName.trim()) return
    setRegisteringKey(true)
    try {
      // Simulate WebAuthn registration
      await new Promise(r => setTimeout(r, 2000))
      const newKey = {
        id: Date.now().toString(),
        name: newKeyName,
        type: 'USB/NFC',
        lastUsed: 'Just now',
        createdAt: new Date().toISOString().split('T')[0],
      }
      setWebauthnKeys(prev => [...prev, newKey])
      setNewKeyName('')
      toast.success('Security key registered')
    } catch {
      toast.error('Registration failed')
    } finally {
      setRegisteringKey(false)
    }
  }

  async function handleRemoveKey(keyId: string) {
    if (!confirm('Remove this security key?')) return
    setWebauthnKeys(prev => prev.filter(k => k.id !== keyId))
    toast.success('Security key removed')
  }

  // Backup Codes
  async function handleGenerateBackupCodes() {
    setRegeneratingCodes(true)
    try {
      const res = await fetch('/api/auth/mfa/backup-codes/generate', { method: 'POST' })
      const data = await res.json()
      if (data.codes) {
        setBackupCodes(data.codes)
        setShowBackupCodes(true)
        toast.success('New backup codes generated')
      }
    } catch {
      toast.error('Failed to generate codes')
    } finally {
      setRegeneratingCodes(false)
    }
  }

  async function handleDownloadBackupCodes() {
    const content = backupCodes.join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'backup-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Password
  async function handleChangePassword() {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setChangingPassword(true)
    try {
      await new Promise(r => setTimeout(r, 1000))
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed successfully')
    } catch {
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const strengthLabels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-error', 'bg-error', 'bg-warning', 'bg-success', 'bg-success']

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-fg-primary">Security Settings</h1>
        <p className="text-sm text-fg-secondary">Manage your authentication and account security</p>
      </div>

      {/* Section Navigation */}
      <div className="surface-1 rounded-xl border border-border p-1">
        <div className="flex gap-1" role="tablist">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeSection === id}
              onClick={() => setActiveSection(id)}
              className={`hit-area press-scale flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-colors focus-ring flex items-center justify-center gap-2 ${
                activeSection === id
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

      {/* Section Content */}
      <div className="surface-1 rounded-xl border border-border p-6 max-w-2xl">
        {activeSection === 'totp' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-fg-primary">Authenticator App (TOTP)</h2>
                <p className="text-sm text-fg-secondary">Use an authenticator app like Google Authenticator, Authy, or 1Password for two-factor authentication</p>
              </div>
              {totpEnabled ? (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">Enabled</span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">Disabled</span>
              )}
            </div>

            {totpEnabled ? (
              <div className="space-y-4">
                <div className="surface-1 rounded-lg border border-border p-4">
                  <p className="font-medium text-fg-primary mb-2">Authenticator app is active</p>
                  <p className="text-sm text-fg-secondary">You\'ll need to enter a 6-digit code from your authenticator app when signing in.</p>
                  <div className="mt-4 flex gap-3">
                    <button onClick={handleDisableTotp} className="hit-area press-scale px-4 py-2 rounded-lg border border-error bg-error-bg text-error text-sm font-medium hover:bg-error-bg/50 transition-colors focus-ring">
                      Disable Authenticator App
                    </button>
                    <a href="/settings/security?section=backup" className="hit-area press-scale px-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring">
                      Manage Backup Codes
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {totpSetupStep === 'idle' && (
                  <div className="surface-1 rounded-lg border border-border p-6 text-center">
                    <Smartphone className="h-12 w-12 text-brand mx-auto mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-fg-primary mb-2">Enable Authenticator App</h3>
                    <p className="text-sm text-fg-secondary mb-6 max-w-md mx-auto">Scan the QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.) to generate 6-digit codes for two-factor authentication.</p>
                    <button onClick={handleEnableTotp} className="hit-area press-scale px-6 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring">
                      <Smartphone className="h-4 w-4 inline mr-2" aria-hidden="true" />
                      Set Up Authenticator App
                    </button>
                  </div>
                )}

                {totpSetupStep === 'verify' && (
                  <div className="space-y-6">
                    <div className="surface-1 rounded-lg border border-border p-6">
                      <h3 className="text-lg font-semibold text-fg-primary mb-2">Step 1: Scan QR Code</h3>
                      <p className="text-sm text-fg-secondary mb-4">Open your authenticator app and scan this QR code, or enter the secret manually:</p>
                      <div className="flex flex-col items-center gap-4">
                        {totpUri && (
                          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border border-border inline-block">
                            <img
                              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(totpUri)}`}
                              alt="TOTP QR Code"
                              className="h-48 w-48"
                            />
                          </div>
                        )}
                        <div className="text-center">
                          <p className="text-sm text-fg-muted mb-2">Or enter this secret manually:</p>
                          <code className="text-lg font-mono text-fg-primary tracking-widest bg-bg-tertiary px-4 py-2 rounded-lg">{totpSecret}</code>
                        </div>
                      </div>
                    </div>
                    <div className="surface-1 rounded-lg border border-border p-6">
                      <h3 className="text-lg font-semibold text-fg-primary mb-2">Step 2: Enter Code</h3>
                      <p className="text-sm text-fg-secondary mb-4">Enter the 6-digit code from your authenticator app to verify the setup.</p>
                      <div className="flex gap-3 max-w-xs">
                        <input
                          type="text"
                          value={totpCode}
                          onChange={e => setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          placeholder="000000"
                          maxLength={6}
                          className="hit-area flex-1 px-4 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary text-center tracking-widest text-lg focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                          autoComplete="one-time-code"
                          inputMode="numeric"
                        />
                        <button
                          onClick={handleVerifyTotp}
                          disabled={totpCode.length !== 6 || verifyingTotp}
                          className="hit-area press-scale px-6 py-3 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50"
                        >
                          {verifyingTotp ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Verify & Enable'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {totpSetupStep === 'complete' && (
                  <div className="surface-1 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6 text-center">
                    <Check className="h-12 w-12 text-success mx-auto mb-4" aria-hidden="true" />
                    <h3 className="text-lg font-semibold text-fg-primary mb-2">Authenticator App Enabled</h3>
                    <p className="text-sm text-fg-secondary mb-4">Your authenticator app is now set up. You\'ll need to enter a 6-digit code when signing in.</p>
                    <a href="/settings/security?section=backup" className="hit-area press-scale inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring">
                      <Download className="h-4 w-4" aria-hidden="true" />
                      Generate Backup Codes
                    </a>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {activeSection === 'webauthn' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-fg-primary">Security Keys (WebAuthn / FIDO2)</h2>
                <p className="text-sm text-fg-secondary">Register hardware security keys (YubiKey, Titan Key) or use platform authenticators (Touch ID, Windows Hello, Android fingerprint)</p>
              </div>
              <button
                onClick={() => setRegisteringKey(true)}
                disabled={registeringKey}
                className="hit-area press-scale px-4 py-2 rounded-lg bg-brand text-white text-sm font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50"
              >
                <Plus className="h-4 w-4 inline mr-2" aria-hidden="true" />
                Register New Key
              </button>
            </div>

            {registeringKey && (
              <div className="surface-1 rounded-lg border border-brand bg-brand/5 p-6">
                <h3 className="text-lg font-semibold text-fg-primary mb-2">Register New Security Key</h3>
                <p className="text-sm text-fg-secondary mb-4">Insert your security key and touch it when prompted, or use your device\'s built-in authenticator (Touch ID, Windows Hello, etc.)</p>
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label htmlFor="newKeyName" className="text-sm font-medium text-fg-primary">Key Name</label>
                    <input
                      id="newKeyName"
                      type="text"
                      value={newKeyName}
                      onChange={e => setNewKeyName(e.target.value)}
                      placeholder="e.g., YubiKey 5 NFC, iPhone Touch ID"
                      className="hit-area w-full max-w-xs px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={handleRegisterKey} disabled={registeringKey || !newKeyName.trim()} className="hit-area press-scale px-6 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50">
                      {registeringKey ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : 'Register Key'}
                    </button>
                    <button onClick={() => { setRegisteringKey(false); setNewKeyName('') }} className="hit-area press-scale px-6 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary font-medium hover:bg-bg-secondary transition-colors focus-ring">
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3">
              {webauthnKeys.length === 0 ? (
                <div className="surface-1 rounded-xl border border-border p-12 text-center">
                  <Shield className="h-12 w-12 text-fg-muted mx-auto mb-4" aria-hidden="true" />
                  <h3 className="text-lg font-medium text-fg-primary mb-2">No security keys registered</h3>
                  <p className="text-sm text-fg-secondary mb-6">Register a security key for stronger two-factor authentication</p>
                  <button onClick={() => setRegisteringKey(true)} className="hit-area press-scale inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring">
                    <Plus className="h-4 w-4" aria-hidden="true" />
                    Register Security Key
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {webauthnKeys.map(key => (
                    <div key={key.id} className="surface-1 rounded-xl border border-border p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-brand/10 flex items-center justify-center">
                          <Shield className="h-6 w-6 text-brand" aria-hidden="true" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-fg-primary">{key.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-xs text-fg-secondary bg-bg-tertiary">{key.type}</span>
                          </div>
                          <p className="text-sm text-fg-secondary">Added {key.createdAt} • Last used {key.lastUsed}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRemoveKey(key.id)} className="hit-area press-scale px-3 py-1.5 rounded-lg border border-error bg-error-bg text-error text-sm hover:bg-error-bg/50 transition-colors focus-ring">
                          <Trash2 className="h-4 w-4 inline mr-1" aria-hidden="true" />
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeSection === 'backup' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-fg-primary">Backup Codes</h2>
              <p className="text-sm text-fg-secondary">Backup codes let you sign in if you lose access to your authenticator app or security keys. Each code can be used once.</p>
            </div>

            {backupCodes.length === 0 ? (
              <div className="surface-1 rounded-xl border border-border p-12 text-center">
                <Download className="h-12 w-12 text-fg-muted mx-auto mb-4" aria-hidden="true" />
                <h3 className="text-lg font-medium text-fg-primary mb-2">No backup codes generated</h3>
                <p className="text-sm text-fg-secondary mb-6">Generate backup codes to have a fallback sign-in method</p>
                <button onClick={handleGenerateBackupCodes} disabled={regeneratingCodes} className="hit-area press-scale px-6 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50">
                  {regeneratingCodes ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" aria-hidden="true" /> : 'Generate Backup Codes'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-fg-primary">{backupCodes.length} backup codes remaining</p>
                    <p className="text-sm text-fg-secondary">Each code can be used once. Keep them secure.</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={handleDownloadBackupCodes} className="hit-area press-scale px-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring">
                      <Download className="h-4 w-4 inline mr-2" aria-hidden="true" />
                      Download
                    </button>
                    <button onClick={handleGenerateBackupCodes} disabled={regeneratingCodes} className="hit-area press-scale px-4 py-2 rounded-lg border border-warning bg-warning-bg text-warning text-sm font-medium hover:bg-warning-bg/50 transition-colors focus-ring disabled:opacity-50">
                      <ArrowRight className="h-4 w-4 inline mr-2" aria-hidden="true" />
                      Regenerate
                    </button>
                  </div>
                </div>

                {showBackupCodes && (
                  <div className="surface-1 rounded-xl border border-border p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-fg-primary">Your Backup Codes</h3>
                      <button onClick={() => setShowBackupCodes(false)} className="hit-area p-2 rounded-lg text-fg-muted hover:text-fg-primary hover:bg-bg-tertiary focus-ring">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {backupCodes.map((code, i) => (
                        <code key={i} className="bg-bg-tertiary px-3 py-2 rounded-lg font-mono text-fg-primary text-center tracking-widest">{code}</code>
                      ))}
                    </div>
                    <p className="text-xs text-fg-muted mt-4 text-center">Each code can be used once. Store these securely.</p>
                  </div>
                )}

                {!showBackupCodes && (
                  <div className="surface-1 rounded-xl border border-warning bg-warning-bg/50 p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-warning">Backup codes are hidden</p>
                        <p className="text-sm text-fg-secondary">Click to reveal your backup codes. Make sure no one can see your screen.</p>
                      </div>
                      <button onClick={() => setShowBackupCodes(true)} className="hit-area press-scale px-4 py-2 rounded-lg bg-warning text-white font-medium hover:bg-warning/90 transition-colors focus-ring">
                        <Eye className="h-4 w-4 inline mr-2" aria-hidden="true" />
                        Show Codes
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button onClick={handleGenerateBackupCodes} disabled={regeneratingCodes} className="hit-area press-scale px-4 py-2 rounded-lg border border-warning bg-warning-bg text-warning text-sm font-medium hover:bg-warning-bg/50 transition-colors focus-ring disabled:opacity-50">
                    <ArrowRight className="h-4 w-4 inline mr-2" aria-hidden="true" />
                    Regenerate Codes
                  </button>
                  <button onClick={handleDownloadBackupCodes} className="hit-area press-scale px-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm font-medium hover:bg-bg-secondary transition-colors focus-ring">
                    <Download className="h-4 w-4 inline mr-2" aria-hidden="true" />
                    Download .txt
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {activeSection === 'password' && (
          <form onSubmit={e => { e.preventDefault(); handleChangePassword() }} className="space-y-6">
            <h2 className="text-lg font-semibold text-fg-primary">Change Password</h2>
            <p className="text-sm text-fg-secondary">Your password must be at least 8 characters long</p>

            <div className="space-y-1.5">
              <label htmlFor="currentPassword" className="text-sm font-medium text-fg-primary">Current Password</label>
              <div className="relative">
                <input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="hit-area w-full pl-4 pr-12 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  required
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary focus-ring">
                  {showCurrentPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="newPassword" className="text-sm font-medium text-fg-primary">New Password</label>
              <div className="relative">
                <input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="hit-area w-full pl-4 pr-12 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  required
                  minLength={8}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary focus-ring">
                  {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {newPassword && (
                <div className="space-y-1.5" role="status" aria-live="polite">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className="h-full transition-all duration-300"
                        style={{
                          width: `${(passwordStrength / 5) * 100}%`,
                          backgroundColor: strengthColors[passwordStrength - 1] || 'transparent',
                        }}
                      />
                    </div>
                    <span className="text-xs text-fg-muted">{strengthLabels[passwordStrength - 1] || ''}</span>
                  </div>
                  <p className="text-xs text-fg-muted">
                    {newPassword.length < 8 && '• At least 8 characters'}
                    {!/[A-Z]/.test(newPassword) && '• One uppercase letter'}
                    {!/[a-z]/.test(newPassword) && '• One lowercase letter'}
                    {!/[0-9]/.test(newPassword) && '• One number'}
                    {!/[^A-Za-z0-9]/.test(newPassword) && '• One special character'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className="text-sm font-medium text-fg-primary">Confirm New Password</label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="hit-area w-full pl-4 pr-12 py-3 rounded-lg border border-border bg-bg-primary text-fg-primary focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                  required
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-muted hover:text-fg-primary focus-ring">
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-sm text-error" role="alert">Passwords do not match</p>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button type="submit" disabled={changingPassword || newPassword !== confirmPassword || newPassword.length < 8} className="hit-area press-scale px-6 py-2.5 rounded-lg bg-brand text-white font-medium hover:bg-brand-hover transition-colors focus-ring disabled:opacity-50">
                {changingPassword ? <Loader2 className="h-4 w-4 animate-spin inline mr-2" aria-hidden="true" /> : 'Change Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}