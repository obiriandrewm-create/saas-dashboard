'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle, Loader2 } from 'lucide-react'

type ToastType = 'success' | 'info' | 'warning' | 'error' | 'loading'

interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

const politeness: Record<ToastType, 'polite' | 'assertive' | 'off'> = {
  success: 'polite',
  info: 'polite',
  warning: 'assertive',
  error: 'assertive',
  loading: 'off',
}

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5" aria-hidden="true" />,
  info: <Info className="h-5 w-5" aria-hidden="true" />,
  warning: <AlertTriangle className="h-5 w-5" aria-hidden="true" />,
  error: <AlertCircle className="h-5 w-5" aria-hidden="true" />,
  loading: <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />,
}

const colors: Record<ToastType, string> = {
  success: 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800',
  info: 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
  warning: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800',
  error: 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800',
  loading: 'bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-800',
}

interface ToastProps {
  toast: Toast
  onClose: (id: string) => void
}

function ToastItem({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false)

  useEffect(() => {
    if (toast.type !== 'loading' && toast.duration !== 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => onClose(toast.id), 200)
      }, toast.duration ?? 5000)
      return () => clearTimeout(timer)
    }
  }, [toast, onClose])

  return (
    <AnimatePresence mode="wait">
      {!isExiting && (
        <motion.div
          key={toast.id}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
          className={`${colors[toast.type]} border rounded-lg p-4 flex items-start gap-3 shadow-lg`}
          role="status"
          aria-live={politeness[toast.type]}
          aria-atomic="true"
        >
          <div className="flex-shrink-0 mt-0.5">{icons[toast.type]}</div>
          <div className="flex-1">
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
          <button
            onClick={() => {
              setIsExiting(true)
              setTimeout(() => onClose(toast.id), 200)
            }}
            className="flex-shrink-0 p-1 rounded hover:bg-black/5 dark:hover:bg-white/5 transition-colors focus-ring"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4 opacity-50 hover:opacity-100" aria-hidden="true" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface ToasterProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function Toaster({ toasts, onClose }: ToasterProps) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 w-96 max-w-full" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onClose={onClose} />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Hook for using toasts
import { createContext, useContext, useCallback, ReactNode } from 'react'

interface ToastContextType {
  toasts: Toast[]
  toast: (type: ToastType, message: string, duration?: number) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((type: ToastType, message: string, duration?: number) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, type, message, duration }])
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <Toaster toasts={toasts} onClose={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Convenience functions
export const toast = {
  success: (message: string, duration?: number) => ({ type: 'success' as ToastType, message, duration }),
  info: (message: string, duration?: number) => ({ type: 'info' as ToastType, message, duration }),
  warning: (message: string, duration?: number) => ({ type: 'warning' as ToastType, message, duration }),
  error: (message: string, duration?: number) => ({ type: 'error' as ToastType, message, duration }),
  loading: (message: string, duration?: number) => ({ type: 'loading' as ToastType, message, duration }),
}