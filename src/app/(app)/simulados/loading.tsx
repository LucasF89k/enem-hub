import { Skeleton } from "@/components/ui/skeleton"

export default function SimuladosLoading() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-3">
            <div className="flex justify-between items-start">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-3 w-20 rounded-full" />
                <Skeleton className="h-5 w-56" />
                <div className="flex gap-4">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <Skeleton className="h-8 w-20 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
