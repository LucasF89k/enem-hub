import { Skeleton } from "@/components/ui/skeleton"

export default function QuestionsLoading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
      <div className="space-y-1.5">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="h-4 w-52" />
      </div>
      {/* Filters row */}
      <div className="flex gap-2">
        <Skeleton className="h-9 w-full rounded-lg" />
        <Skeleton className="h-9 w-28 rounded-lg shrink-0" />
      </div>
      {/* Question cards */}
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border bg-card p-4 space-y-2.5">
            <div className="flex gap-2">
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  )
}
