"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Download, Loader2, Trash2 } from "lucide-react"
import { excluirMinhaConta, exportarMeusDados } from "@/app/actions/privacidade.actions"

/**
 * Direitos de privacidade na tela de configurações (LGPD, Art. 18):
 * baixar os próprios dados e excluir a conta.
 *
 * As duas ações pedem a senha antes de rodar, então cada uma abre seu campo
 * em vez de disparar direto no clique. A exclusão pede ainda a palavra
 * EXCLUIR digitada: é irreversível e não pode acontecer por toque errado.
 */
export function PrivacidadeCard() {
  const router = useRouter()
  const [modo, setModo] = useState<"nenhum" | "exportar" | "excluir">("nenhum")
  const [senha, setSenha] = useState("")
  const [confirmacao, setConfirmacao] = useState("")
  const [processando, startTransition] = useTransition()

  function fechar() {
    setModo("nenhum")
    setSenha("")
    setConfirmacao("")
  }

  function handleExportar() {
    startTransition(async () => {
      const res = await exportarMeusDados(senha)
      if (!res.success || !res.dados) {
        toast.error(res.error ?? "Não foi possível exportar.")
        return
      }

      // Baixa como arquivo JSON, sem passar por servidor nenhum: os dados
      // saem da action direto pro disco da pessoa.
      const blob = new Blob([JSON.stringify(res.dados, null, 2)], {
        type: "application/json",
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `meus-dados-vion-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)

      toast.success("Download iniciado.")
      fechar()
    })
  }

  function handleExcluir() {
    if (confirmacao.trim().toUpperCase() !== "EXCLUIR") {
      toast.error('Digite EXCLUIR para confirmar.')
      return
    }
    startTransition(async () => {
      const res = await excluirMinhaConta(senha)
      if (!res.success) {
        toast.error(res.error ?? "Não foi possível excluir a conta.")
        return
      }
      toast.success("Conta excluída.")
      // A sessão agora aponta pra um usuário que não existe mais.
      router.push("/login")
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Privacidade
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Exportar */}
        <div className="space-y-2">
          <p className="text-sm font-medium">Baixar meus dados</p>
          <p className="text-xs text-muted-foreground">
            Um arquivo com tudo que o Vion guarda sobre você: perfil, estudos,
            questões, simulados, redações e anotações.
          </p>

          {modo === "exportar" ? (
            <div className="space-y-2 pt-1">
              <Label htmlFor="senha-exportar" className="text-xs">
                Confirme sua senha
              </Label>
              <Input
                id="senha-exportar"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleExportar} disabled={processando} className="gap-1.5">
                  {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  Baixar
                </Button>
                <Button size="sm" variant="ghost" onClick={fechar} disabled={processando}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button size="sm" variant="outline" onClick={() => setModo("exportar")} className="gap-1.5">
              <Download className="h-4 w-4" />
              Baixar meus dados
            </Button>
          )}
        </div>

        <Separator />

        {/* Excluir */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-destructive">Excluir minha conta</p>
          <p className="text-xs text-muted-foreground">
            Apaga sua conta e todo o seu histórico. Não tem como desfazer.
          </p>

          {modo === "excluir" ? (
            <div className="space-y-2 pt-1">
              <Label htmlFor="senha-excluir" className="text-xs">
                Confirme sua senha
              </Label>
              <Input
                id="senha-excluir"
                type="password"
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                autoComplete="current-password"
              />
              <Label htmlFor="confirmar-excluir" className="text-xs">
                Digite EXCLUIR para confirmar
              </Label>
              <Input
                id="confirmar-excluir"
                value={confirmacao}
                onChange={(e) => setConfirmacao(e.target.value)}
                placeholder="EXCLUIR"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={handleExcluir}
                  disabled={processando}
                  className="gap-1.5"
                >
                  {processando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                  Excluir para sempre
                </Button>
                <Button size="sm" variant="ghost" onClick={fechar} disabled={processando}>
                  Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setModo("excluir")}
              className="gap-1.5 border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="h-4 w-4" />
              Excluir minha conta
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
