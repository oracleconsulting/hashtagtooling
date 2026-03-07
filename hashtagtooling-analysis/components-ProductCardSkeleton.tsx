export function ProductCardSkeleton() {
  return (
    <div className="bg-brand-dark-card border border-brand-dark-border rounded-lg overflow-hidden animate-pulse">
      <div className="h-64 bg-brand-dark" />
      <div className="p-4 space-y-3">
        <div className="h-5 bg-brand-dark rounded w-3/4" />
        <div className="h-4 bg-brand-dark rounded w-full" />
        <div className="h-4 bg-brand-dark rounded w-1/2" />
        <div className="h-6 bg-brand-dark rounded w-1/3" />
        <div className="h-10 bg-brand-dark rounded w-full mt-4" />
      </div>
    </div>
  )
}
