export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm">
      <p className="font-semibold text-slate-800">{title}</p>
      <p className="mt-1 text-slate-600">{description}</p>
    </div>
  )
}
