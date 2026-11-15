'use client'

import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { useState } from 'react'
import {
  LayoutDashboard,
  Users,
  Settings,
  CreditCard,
  Plug,
  FileText,
  Key,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Bell,
  Search,
  Sun,
  Moon,
  User,
} from 'lucide-react'
import { signOut } from 'next-auth/react'
import { toast } from 'sonner'

const navigation = [
  { name: 'Overview', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Members', href: '/dashboard/members', icon: Users },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
  { name: 'Plugins', href: '/dashboard/plugins', icon: Plug },
  { name: 'Audit Logs', href: '/dashboard/audit-logs', icon: FileText },
  { name: 'API Keys', href: '/dashboard/api-keys', icon: Key },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    setDarkMode(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setDarkMode(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [darkMode])

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/login' })
    toast.success('Signed out successfully')
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-brand border-t-transparent" />
      </div>
    )
  }

  if (!session) return null

  const currentOrg = session.memberships?.[0]?.organization

  return (
    <div className="min-h-screen bg-bg-secondary">
      {/* Skip Link */}
      <a href="#main" className="skip-link">
        Skip to main content
      </a>

      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 surface-1 border-r border-border transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="complementary"
        aria-label="Sidebar navigation"
      >
        <div className="flex h-full flex-col">
          {/* Sidebar Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2 font-bold text-fg-primary" aria-label="SaaS Dashboard Home">
              <svg className="h-8 w-8 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 9h6v6H9z" />
              </svg>
              <span className="text-lg">SaaS Dashboard</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden hit-area p-2 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary focus-ring"
              aria-label="Close sidebar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1" aria-label="Main navigation">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`hit-area-dense flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors focus-ring ${
                    isActive
                      ? 'bg-brand/10 text-brand'
                      : 'text-fg-secondary hover:bg-bg-tertiary hover:text-fg-primary'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* Organization Switcher */}
          {session.memberships && session.memberships.length > 1 && (
            <div className="border-t border-border p-4">
              <p className="text-xs font-medium text-fg-muted uppercase tracking-wider mb-2">Organization</p>
              <select
                className="hit-area w-full px-3 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                aria-label="Select organization"
              >
                {session.memberships.map((m) => (
                  <option key={m.organization.id} value={m.organization.id}>
                    {m.organization.name} ({m.role})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <div className="lg:pl-64">
        {/* Top Bar */}
        <header className="sticky top-0 z-30 h-16 surface-1 border-b border-border" role="banner">
          <div className="flex h-full items-center justify-between px-4 lg:px-6">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden hit-area p-2 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary focus-ring"
                aria-label="Open sidebar"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="hidden sm:block flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-fg-muted" aria-hidden="true" />
                  <input
                    type="search"
                    placeholder="Search... (⌘K)"
                    className="hit-area w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-bg-primary text-fg-primary placeholder-fg-muted focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 text-sm"
                    aria-label="Search"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Dark Mode Toggle */}
              <button
                onClick={() => setDarkMode(!darkMode)}
                className="hit-area p-2 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary focus-ring"
                aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Notifications */}
              <button className="hit-area p-2 rounded-lg text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary focus-ring relative" aria-label="Notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-error" />
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="hit-area flex items-center gap-2 rounded-lg p-1 hover:bg-bg-tertiary focus-ring"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                  aria-label="User menu"
                >
                  <div className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="" className="h-8 w-8 rounded-full image-outline" />
                    ) : (
                      <User className="h-5 w-5 text-brand" aria-hidden="true" />
                    )}
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-fg-primary">{session.user?.name || 'User'}</p>
                    <p className="text-xs text-fg-muted">{currentOrg?.name}</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-fg-muted" aria-hidden="true" />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} aria-hidden="true" />
                    <div className="absolute right-0 mt-2 w-56 surface-1 rounded-lg border border-border shadow-lg py-1 z-50">
                      <div className="px-4 py-3 border-b border-border">
                        <p className="text-sm font-medium text-fg-primary">{session.user?.name}</p>
                        <p className="text-xs text-fg-muted truncate">{session.user?.email}</p>
                      </div>
                      <Link
                        href="/settings"
                        className="hit-area-dense flex items-center gap-2 px-4 py-2 text-sm text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <User className="h-4 w-4" aria-hidden="true" />
                        Profile
                      </Link>
                      <Link
                        href="/settings/security"
                        className="hit-area-dense flex items-center gap-2 px-4 py-2 text-sm text-fg-secondary hover:text-fg-primary hover:bg-bg-tertiary"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                        Security
                      </Link>
                      <hr className="my-1 border-border" />
                      <button
                        onClick={handleSignOut}
                        className="hit-area-dense flex items-center gap-2 w-full px-4 py-2 text-sm text-error hover:bg-bg-tertiary"
                      >
                        <LogOut className="h-4 w-4" aria-hidden="true" />
                        Sign out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main id="main" role="main" className="p-4 lg:p-6" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  )
}