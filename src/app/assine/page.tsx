import { auth } from "@/lib/auth"
import { PRECOS } from "@/lib/abacatepay"
import { BotaoAssinar } from "@/components/assinatura/BotaoAssinar"
import { BotaoCancelar } from "@/components/assinatura/BotaoCancelar"
import { db } from "@/lib/db"
import { PlanoTipo } from "@prisma/client"
import { Check, Crown, Zap } from "lucide-react"

export const metadata = {
  title: "Assine o Vion Pro",
  description: "Desbloqueie todo o potencial do Vion e estude sem limites.",
}

const BENEFICIOS_PRO = [
  "Sem anúncios",
  "Mentor IA ilimitado",
  "Flashcards manuais ilimitados",
  "Simulados ilimitados",
  "Histórico completo de desempenho",
  "Temas exclusivos",
  "Badge Pro no perfil",
]

const BENEFICIOS_FREE = [
  "5 perguntas/dia ao Mentor IA",
  "Até 20 flashcards manuais",
  "3 simulados por mês",
  "Histórico dos últimos 7 dias",
]

async function getPlanoUsuario() {
  const sessao = await auth()
  if (!sessao?.user?.id) return { plano: PlanoTipo.FREE, pro: false }

  const sub = await db.subscription.findUnique({
    where: { userId: sessao.user.id },
    select: { plano: true, status: true, periodoFim: true },
  })

  if (!sub) return { plano: PlanoTipo.FREE, pro: false }

  const ativa =
    (sub.status === "ATIVA" || sub.status === "TRIAL") &&
    (!sub.periodoFim || sub.periodoFim > new Date())

  return {
    plano: ativa && sub.plano !== PlanoTipo.FREE ? sub.plano : PlanoTipo.FREE,
    pro: ativa && sub.plano !== PlanoTipo.FREE,
    periodoFim: sub.periodoFim,
  }
}

export default async function AssinePage() {
  const { plano, pro } = await getPlanoUsuario()

  const precoMensal = (PRECOS.PRO_MENSAL / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
  const precoAnual = (PRECOS.PRO_ANUAL / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })
  const precoAnualMes = ((PRECOS.PRO_ANUAL / 12) / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  })

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-950 to-zinc-900 text-white">
      <div className="mx-auto max-w-4xl px-4 py-16">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-4 py-1.5 text-sm font-medium text-amber-400 ring-1 ring-amber-500/20">
            <Crown className="h-4 w-4" />
            Vion Pro
          </div>
          <h1 className="text-4xl font-bold tracking-tight">
            Estude sem limites
          </h1>
          <p className="mt-3 text-zinc-400">
            Tudo que você precisa para passar no ENEM e entrar na medicina.
          </p>
        </div>

        {/* Plano atual (se Pro) */}
        {pro && (
          <div className="mb-8 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-center text-amber-300">
            <Crown className="mx-auto mb-1 h-5 w-5" />
            <p className="font-medium">
              Você já é <strong>Vion Pro</strong>!{" "}
              {plano === PlanoTipo.PRO_ANUAL ? "Plano Anual" : "Plano Mensal"} ativo.
            </p>
            <div className="mt-3">
              <BotaoCancelar />
            </div>
          </div>
        )}

        {/* Cards de planos */}
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Free */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-6">
            <div className="mb-1 text-sm font-medium text-zinc-400">Grátis</div>
            <div className="mb-4 text-3xl font-bold">R$0</div>
            <ul className="mb-6 space-y-2">
              {BENEFICIOS_FREE.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-zinc-400">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                  {b}
                </li>
              ))}
              <li className="flex items-start gap-2 text-sm text-zinc-500 line-through">
                <span className="mt-0.5 h-4 w-4 shrink-0" />
                Com anúncios
              </li>
            </ul>
            <div className="rounded-lg border border-zinc-700 py-2.5 text-center text-sm text-zinc-500">
              {plano === PlanoTipo.FREE ? "Plano atual" : "Plano básico"}
            </div>
          </div>

          {/* Pro Mensal */}
          <div className="relative rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/40 to-zinc-900/80 p-6 ring-1 ring-amber-500/20">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-3 py-0.5 text-xs font-semibold text-black">
              MAIS POPULAR
            </div>
            <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-amber-400">
              <Crown className="h-3.5 w-3.5" />
              Pro Mensal
            </div>
            <div className="mb-0.5 text-3xl font-bold">
              {precoMensal}
              <span className="ml-1 text-base font-normal text-zinc-400">/mês</span>
            </div>
            <p className="mb-4 text-xs text-zinc-500">Cancele quando quiser</p>
            <ul className="mb-6 space-y-2">
              {BENEFICIOS_PRO.map((b) => (
                <li key={b} className="flex items-start gap-2 text-sm text-zinc-200">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  {b}
                </li>
              ))}
            </ul>
            {!pro && <BotaoAssinar planoId="PRO_MENSAL" label={`Assinar por ${precoMensal}/mês`} />}
          </div>
        </div>

        {/* Pro Anual (destaque separado) */}
        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 to-zinc-900/60 p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-1 flex items-center gap-1.5 text-sm font-medium text-emerald-400">
                <Zap className="h-3.5 w-3.5" />
                Pro Anual — melhor custo-benefício
              </div>
              <div className="text-2xl font-bold">
                {precoAnual}
                <span className="ml-1 text-sm font-normal text-zinc-400">/ano</span>
              </div>
              <p className="mt-0.5 text-sm text-zinc-500">
                Equivale a {precoAnualMes}/mês — economize ~30%
              </p>
            </div>
            {!pro && (
              <div className="shrink-0">
                <BotaoAssinar
                  planoId="PRO_ANUAL"
                  label={`Assinar anual por ${precoAnual}`}
                  variant="emerald"
                />
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-zinc-600">
          Pagamento seguro via AbacatePay · PIX e Cartão de crédito ·{" "}
          Cancele a qualquer momento
        </p>
      </div>
    </div>
  )
}
