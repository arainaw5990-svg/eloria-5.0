export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-ink-100 bg-white">
      <div className="aspect-square animate-pulse bg-ink-100" />
      <div className="p-4 space-y-2">
        <div className="h-3 w-16 animate-pulse rounded bg-ink-100" />
        <div className="h-5 w-3/4 animate-pulse rounded bg-ink-100" />
        <div className="flex items-center justify-between">
          <div className="h-5 w-20 animate-pulse rounded bg-ink-100" />
          <div className="h-8 w-20 animate-pulse rounded-full bg-ink-100" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => <ProductCardSkeleton key={i} />)}
    </div>
  );
}
