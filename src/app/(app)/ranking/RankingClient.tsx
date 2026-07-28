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
import { Medal, Users, Plus, LogIn, Copy, Check, Loader2, Crown } from "lucide-react"
import { cn } from "@/lib/utils"
import { createRankingGroup, joinRankingGroup } from "@/app/actions/ranking.actions"

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
  global,
  myRank,
  myXP,
  groups,
}: {
  myId: string
  global: RankEntry[]
  myRank: number
  myXP: number
  groups: GroupData[]
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

      <Tabs defaultValue="geral">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="grupos">Grupos</TabsTrigger>
        </TabsList>

        {/* ── Geral ── */}
        <TabsContent value="geral" className="mt-4 space-y-4">
          <div className="flex items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 px-4 py-3">
            <span className="w-8 text-center text-lg font-bold text-primary tabular-nums">
              {myRank}º
            </span>
            <div className="flex-1">
              <p className="text-sm font-semibold">Você</p>
              <p className="text-[11px] text-muted-foreground">
                {myXP.toLocaleString("pt-BR")} XP no total
              </p>
            </div>
            <Medal className="h-5 w-5 text-primary" />
          </div>
          <RankList entries={global} myId={myId} />
        </TabsContent>

        {/* ── Grupos ── */}
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
