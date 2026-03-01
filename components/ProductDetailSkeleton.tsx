export function ProductDetailSkeleton() {
  return (
    <div className="container mx-auto px-4 py-12 animate-pulse">
      <div className="h-5 bg-brand-dark rounded w-32 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mt-6">
        <div>
          <div className="aspect-square bg-brand-dark rounded-lg mb-4" />
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-brand-dark rounded-lg" />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <div className="h-9 bg-brand-dark rounded w-3/4" />
          <div className="h-8 bg-brand-dark rounded w-1/4" />
          <div className="h-6 bg-brand-dark rounded w-24" />
          <div className="h-4 bg-brand-dark rounded w-full" />
          <div className="h-4 bg-brand-dark rounded w-full" />
          <div className="h-4 bg-brand-dark rounded w-2/3" />
          <div className="h-12 bg-brand-dark rounded w-full mt-6" />
          <div className="h-32 bg-brand-dark rounded w-full mt-6" />
        </div>
      </div>
    </div>
  )
}
