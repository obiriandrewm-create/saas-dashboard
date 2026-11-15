'use client'

import { SessionProvider } from 'next-auth/react'
import { ToastProvider } from '@/hooks/useToast'
import { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>{children}</ToastProvider>
    </SessionProvider>
  )
}