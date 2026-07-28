import { ResetPasswordForm } from "./reset-form"

export const metadata = { title: "Redefinir senha" }

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams
  return <ResetPasswordForm token={token ?? ""} />
}
