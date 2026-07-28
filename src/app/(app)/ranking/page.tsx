import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { RankingClient, type RankEntry, type GroupData } from "./RankingClient"

export const metadata = { title: "Ranking" }

export default async function RankingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")
  const myId = session.user.id

  const [top, me, memberships] = await Promise.all([
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
  ])

  const global: RankEntry[] = top.map((p) => ({
    userId: p.user.id,
    name: p.user.name,
    image: p.user.image,
    level: p.currentLevel,
    totalXP: p.totalXP,
  }))

  const myXP = me?.totalXP ?? 0
  const myIndex = global.findIndex((e) => e.userId === myId)
  const myRank =
    myIndex >= 0
      ? myIndex + 1
      : (await db.userProfile.count({ where: { totalXP: { gt: myXP } } })) + 1

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

  return (
    <RankingClient myId={myId} global={global} myRank={myRank} myXP={myXP} groups={groups} />
  )
}
