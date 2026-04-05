export function ErrorState({ message }: { message: string }) {
  return (
    <div className="premium-card border-red-200 bg-red-50/80 p-4 text-sm text-red-700">
      {message}
    </div>
  )
}
