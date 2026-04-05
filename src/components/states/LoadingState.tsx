export function LoadingState({ label = '' }: { label?: string }) {
  return (
    <div className="premium-card flex min-h-36 items-center justify-center gap-3 text-sm text-slate-600">
      <span className="h-2.5 w-2.5 animate-soft-pulse rounded-full bg-slate-400" aria-hidden="true"></span>
      <span className="h-2.5 w-2.5 animate-soft-pulse rounded-full bg-slate-300 [animation-delay:120ms]" aria-hidden="true"></span>
      <span className="h-2.5 w-2.5 animate-soft-pulse rounded-full bg-slate-200 [animation-delay:220ms]" aria-hidden="true"></span>
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  )
}
