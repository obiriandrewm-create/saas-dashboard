import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  useSession: () => ({
    data: null,
    status: 'unauthenticated',
  }),
  signIn: vi.fn(),
  signOut: vi.fn(),
}))

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
  Toaster: () => null,
}))

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}))

// Mock lucide-react
vi.mock('lucide-react', () => {
  const icons = ['Loader2', 'Mail', 'Lock', 'Eye', 'EyeOff', 'Github', 'Chrome', 'Window', 'Users', 'CreditCard', 'Plug', 'FileText', 'Key', 'LogOut', 'Menu', 'X', 'ChevronDown', 'Bell', 'Search', 'Sun', 'Moon', 'User', 'ShieldCheck', 'Activity', 'TrendingUp', 'CheckCircle', 'AlertCircle', 'Info', 'AlertTriangle']
  const mockIcons: Record<string, React.FC> = {}
  for (const name of icons) {
    mockIcons[name] = ({ className, ...props }: any) => (
      <svg className={className} {...props} data-testid={`icon-${name.toLowerCase()}`} />
    )
  }
  return mockIcons
})

// Global test utilities
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))