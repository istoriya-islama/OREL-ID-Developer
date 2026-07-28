export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-dark-border rounded-lg ${className}`} />
  )
}
