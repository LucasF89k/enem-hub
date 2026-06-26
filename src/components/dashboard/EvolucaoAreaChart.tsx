import { db } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp } from "lucide-react"
import { EvolucaoAreaChartClient } from "./EvolucaoAreaChartClient"

const SHORT_NAME: Record<string, string> = {
  "ciencias-natureza": "CN",
  "ciencias-humanas": "CH",
  linguagens: "LCT",
  matematica: "MT",
}

export async function EvolucaoAreaChart({ userId }: { userId: string }) {
  const areas = await db.area.findMany({
    orderBy: { order: "asc" },
    select: { name: true, slug: true, color: true },
  })

  const areaStats = await Promise.all(
    areas.map(async (area) => {
      const [total, correct] = await Promise.all([
        db.userQuestion.count({
          where: { userId, question: { areaSlug: area.slug } },
        }),
        db.userQuestion.count({
          where: { userId, isCorrect: true, question: { areaSlug: area.slug } },
        }),
      ])
      return {
        area: SHORT_NAME[area.slug] ?? area.name,
        slug: area.slug,
        color: area.color ?? "primary",
        accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
        total,
      }
    })
  )

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Desempenho por área</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <EvolucaoAreaChartClient data={areaStats} />
      </CardContent>
    </Card>
  )
}
