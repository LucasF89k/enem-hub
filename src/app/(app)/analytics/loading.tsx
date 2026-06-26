import { Skeleton } from "@/components/ui/skeleton"

export default function AnalyticsLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-32" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
        <div className="rounded-xl border bg-card p-4 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
      </div>
    </div>
  )
}
