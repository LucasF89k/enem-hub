import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user?.id) redirect("/login")

  // Busca imagem/nome do banco (avatar atualiza na hora após upload) + XP/nível para a barra
  const [dbUser, profile] = await Promise.all([
    db.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, image: true },
    }),
    db.userProfile.findUnique({
      where: { userId: session.user.id },
      select: { currentLevel: true, totalXP: true },
    }),
  ])

  const user = {
    name: dbUser?.name ?? session.user.name ?? null,
    image: dbUser?.image ?? session.user.image ?? null,
    level: profile?.currentLevel ?? 1,
    totalXP: profile?.totalXP ?? 0,
  }

  return <AppShell user={user}>{children}</AppShell>
}
