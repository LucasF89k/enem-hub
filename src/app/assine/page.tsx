import { auth } from "@/lib/auth"
import { PRECOS } from "@/lib/abacatepay"
import { BotaoAssinar } from "@/components/assinatura/BotaoAssinar"
import { BotaoCancelar } from "@/components/assinatura/BotaoCancelar"
import { db } from "@/lib/db"
import { PlanoTipo } from "@prisma/client"
import { Check, ChevronLeft } from "lucide-react"
import Link from "next/link"

export const metadata = {
  title: "Vion Pro — Compare os planos",
  description: "Desbloqueie todo o potencial do Vion e estude sem limites.",
}

const BENEFICIOS_MENSAL = [
  "Sem anúncios",
  "Mentor IA ilimitado",
  "Flashcards ilimitados",
  "Simulados ilimitados",
  "Histórico completo",
]

const BENEFICIOS_ANUAL = [
  "Tudo do plano Mensal",
  "~30% de desconto",
  "Badge Pro exclusivo",
  "Temas exclusivos",
  "Suporte prioritário",
]

async function getPlanoUsuario() {
  const sessao = await auth()
  if (!sessao?.user?.id) return { plano: PlanoTipo.FREE, pro: false, periodoFim: null }

  const sub = await db.subscription.findUnique({
    where: { userId: sessao.user.id },
    select: { plano: true, status: true, periodoFim: true },
  })

  if (!sub) return { plano: PlanoTipo.FREE, pro: false, periodoFim: null }

  const ativa =
    (sub.status === "ATIVA" || sub.status === "TRIAL") &&
    (!sub.periodoFim || sub.periodoFim > new Date())

  return {
    plano: ativa && sub.plano !== PlanoTipo.FREE ? sub.plano : PlanoTipo.FREE,
    pro: ativa && sub.plano !== PlanoTipo.FREE,
    periodoFim: sub.periodoFim ?? null,
  }
}

function BannerProAtivo({ plano, periodoFim }: { plano: PlanoTipo; periodoFim: Date | null }) {
  return (
    <div className="rounded-2xl border border-amber-400/30 bg-amber-50 p-4 text-center dark:bg-amber-950/30">
      <p className="font-semibold text-amber-700 dark:text-amber-400">
        Você já é <strong>Vion Pro</strong>!{" "}
        {plano === PlanoTipo.PRO_ANUAL ? "Plano Anual" : "Plano Mensal"} ativo.
      </p>
      {periodoFim && (
        <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-500/70">
          Válido até{" "}
          {periodoFim.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "long",
            year: "numeric",
          })}
        </p>
      )}
      <div className="mt-3">
        <BotaoCancelar />
      </div>
    </div>
  )
}

function CardMensal({ pro, precoMensal }: { pro: boolean; precoMensal: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-[#6b21a8] shadow-lg">
      <div className="bg-gradient-to-r from-[#4b2d8f] to-[#7c3aed] px-4 py-1.5 text-center">
        <span className="text-xs font-black uppercase tracking-widest text-white">
          ⭐ Recomendado
        </span>
      </div>
      <div className="bg-white p-5 dark:bg-zinc-900">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white">Mensal</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Estude sem distrações</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 shadow">
            <span className="text-2xl">⭐</span>
          </div>
        </div>
        <ul className="mb-5 space-y-2">
          {BENEFICIOS_MENSAL.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <Check className="h-4 w-4 shrink-0 text-[#6b21a8]" strokeWidth={3} />
              {b}
            </li>
          ))}
        </ul>
        {!pro ? (
          <BotaoAssinar planoId="PRO_MENSAL" label={`Assinar por ${precoMensal}/mês`} variant="purple" />
        ) : (
          <div className="rounded-xl bg-zinc-100 py-3 text-center text-sm font-bold text-zinc-400 dark:bg-zinc-800">
            Plano ativo
          </div>
        )}
      </div>
    </div>
  )
}

