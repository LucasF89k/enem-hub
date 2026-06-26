import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

function CardSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-2">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </CardContent>
    </Card>
  )
}

export function MetaSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <Skeleton className="h-2 w-full" />
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  )
}

export function StreakSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-12 w-24" />
        <div className="flex gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-8 rounded-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TempoSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-28" />
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-3">
        <Skeleton className="h-24 w-24 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </CardContent>
    </Card>
  )
}

export function RevisoesSkeleton() {
  return <CardSkeleton rows={2} />
}

export function ChartSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <Skeleton className="h-4 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-52 w-full" />
      </CardContent>
    </Card>
  )
}

export function PlanoSkeleton() {
  return <CardSkeleton rows={3} />
}

export function ProximaSessaoSkeleton() {
  return <CardSkeleton rows={2} />
}

export function MedicinaSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-7 w-7 rounded-lg" />
          <Skeleton className="h-4 w-40" />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Skeleton className="h-14 w-full rounded-lg" />
        <div className="space-y-1.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-7 w-full rounded-lg" />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

export function TrailSkeleton() {
  return (
    <Card>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
          </div>
          <Skeleton className="h-5 w-28 rounded-full" />
        </div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-2 w-full rounded-full" />
      </CardContent>
    </Card>
  )
}
