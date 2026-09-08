"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Medal,
  Users,
  Plus,
  LogIn,
  Copy,
  Check,
  Loader2,
  Crown,
  BookOpen,
  PencilRuler,
  GraduationCap,
  ChevronUp,
  ChevronDown,
  Lock,
} from "lucide-react"
import type { LucideIcon } from "lucide-react"
import type { LeagueTier } from "@prisma/client"
import { cn } from "@/lib/utils"
import { createRankingGroup, joinRankingGroup } from "@/app/actions/ranking.actions"
import {
  LEAGUE_ORDER,
  LEAGUE_META,
  PROMOTE_TOP,
  DEMOTE_BOTTOM,
  MIN_ROOM_FOR_PODIUM,
} from "@/lib/league"

export interface RankEntry {
  userId: string
  name: string | null
  image: string | null
  level: number
  totalXP: number
}

export interface GroupData {
  id: string
  name: string
  code: string
  isOwner: boolean
  members: RankEntry[]
}

export interface LeagueEntry {
  userId: string
  name: string | null
  image: string | null
  level: number
  monthlyXP: number
}

export interface LeagueData {
  tier: LeagueTier
  season: string
  daysLeft: number
  entries: LeagueEntry[]
}

const TIER_ICON: Record<string, LucideIcon> = {
  BookOpen,
  PencilRuler,
  GraduationCap,
  Medal,
  Crown,
}

function initials(name?: string | null) {
  if (!name) return "U"
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
}

const MEDAL = ["text-yellow-500", "text-zinc-400", "text-amber-700"]

