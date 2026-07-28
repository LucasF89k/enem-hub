import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Medal } from "lucide-react"

export const metadata = { title: "Ranking" }

function initials(name?: string | null) {
  if (!name) return "U"
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

const MEDAL = ["text-yellow-500", "text-zinc-400", "text-amber-700"]

export default async function RankingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const myId = session.user.id

  const [top, me] = await Promise.all([
    db.userProfile.findMany({
      orderBy: { totalXP: "desc" },
      take: 50,
      select: {
        totalXP: true,
        currentLevel: true,
        user: { select: { id: true, name: true, image: true } },
      },
    }),
    db.userProfile.findUnique({ where: { userId: myId }, select: { totalXP: true } }),
  ])

  const myXP = me?.totalXP ?? 0
  const myIndex = top.findIndex((p) => p.user.id === myId)
  // Se estiver fora do top 50, calcula a posição real.
  const myRank =
    myIndex >= 0
      ? myIndex + 1
      : (await db.userProfile.count({ where: { totalXP: { gt: myXP } } })) + 1

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-sm text-muted-foreground">Classificação geral por XP</p>
      </div>

      {/* Sua posição */}
      <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
        <span className="w-8 text-center text-lg font-bold text-primary tabular-nums">
          {myRank}º
        </span>
        <div className="flex-1">
          <p className="text-sm font-semibold">Você</p>
          <p className="text-[11px] text-muted-foreground">
            {myXP.toLocaleString("pt-BR")} XP no total
          </p>
        </div>
        <Medal className="h-5 w-5 text-primary" />
      </div>

      {/* Lista */}
      <div className="divide-y rounded-2xl border">
        {top.map((p, i) => {
          const isMe = p.user.id === myId
          return (
            <div
              key={p.user.id}
              className={cn("flex items-center gap-3 px-4 py-3", isMe && "bg-primary/5")}
            >
              <span className="w-6 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                {i < 3 ? <Medal className={cn("mx-auto h-4 w-4", MEDAL[i])} /> : i + 1}
              </span>
              <Avatar className="h-9 w-9">
                <AvatarImage src={p.user.image ?? undefined} alt={p.user.name ?? "Avatar"} />
                <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
                  {initials(p.user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className={cn("truncate text-sm", isMe ? "font-semibold" : "font-medium")}>
                  {p.user.name ?? "Estudante"}
                  {isMe && <span className="ml-1 text-xs text-primary">(você)</span>}
                </p>
                <p className="text-[11px] text-muted-foreground">Nível {p.currentLevel}</p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums">
                {p.totalXP.toLocaleString("pt-BR")}
                <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">XP</span>
              </span>
            </div>
          )
        })}
      </div>

      <p className="text-center text-[11px] text-muted-foreground">
        Ganhe XP estudando, respondendo questões e revisando flashcards para subir no ranking.
      </p>
    </div>
  )
}
