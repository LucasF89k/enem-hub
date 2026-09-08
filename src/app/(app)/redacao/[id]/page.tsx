import { auth } from "@/lib/auth"
import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { EssayEditor } from "./essay-editor"

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const essay = await db.essay.findUnique({ where: { id }, select: { title: true } })
  return { title: essay ? `${essay.title} · Vion` : "Redação" }
}

export default async function EssayPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const { id } = await params

  const essay = await db.essay.findFirst({
    where: { id, userId: session.user.id },
  })

  if (!essay) notFound()

  return (
    <EssayEditor
      essayId={essay.id}
      theme={essay.theme}
      title={essay.title}
      initialBody={essay.body}
      comp1Score={essay.comp1Score}
      comp2Score={essay.comp2Score}
      comp3Score={essay.comp3Score}
      comp4Score={essay.comp4Score}
      comp5Score={essay.comp5Score}
      totalScore={essay.totalScore}
      feedback={essay.feedback}
      errors={essay.errors}
    />
  )
}
