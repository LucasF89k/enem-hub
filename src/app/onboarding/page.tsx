import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { OnboardingSteps } from "./onboarding-steps"

export const metadata = { title: "Configurar perfil — Vion" }

export default async function OnboardingPage() {
  const session = await auth()
  if (!session) redirect("/login")

  return <OnboardingSteps defaultName={session.user.name ?? ""} />
}
