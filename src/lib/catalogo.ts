import { unstable_cache } from "next/cache"
import { db } from "@/lib/db"

/**
 * Catálogo de conteúdo (áreas, disciplinas e tópicos).
 *
 * Esses dados são os mesmos para todo mundo e quase nunca mudam: só quando
 * alguém importa material novo. Mesmo assim eram relidos do banco a cada
 * visita a /study e /study/[area], e não era uma leitura barata: um include
 * aninhado (área -> disciplinas -> tópicos) que traz a árvore inteira só pra
 * contar quantos tópicos existem em cada nó.
 *
 * Aqui a árvore é buscada uma vez, reduzida logo na saída pra só o que as
 * telas usam (nome, slug e a CONTAGEM de tópicos, não a lista) e guardada em
 * cache. Assim a navegação entre as telas de estudo deixa de depender de uma
 * ida ao banco.
 *
 * Sobre `unstable_cache`: no Next 16 ele está marcado como substituído pela
 * diretiva `use cache`, mas `use cache` exige ligar `cacheComponents: true`,
 * que muda o modelo de renderização do app inteiro (todas as rotas passam a
 * ser dinâmicas por padrão, com shell estático em volta). Isso é uma troca
 * de arquitetura ampla demais pra resolver um gargalo pontual, então fica o
 * `unstable_cache`, que resolve isso sem afetar nenhuma outra rota. Se um dia
 * o projeto migrar pra Cache Components, este arquivo é o ponto de troca.
 *
 * O cache é invalidado pela tag "catalogo" (ver revalidateCatalogo abaixo).
 */

export const CATALOGO_TAG = "catalogo"

export interface DisciplinaResumo {
  slug: string
  name: string
  order: number
  topicIds: string[]
}

export interface AreaResumo {
  slug: string
  name: string
  order: number
  disciplines: DisciplinaResumo[]
}

/**
 * Árvore completa do catálogo, com os ids dos tópicos de cada disciplina.
 *
 * Os ids vêm junto porque as telas de progresso precisam cruzar o que o aluno
 * já estudou com o que existe em cada disciplina. São só strings de id, sem o
 * conteúdo dos tópicos, então o payload continua pequeno.
 */
export const getCatalogo = unstable_cache(
  async (): Promise<AreaResumo[]> => {
    const areas = await db.area.findMany({
      orderBy: { order: "asc" },
      select: {
        slug: true,
        name: true,
        order: true,
        disciplines: {
          orderBy: { order: "asc" },
          select: {
            slug: true,
            name: true,
            order: true,
            topics: { select: { id: true } },
          },
        },
      },
    })

    return areas.map((a) => ({
      slug: a.slug,
      name: a.name,
      order: a.order,
      disciplines: a.disciplines.map((d) => ({
        slug: d.slug,
        name: d.name,
        order: d.order,
        topicIds: d.topics.map((t) => t.id),
      })),
    }))
  },
  ["catalogo-arvore"],
  { tags: [CATALOGO_TAG] },
)

/** Uma área só, já reduzida. Reaproveita o mesmo cache da árvore inteira. */
export async function getAreaDoCatalogo(slug: string): Promise<AreaResumo | null> {
  const catalogo = await getCatalogo()
  return catalogo.find((a) => a.slug === slug) ?? null
}

/**
 * Derruba o cache do catálogo.
 *
 * Hoje nada no app escreve área/disciplina/tópico: o catálogo só muda por
 * script de importação, rodado fora do processo do site (e um deploy já
 * limpa o cache de qualquer jeito). Isso existe pro dia em que aparecer uma
 * tela de administração de conteúdo: quem passar a escrever no catálogo
 * chama isto depois de salvar, e as telas de estudo refletem na hora.
 */
export async function revalidateCatalogo() {
  const { revalidateTag } = await import("next/cache")
  // "max": marca como obsoleto e serve o valor antigo enquanto busca o novo
  // em segundo plano, em vez de fazer a próxima visita esperar pela leitura.
  // É o modo recomendado no Next 16; sem o segundo argumento a chamada é
  // depreciada e bloqueia o próximo acesso.
  revalidateTag(CATALOGO_TAG, "max")
}
