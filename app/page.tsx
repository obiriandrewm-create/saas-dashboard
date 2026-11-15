import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-20">
      <div className="max-w-2xl text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-wrap-balance text-fg-primary">
            SaaS Dashboard
          </h1>
          <p className="text-lg sm:text-xl text-fg-secondary text-wrap-pretty max-w-xl mx-auto">
            Production-ready multi-tenant SaaS dashboard with authentication, RBAC, billing, and plugin architecture.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="hit-area inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-6 py-3 text-base font-medium text-white hover:bg-brand-hover transition-colors focus-ring"
          >
            Sign In
          </Link>
          <Link
            href="/register"
            className="hit-area inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-transparent px-6 py-3 text-base font-medium text-fg-primary hover:bg-bg-secondary transition-colors focus-ring"
          >
            Create Account
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left max-w-xl mx-auto">
          <FeatureCard
            icon="ShieldCheck"
            title="Authentication"
            description="Email/password, OAuth2/OIDC, TOTP, WebAuthn, session management"
          />
          <FeatureCard
            icon="Users"
            title="Organizations & RBAC"
            description="Hierarchical roles, resource-level permissions, invitations, impersonation audit"
          />
          <FeatureCard
            icon="CreditCard"
            title="Billing"
            description="Stripe subscriptions, usage-based billing, customer portal, webhook reconciliation"
          />
        </div>

        <p className="text-sm text-fg-muted">
          Built with Next.js 15, React 19, Prisma, NextAuth.js v5, Tailwind CSS v4, Radix UI
        </p>
      </div>
    </main>
  )
}

function FeatureCard({ icon: IconName, title, description }: { icon: string; title: string; description: string }) {
  const Icon = (await import('lucide-react'))[IconName as keyof typeof import('lucide-react')]
  return (
    <div className="surface-1 rounded-xl border border-border p-6 space-y-3 transition-shadow hover:shadow-md">
      <Icon className="h-6 w-6 text-brand" aria-hidden="true" />
      <h3 className="text-lg font-semibold text-fg-primary">{title}</h3>
      <p className="text-sm text-fg-secondary">{description}</p>
    </div>
  )
}