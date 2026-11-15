import Link from 'next/link'
import { sans } from '@/lib/fonts'
import { Providers } from '@/components/Providers'

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${sans.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-bg-secondary flex items-center justify-center px-4 py-12">
        <Providers>
          <div className="w-full max-w-md">
            <div className="mb-8 text-center">
              <Link href="/" className="inline-flex items-center gap-2 text-brand hover:underline focus-ring rounded">
                <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M9 9h6v6H9z" />
                </svg>
                <span className="text-xl font-bold text-fg-primary">SaaS Dashboard</span>
              </Link>
            </div>
            <div className="surface-1 rounded-2xl border border-border p-8 shadow-lg">
              {children}
            </div>
            <p className="mt-6 text-center text-sm text-fg-muted">
              By continuing, you agree to our <Link href="/terms" className="underline hover:text-brand">Terms of Service</Link> and <Link href="/privacy" className="underline hover:text-brand">Privacy Policy</Link>.
            </p>
          </div>
        </Providers>
      </body>
    </html>
  )
}