function RankList({ entries, myId }: { entries: RankEntry[]; myId: string }) {
  return (
    <div className="divide-y rounded-2xl border">
      {entries.map((e, i) => {
        const isMe = e.userId === myId
        return (
          <div
            key={e.userId}
            className={cn("flex items-center gap-3 px-4 py-3", isMe && "bg-primary/5")}
          >
            <span className="w-6 text-center text-sm font-semibold tabular-nums text-muted-foreground">
              {i < 3 ? <Medal className={cn("mx-auto h-4 w-4", MEDAL[i])} /> : i + 1}
            </span>
            <Avatar className="h-9 w-9">
              <AvatarImage src={e.image ?? undefined} alt={e.name ?? "Avatar"} />
              <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
                {initials(e.name)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className={cn("truncate text-sm", isMe ? "font-semibold" : "font-medium")}>
                {e.name ?? "Estudante"}
                {isMe && <span className="ml-1 text-xs text-primary">(você)</span>}
              </p>
              <p className="text-[11px] text-muted-foreground">Nível {e.level}</p>
            </div>
            <span className="shrink-0 text-sm font-semibold tabular-nums">
              {e.totalXP.toLocaleString("pt-BR")}
              <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">XP</span>
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* LIGA */

/** Faixa de escudos das 5 ligas: a atual destacada, futuras trancadas. */
function LeagueStrip({ tier }: { tier: LeagueTier }) {
  const currentIdx = LEAGUE_ORDER.indexOf(tier)
  return (
    <div className="flex items-center justify-between gap-1">
      {LEAGUE_ORDER.map((t, i) => {
        const meta = LEAGUE_META[t]
        const Icon = TIER_ICON[meta.icon] ?? Medal
        const isCurrent = i === currentIdx
        const locked = i > currentIdx
        return (
          <div key={t} className="flex flex-1 flex-col items-center gap-1">
            <div
              className={cn(
                "flex h-11 w-11 items-center justify-center rounded-2xl ring-2 transition-colors",
                isCurrent ? `bg-card ${meta.ring}` : "bg-muted/40 ring-transparent",
              )}
            >
              {locked ? (
                <Lock className="h-4 w-4 text-muted-foreground/50" />
              ) : (
                <Icon className={cn("h-5 w-5", isCurrent ? meta.color : "text-muted-foreground/60")} />
              )}
            </div>
            <span
              className={cn(
                "text-[9px] font-medium leading-tight",
                isCurrent ? "text-foreground" : "text-muted-foreground/60",
              )}
            >
              {meta.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/** Pódio dos 3 primeiros: 2º · 1º · 3º, estilo Transit. */
function Podium({ top, myId }: { top: LeagueEntry[]; myId: string }) {
  const [second, first, third] = [top[1], top[0], top[2]]
  const slot = (e: LeagueEntry | undefined, place: 1 | 2 | 3) => {
    if (!e) return <div className="flex-1" />
    const size = place === 1 ? "h-16 w-16" : "h-12 w-12"
    const pedestal = place === 1 ? "h-20 bg-primary/15" : place === 2 ? "h-14 bg-muted/50" : "h-10 bg-muted/40"
    const ringColor = place === 1 ? "ring-yellow-400/70" : place === 2 ? "ring-zinc-300/60" : "ring-amber-700/60"
    return (
      <div className="flex flex-1 flex-col items-center gap-1.5">
        {place === 1 && <Crown className="h-4 w-4 text-yellow-400" />}
        <Avatar className={cn(size, "ring-2", ringColor)}>
          <AvatarImage src={e.image ?? undefined} alt={e.name ?? "Avatar"} />
          <AvatarFallback className="bg-primary/15 text-xs font-semibold text-primary">
            {initials(e.name)}
          </AvatarFallback>
        </Avatar>
        <p className={cn("max-w-[80px] truncate text-center text-xs", e.userId === myId ? "font-bold text-primary" : "font-medium")}>
          {e.name ?? "Estudante"}
        </p>
        <p className="text-[11px] font-semibold tabular-nums text-muted-foreground">
          {e.monthlyXP.toLocaleString("pt-BR")}
        </p>
        <div className={cn("mt-0.5 w-full rounded-t-xl", pedestal)}>
          <p className="pt-1 text-center text-sm font-extrabold text-foreground/70">{place}º</p>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-end gap-2 px-2">
      {slot(second, 2)}
      {slot(first, 1)}
      {slot(third, 3)}
    </div>
  )
}

function LeagueTab({ league, myId }: { league: LeagueData | null; myId: string }) {
  if (!league) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border bg-muted/20 py-14 text-center">
        <Medal className="h-10 w-10 text-muted-foreground/40" />
        <p className="font-medium">Sua liga está sendo montada</p>
        <p className="max-w-xs text-sm text-muted-foreground">
          Estude um pouco pra entrar na competição deste mês.
        </p>
      </div>
    )
  }

  const meta = LEAGUE_META[league.tier]
  const { entries } = league
  const showPodium = entries.length >= MIN_ROOM_FOR_PODIUM
  const rest = showPodium ? entries.slice(3) : entries
  const restStartRank = showPodium ? 4 : 1
  const isTop = LEAGUE_ORDER.indexOf(league.tier) === LEAGUE_ORDER.length - 1
  const isBottom = LEAGUE_ORDER.indexOf(league.tier) === 0
  const demoteFrom = Math.max(0, entries.length - DEMOTE_BOTTOM) // índice global

  return (
    <div className="space-y-5">
      <LeagueStrip tier={league.tier} />

      <div className="flex items-center justify-between rounded-2xl border bg-card px-4 py-3">
        <div>
          <p className={cn("text-sm font-bold", meta.color)}>Liga {meta.label}</p>
          <p className="text-[11px] text-muted-foreground">{entries.length} estudantes na sua sala</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold tabular-nums">{league.daysLeft}d</p>
          <p className="text-[10px] text-muted-foreground">até virar</p>
        </div>
      </div>

      {showPodium && <Podium top={entries} myId={myId} />}

      <div className="overflow-hidden rounded-2xl border">
        {rest.map((e, i) => {
          const rank = restStartRank + i
          const globalIdx = showPodium ? i + 3 : i
          const inPromo = globalIdx < PROMOTE_TOP && !isTop
          const inDemote = globalIdx >= demoteFrom && !isBottom && entries.length > PROMOTE_TOP
          const isMe = e.userId === myId
          const showPromoDivider = inPromo && globalIdx === PROMOTE_TOP - 1
          const showDemoteDivider = inDemote && globalIdx === demoteFrom

          return (
            <div key={e.userId}>
              {showDemoteDivider && (
                <div className="flex items-center gap-2 bg-destructive/10 px-4 py-1">
                  <ChevronDown className="h-3 w-3 text-destructive" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-destructive">
                    Zona de queda
                  </span>
                </div>
              )}
              <div
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  isMe && "bg-primary/5",
                  inPromo && !isMe && "bg-emerald-500/[0.06]",
                )}
              >
                <span className="w-6 text-center text-sm font-semibold tabular-nums text-muted-foreground">
                  {rank}
                </span>
                <Avatar className="h-9 w-9">
                  <AvatarImage src={e.image ?? undefined} alt={e.name ?? "Avatar"} />
                  <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
                    {initials(e.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className={cn("truncate text-sm", isMe ? "font-semibold" : "font-medium")}>
                    {e.name ?? "Estudante"}
                    {isMe && <span className="ml-1 text-xs text-primary">(você)</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">Nível {e.level}</p>
                </div>
                {inPromo && <ChevronUp className="h-4 w-4 shrink-0 text-emerald-500" />}
                {inDemote && <ChevronDown className="h-4 w-4 shrink-0 text-destructive" />}
                <span className="shrink-0 text-sm font-semibold tabular-nums">
                  {e.monthlyXP.toLocaleString("pt-BR")}
                  <span className="ml-0.5 text-[10px] font-normal text-muted-foreground">XP</span>
                </span>
              </div>
              {showPromoDivider && (
                <div className="flex items-center gap-2 bg-emerald-500/10 px-4 py-1">
                  <ChevronUp className="h-3 w-3 text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                    Zona de subida: top {PROMOTE_TOP}
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CopyCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code)
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      className="inline-flex items-center gap-1.5 rounded-lg border bg-muted/40 px-2.5 py-1 font-mono text-sm font-semibold tracking-widest hover:bg-muted"
    >
      {code}
      {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  )
}

export function RankingClient({
  myId,
  groups,
  league,
}: {
  myId: string
  groups: GroupData[]
  league: LeagueData | null
}) {
  const router = useRouter()
  const [selectedGroupId, setSelectedGroupId] = useState(groups[0]?.id ?? "")
  const [newName, setNewName] = useState("")
  const [joinCode, setJoinCode] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [joinOpen, setJoinOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const selectedGroup = groups.find((g) => g.id === selectedGroupId) ?? groups[0]

  function handleCreate() {
    startTransition(async () => {
      const res = await createRankingGroup(newName)
      if (res.success) {
        toast.success(`Grupo criado! Código: ${res.code}`)
        setCreateOpen(false)
        setNewName("")
        router.refresh()
      } else toast.error(res.error ?? "Erro ao criar grupo")
    })
  }

  function handleJoin() {
    startTransition(async () => {
      const res = await joinRankingGroup(joinCode)
      if (res.success) {
        toast.success(`Você entrou em "${res.name}"!`)
        setJoinOpen(false)
        setJoinCode("")
        router.refresh()
      } else toast.error(res.error ?? "Erro ao entrar")
    })
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Ranking</h1>
        <p className="text-sm text-muted-foreground">Classificação por XP</p>
      </div>

      <Tabs defaultValue="liga">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="liga">Liga</TabsTrigger>
          <TabsTrigger value="grupos">Amigos</TabsTrigger>
        </TabsList>

        {/* Liga */}
        <TabsContent value="liga" className="mt-4">
          <LeagueTab league={league} myId={myId} />
        </TabsContent>

        {/* Grupos */}
        <TabsContent value="grupos" className="mt-4 space-y-4">
          <div className="flex gap-2">
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <Plus className="h-4 w-4" />
                  Criar grupo
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="gname">Nome do grupo</Label>
                  <Input
                    id="gname"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Ex: Turma do cursinho"
                    maxLength={40}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} disabled={isPending} className="gap-1.5">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Criar e gerar código
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="flex-1 gap-1.5">
                  <LogIn className="h-4 w-4" />
                  Entrar com código
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Entrar em um grupo</DialogTitle>
                </DialogHeader>
                <div className="space-y-1.5">
                  <Label htmlFor="jcode">Código do convite</Label>
                  <Input
                    id="jcode"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Ex: A1B2C3"
                    className="font-mono tracking-widest"
                    maxLength={8}
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleJoin} disabled={isPending} className="gap-1.5">
                    {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                    Entrar
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {groups.length === 0 ? (
            <div className="flex flex-col items-center gap-3 rounded-2xl border bg-muted/20 py-14 text-center">
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="font-medium">Você ainda não está em nenhum grupo</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Crie um grupo e compartilhe o código, ou entre no grupo de um amigo.
              </p>
            </div>
          ) : (
            <>
              {/* Seletor de grupo */}
              {groups.length > 1 && (
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGroupId(g.id)}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selectedGroup?.id === g.id
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted/40",
                      )}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              )}

              {selectedGroup && (
                <>
                  <div className="flex items-center justify-between gap-2 rounded-2xl border px-4 py-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-1.5 truncate text-sm font-semibold">
                        {selectedGroup.isOwner && <Crown className="h-3.5 w-3.5 text-yellow-500" />}
                        {selectedGroup.name}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {selectedGroup.members.length} membro
                        {selectedGroup.members.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="mb-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                        Convite
                      </p>
                      <CopyCode code={selectedGroup.code} />
                    </div>
                  </div>

                  <RankList entries={selectedGroup.members} myId={myId} />
                </>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
