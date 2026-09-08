import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { RankingClient, type GroupData, type LeagueData } from "./RankingClient"
import { ensureLeagueMembership, seasonKey, daysUntilRollover } from "@/lib/league"
import { runDueLeagueRollover } from "@/lib/league-rollover"

export const metadata = { title: "Ranking" }

export default async function RankingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const myId = session.user.id

  // Virada de temporada, modo lazy (idempotente).
  await runDueLeagueRollover().catch(() => {})

  // Garante que estou numa sala da season atual.
  const myMembership = await ensureLeagueMembership(myId).catch(() => null)

  const [memberships, myProfile] = await Promise.all([
    db.rankingGroupMember.findMany({
      where: { userId: myId },
      orderBy: { joinedAt: "asc" },
      select: {
        group: {
          select: {
            id: true,
            name: true,
            code: true,
            ownerId: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    image: true,
                    profile: { select: { totalXP: true, currentLevel: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
    db.userProfile.findUnique({ where: { userId: myId }, select: { currentTier: true } }),
  ])

  const groups: GroupData[] = memberships.map(({ group }) => ({
    id: group.id,
    name: group.name,
    code: group.code,
    isOwner: group.ownerId === myId,
    members: group.members
      .map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        image: m.user.image,
        level: m.user.profile?.currentLevel ?? 1,
        totalXP: m.user.profile?.totalXP ?? 0,
      }))
      .sort((a, b) => b.totalXP - a.totalXP),
  }))

  // ── Dados da sala de liga ──
  let league: LeagueData | null = null
  if (myMembership) {
    const roomMembers = await db.leagueMembership.findMany({
      where: { roomId: myMembership.roomId },
      orderBy: { monthlyXP: "desc" },
      select: {
        monthlyXP: true,
        user: { select: { id: true, name: true, image: true, profile: { select: { currentLevel: true } } } },
      },
    })
    league = {
      tier: myProfile?.currentTier ?? "INICIANTE",
      season: seasonKey(),
      daysLeft: daysUntilRollover(),
      entries: roomMembers.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        image: m.user.image,
        level: m.user.profile?.currentLevel ?? 1,
        monthlyXP: m.monthlyXP,
      })),
    }
  }

  return <RankingClient myId={myId} groups={groups} league={league} />
}
