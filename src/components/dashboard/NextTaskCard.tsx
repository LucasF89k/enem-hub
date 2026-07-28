import Link from "next/link"

export interface NextTask {
  title: string
  type: string
  duration: number
  href: string
}

/** Uma tarefa por vez. Estado vazio nudge o usuário a gerar o plano. */
export function NextTaskCard({ task }: { task: NextTask | null }) {
  if (!task) {
    return (
      <div className="flex flex-col items-center text-center">
        <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          Comece por aqui
        </p>
        <h2 className="mb-1 text-lg font-normal text-foreground">Monte seu plano de estudos</h2>
        <p className="mb-6 text-sm text-muted-foreground">
          Pra receber uma tarefa recomendada por dia
        </p>
        <Link
          href="/planner"
          className="rounded-full bg-primary px-10 py-3.5 text-sm font-medium text-primary-foreground"
        >
          Gerar seu plano
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center text-center">
      <p className="mb-2 text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
        Um passo de cada vez
      </p>
      <h2 className="mb-1 text-lg font-normal text-foreground">{task.title}</h2>
      <p className="text-sm text-muted-foreground">
        {task.type} · {task.duration} min
      </p>
    </div>
  )
}
