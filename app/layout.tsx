import type { Metadata, Viewport } from 'next'
import { sans, mono } from '@/lib/fonts'
import '@/styles/globals.css'
import { Providers } from '@/components/Providers'

export const metadata: Metadata = {
  title: {
    default: 'SaaS Dashboard',
    template: '%s | SaaS Dashboard',
  },
  description: 'Production-ready multi-tenant SaaS dashboard with authentication, RBAC, and billing',
  keywords: ['SaaS', 'dashboard', 'authentication', 'RBAC', 'billing', 'multi-tenant'],
  authors: [{ name: 'SaaS Dashboard' }],
  creator: 'SaaS Dashboard',
  publisher: 'SaaS Dashboard',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'SaaS Dashboard',
    title: 'SaaS Dashboard',
    description: 'Production-ready multi-tenant SaaS dashboard',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SaaS Dashboard',
    description: 'Production-ready multi-tenant SaaS dashboard',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#1a1a1a' },
  ],
  colorScheme: 'light dark',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" class={`${sans.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className="min-h-screen bg-bg-primary text-fg-primary antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}