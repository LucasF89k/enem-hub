import { type PrismaClient } from "@prisma/client"

export async function seedMT(prisma: PrismaClient) {
  console.log("  Seeding Matemática...")

  const area = await prisma.area.upsert({
    where: { slug: "matematica" },
    update: {},
    create: {
      name: "Matemática",
      slug: "matematica",
      description: "Álgebra, Geometria, Estatística e Matemática Aplicada",
      icon: "Calculator",
      color: "purple",
      order: 4,
    },
  })

  // ── ÁLGEBRA E ANÁLISE (13 tópicos) ───────────────────────
  const algebra = await prisma.discipline.upsert({
    where: { slug: "algebra-analise" },
    update: {},
    create: { areaId: area.id, name: "Álgebra e Análise", slug: "algebra-analise", icon: "FunctionSquare", order: 1 },
  })

  const algebraTopics = [
    { name: "Conjuntos e Lógica Matemática",           slug: "mat-conjuntos-logica",    importance: 3, frequency: 3, order: 1  },
    { name: "Funções — Conceito e Domínio",            slug: "mat-funcoes-conceito",    importance: 5, frequency: 5, order: 2  },
    { name: "Função de 1º Grau",                       slug: "mat-funcao-1grau",        importance: 5, frequency: 5, order: 3  },
    { name: "Função de 2º Grau",                       slug: "mat-funcao-2grau",        importance: 5, frequency: 5, order: 4  },
    { name: "Função Exponencial",                      slug: "mat-funcao-exponencial",  importance: 4, frequency: 4, order: 5  },
    { name: "Função Logarítmica",                      slug: "mat-funcao-logaritmica",  importance: 4, frequency: 4, order: 6  },
    { name: "Logaritmos — Propriedades e Cálculo",     slug: "mat-logaritmos",          importance: 4, frequency: 4, order: 7  },
    { name: "Progressões Aritméticas (PA)",            slug: "mat-progressao-aritm",    importance: 4, frequency: 4, order: 8  },
    { name: "Progressões Geométricas (PG)",            slug: "mat-progressao-geom",     importance: 4, frequency: 4, order: 9  },
    { name: "Trigonometria — Triângulo e Círculo",     slug: "mat-trigonometria",       importance: 4, frequency: 4, order: 10 },
    { name: "Equações e Sistemas de Equações",         slug: "mat-equacoes-sistemas",   importance: 4, frequency: 4, order: 11 },
    { name: "Análise Combinatória",                    slug: "mat-combinatoria",        importance: 4, frequency: 4, order: 12 },
    { name: "Probabilidade",                           slug: "mat-probabilidade",       importance: 5, frequency: 5, order: 13 },
  ]

  for (const t of algebraTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: algebra.id, ...t },
    })
  }

  // ── GEOMETRIA E ESTATÍSTICA (13 tópicos) ─────────────────
  const geometria = await prisma.discipline.upsert({
    where: { slug: "geometria-estatistica" },
    update: {},
    create: { areaId: area.id, name: "Geometria e Estatística", slug: "geometria-estatistica", icon: "Shapes", order: 2 },
  })

  const geometriaTopics = [
    { name: "Geometria Plana — Áreas e Perímetros",    slug: "mat-geometria-plana",     importance: 5, frequency: 5, order: 1  },
    { name: "Geometria Espacial — Volumes",            slug: "mat-geometria-espacial",  importance: 5, frequency: 5, order: 2  },
    { name: "Geometria Analítica — Ponto e Reta",      slug: "mat-geo-analitica-reta",  importance: 4, frequency: 4, order: 3  },
    { name: "Geometria Analítica — Circunferência",    slug: "mat-geo-analitica-circ",  importance: 4, frequency: 4, order: 4  },
    { name: "Vetores e Operações",                     slug: "mat-vetores",             importance: 3, frequency: 3, order: 5  },
    { name: "Geometria da Posição — Retas e Planos",   slug: "mat-geo-posicao",         importance: 3, frequency: 3, order: 6  },
    { name: "Semelhança e Congruência de Triângulos",  slug: "mat-semelhanca-triangulos",importance: 4, frequency: 4, order: 7 },
    { name: "Estatística Descritiva — Medidas Cent.",  slug: "mat-estatistica-desc",    importance: 5, frequency: 5, order: 8  },
    { name: "Distribuição de Frequências e Gráficos",  slug: "mat-distribuicao-freq",   importance: 5, frequency: 5, order: 9  },
    { name: "Medidas de Dispersão",                    slug: "mat-dispersao",           importance: 3, frequency: 3, order: 10 },
    { name: "Distribuição Normal e Padronização",      slug: "mat-distribuicao-normal", importance: 3, frequency: 3, order: 11 },
    { name: "Noções de Geometria Fractal",             slug: "mat-fractais",            importance: 2, frequency: 2, order: 12 },
    { name: "Geometria e Arte — Simetria",             slug: "mat-simetria-arte",       importance: 2, frequency: 2, order: 13 },
  ]

  for (const t of geometriaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: geometria.id, ...t },
    })
  }

  // ── MATEMÁTICA APLICADA (9 tópicos) ──────────────────────
  const aplicada = await prisma.discipline.upsert({
    where: { slug: "matematica-aplicada" },
    update: {},
    create: { areaId: area.id, name: "Matemática Aplicada", slug: "matematica-aplicada", icon: "TrendingUp", order: 3 },
  })

  const aplicadaTopics = [
    { name: "Porcentagem e Desconto",                  slug: "mat-porcentagem",         importance: 5, frequency: 5, order: 1  },
    { name: "Juros Simples e Compostos",               slug: "mat-juros",               importance: 5, frequency: 5, order: 2  },
    { name: "Razão e Proporção",                       slug: "mat-razao-proporcao",     importance: 4, frequency: 4, order: 3  },
    { name: "Regra de Três — Simples e Composta",      slug: "mat-regra-tres",          importance: 4, frequency: 4, order: 4  },
    { name: "MMC, MDC e Divisibilidade",               slug: "mat-mmc-mdc",             importance: 3, frequency: 3, order: 5  },
    { name: "Análise de Gráficos e Tabelas",           slug: "mat-graficos-tabelas",    importance: 5, frequency: 5, order: 6  },
    { name: "Funções e Modelagem Matemática",          slug: "mat-modelagem",           importance: 5, frequency: 5, order: 7  },
    { name: "Matemática Financeira — Amortização",     slug: "mat-financeira-amort",    importance: 4, frequency: 4, order: 8  },
    { name: "Sequências e Problemas Contextualizados", slug: "mat-sequencias-contexto", importance: 4, frequency: 4, order: 9  },
  ]

  for (const t of aplicadaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: aplicada.id, ...t },
    })
  }

  console.log("  ✓ MT: 3 disciplinas, 35 tópicos")
  return area
}
