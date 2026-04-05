interface LoadingStateProps {
  label?: string
  fullScreen?: boolean
}

export function LoadingState({ label = '', fullScreen = false }: LoadingStateProps) {
  if (fullScreen) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <span
          className="h-9 w-9 animate-spin rounded-full border-2 border-slate-300 border-t-slate-600"
          aria-hidden="true"
        ></span>
        <span className="sr-only">{label || 'Loading'}</span>
      </div>
    )
  }

  return (
    <div className="premium-card flex min-h-36 items-center justify-center gap-3 text-sm text-slate-600">
      <span
        className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-500"
        aria-hidden="true"
      ></span>
      <span className="sr-only">{label || 'Loading'}</span>
    </div>
  )
}
