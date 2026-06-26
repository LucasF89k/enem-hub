import { LoginForm } from "./login-form"

export const metadata = { title: "Entrar" }

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams
  return <LoginForm callbackUrl={callbackUrl} />
}
