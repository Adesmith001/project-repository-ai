export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="premium-card border-dashed bg-slate-50/70 p-8 text-sm">
      <p className="text-lg font-bold text-slate-900">{title}</p>
      <p className="mt-2 max-w-xl text-slate-600">{description}</p>
    </div>
  )
}
