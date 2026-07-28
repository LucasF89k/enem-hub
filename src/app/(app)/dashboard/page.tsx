import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

import { MetaCard } from "@/components/dashboard/MetaCard"
import { StreakCard } from "@/components/dashboard/StreakCard"
import { TempoHojeCard } from "@/components/dashboard/TempoHojeCard"
import { RevisoesPendentesCard } from "@/components/dashboard/RevisoesPendentesCard"
import { EvolucaoAreaChart } from "@/components/dashboard/EvolucaoAreaChart"
import { PlanoHojeCard } from "@/components/dashboard/PlanoHojeCard"
import { ProximaSessaoCard } from "@/components/dashboard/ProximaSessaoCard"
import { TrailBadge } from "@/components/dashboard/TrailBadge"
import { MedicinaWidget } from "@/components/dashboard/MedicinaWidget"
import {
  MetaSkeleton,
  StreakSkeleton,
  TempoSkeleton,
  RevisoesSkeleton,
  ChartSkeleton,
  PlanoSkeleton,
  ProximaSessaoSkeleton,
  TrailSkeleton,
  MedicinaSkeleton,
} from "@/components/dashboard/DashboardSkeletons"

export const metadata = { title: "Dashboard" }

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const userId = session.user.id

  const profile = await db.userProfile.findUnique({
    where: { userId },
    select: { targetCourse: true },
  })

  const isMedicina =
    !profile?.targetCourse ||
    profile.targetCourse.toLowerCase().includes("medicina")

  return (
    <div className="space-y-6 px-4 py-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">
          Olá{session.user.name ? `, ${session.user.name.split(" ")[0]}` : ""}! 👋
        </h1>
        <p className="text-sm text-muted-foreground">Seu resumo de estudos de hoje</p>
      </div>

      {/* Trail banner — full width */}
      <Suspense fallback={<TrailSkeleton />}>
        <TrailBadge userId={userId} />
      </Suspense>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Row 1: Meta, Streak, Tempo hoje */}
        <Suspense fallback={<MetaSkeleton />}>
          <MetaCard userId={userId} />
        </Suspense>

        <Suspense fallback={<StreakSkeleton />}>
          <StreakCard userId={userId} />
        </Suspense>

        <Suspense fallback={<TempoSkeleton />}>
          <TempoHojeCard userId={userId} />
        </Suspense>

        {/* Row 2: Chart (2 cols), Revisões */}
        <div className="sm:col-span-2">
          <Suspense fallback={<ChartSkeleton />}>
            <EvolucaoAreaChart userId={userId} />
          </Suspense>
        </div>

        <Suspense fallback={<RevisoesSkeleton />}>
          <RevisoesPendentesCard userId={userId} />
        </Suspense>

        {/* Row 3: Plano hoje (2 cols), Próxima sessão */}
        <div className="sm:col-span-2">
          <Suspense fallback={<PlanoSkeleton />}>
            <PlanoHojeCard userId={userId} />
          </Suspense>
        </div>

        <Suspense fallback={<ProximaSessaoSkeleton />}>
          <ProximaSessaoCard userId={userId} />
        </Suspense>

        {/* Medicina widget — full width, shown when targetCourse is Medicina (or default) */}
        {isMedicina && (
          <div className="sm:col-span-2 lg:col-span-3">
            <Suspense fallback={<MedicinaSkeleton />}>
              <MedicinaWidget userId={userId} />
            </Suspense>
          </div>
        )}
      </div>
    </div>
  )
}