function CardAnual({ pro, precoAnual, precoAnualMes }: { pro: boolean; precoAnual: string; precoAnualMes: string }) {
  return (
    <div className="overflow-hidden rounded-2xl border-2 border-zinc-200 shadow dark:border-zinc-700">
      <div className="bg-white p-5 dark:bg-zinc-900">
        <div className="mb-3 flex items-start justify-between">
          <div>
            <div className="mb-0.5 flex items-center gap-2">
              <h2 className="text-lg font-black text-zinc-900 dark:text-white">Anual</h2>
              <span className="rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-black uppercase text-white">
                30% OFF
              </span>
            </div>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Estude o ano todo com desconto</p>
          </div>
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 shadow">
            <span className="text-2xl">🏆</span>
          </div>
        </div>
        <ul className="mb-5 space-y-2">
          {BENEFICIOS_ANUAL.map((b) => (
            <li key={b} className="flex items-center gap-2.5 text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" strokeWidth={3} />
              {b}
            </li>
          ))}
        </ul>
        <div className="mb-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
          <p className="text-center text-xs text-zinc-500 dark:text-zinc-400">
            {precoAnualMes}/mês · cobrado como{" "}
            <strong className="text-zinc-900 dark:text-white">{precoAnual}/ano</strong>
          </p>
        </div>
        {!pro ? (
          <BotaoAssinar planoId="PRO_ANUAL" label={`Assinar anual por ${precoAnual}`} variant="emerald" />
        ) : (
          <div className="rounded-xl bg-zinc-100 py-3 text-center text-sm font-bold text-zinc-400 dark:bg-zinc-800">
            Plano ativo
          </div>
        )}
      </div>
    </div>
  )
}

function Rodape() {
  return (
    <p className="pt-2 text-center text-xs text-zinc-400 dark:text-zinc-600">
      Pagamento seguro via AbacatePay · PIX e Cartão · Cancele quando quiser
    </p>
  )
}

export default async function AssinePage() {
  const { plano, pro, periodoFim } = await getPlanoUsuario()

  const precoMensal = (PRECOS.PRO_MENSAL / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  })
  const precoAnual = (PRECOS.PRO_ANUAL / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 0,
  })
  const precoAnualMes = (PRECOS.PRO_ANUAL / 12 / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  })

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-zinc-950">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 md:px-8">
        <Link
          href="/dashboard"
          className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
        >
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <span className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Compare os planos
        </span>
        <div className="w-9" />
      </div>

      {/* ── MOBILE: banner + mascote flutuante empilhados ── */}
      <div className="md:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/mascote/banner-mobile.png"
          alt="Vion Pro"
          className="w-full object-cover object-center"
          style={{ height: 180 }}
        />
        <div className="relative flex justify-center" style={{ height: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascote/flutuante.png"
            alt=""
            className="absolute z-10 object-contain"
            style={{ width: 160, height: 160, bottom: -80 }}
          />
        </div>

        {/* Cards mobile */}
        <div className="flex-1 space-y-4 bg-white px-4 pb-8 pt-24 dark:bg-zinc-950">
          {pro && <BannerProAtivo plano={plano} periodoFim={periodoFim} />}
          <CardMensal pro={pro} precoMensal={precoMensal} />
          <CardAnual pro={pro} precoAnual={precoAnual} precoAnualMes={precoAnualMes} />
          <Rodape />
        </div>
      </div>

      {/* ── DESKTOP: banner à esquerda, cards à direita ── */}
      <div className="hidden md:flex md:flex-1 md:gap-10 md:px-12 md:py-10 lg:px-20 xl:px-32">
        {/* Coluna esquerda: banner + mascote */}
        <div className="flex w-[420px] shrink-0 flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascote/banner.png"
            alt="Vion Pro"
            className="w-full rounded-2xl object-cover object-center shadow-xl"
            style={{ height: 560 }}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mascote/flutuante.png"
            alt=""
            className="mt-[-60px] w-52 object-contain drop-shadow-2xl"
          />
          <p className="mt-4 text-center text-sm font-semibold text-zinc-500 dark:text-zinc-400">
            Estude sem limites com o Vion Pro
          </p>
        </div>

        {/* Coluna direita: cards + footer */}
        <div className="flex flex-1 flex-col gap-4">
          {pro && <BannerProAtivo plano={plano} periodoFim={periodoFim} />}
          <CardMensal pro={pro} precoMensal={precoMensal} />
          <CardAnual pro={pro} precoAnual={precoAnual} precoAnualMes={precoAnualMes} />
          <Rodape />
        </div>
      </div>
    </div>
  )
}
