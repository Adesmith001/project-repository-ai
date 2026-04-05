import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../utils/cn'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
}

export function Modal({ open, onClose, title, children, className }: ModalProps) {
  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/30 p-4 backdrop-blur-sm">
      <div className={cn('w-full max-w-2xl premium-card p-6', className)} role="dialog" aria-modal="true">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h3 className="text-xl font-bold text-slate-950">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 transition hover:text-slate-900"
            aria-label="Close modal"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
