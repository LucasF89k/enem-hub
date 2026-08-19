/**
 * Splash raiz — some quando o servidor decide pra onde redirecionar
 * (autenticado→/dashboard, senão→/login). Igual ao print 1 do Opal:
 * fundo escuro sólido, um anel fino girando, sem logo grande.
 */
export default function RootLoading() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background">
      <span
        aria-hidden
        className="h-11 w-11 animate-spin rounded-full border-[3px] border-foreground/90 border-t-transparent"
      />
      <span className="sr-only">Carregando…</span>
    </div>
  )
}
