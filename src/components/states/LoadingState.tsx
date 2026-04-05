export function LoadingState({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex min-h-36 items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-600">
      {label}
    </div>
  )
}
