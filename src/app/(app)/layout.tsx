import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { AppShell } from "@/components/layout/AppShell"

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session) redirect("/login")

  // Fetch image from DB so avatar updates immediately after upload (JWT doesn't auto-refresh)
  const dbUser = session.user.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true, image: true },
      })
    : null

  const user = {
    name: dbUser?.name ?? session.user.name,
    email: dbUser?.email ?? session.user.email,
    image: dbUser?.image ?? session.user.image,
  }

  return <AppShell user={user}>{children}</AppShell>
}
