import { type PrismaClient } from "@prisma/client"

export async function seedLCT(prisma: PrismaClient) {
  console.log("  Seeding Linguagens e Códigos...")

  const area = await prisma.area.upsert({
    where: { slug: "linguagens" },
    update: {},
    create: {
      name: "Linguagens e Códigos",
      slug: "linguagens",
      description: "Língua Portuguesa, Literatura, Inglês e Artes",
      icon: "BookOpen",
      color: "blue",
      order: 3,
    },
  })

  // ── LÍNGUA PORTUGUESA (14 tópicos) ───────────────────────
  const portugues = await prisma.discipline.upsert({
    where: { slug: "lingua-portuguesa" },
    update: {},
    create: { areaId: area.id, name: "Língua Portuguesa", slug: "lingua-portuguesa", icon: "Pencil", order: 1 },
  })

  const portuguesTopics = [
    { name: "Gêneros Textuais e Discurso",             slug: "por-generos-textuais",    importance: 5, frequency: 5, order: 1  },
    { name: "Interpretação e Inferência Textual",      slug: "por-interpretacao",       importance: 5, frequency: 5, order: 2  },
    { name: "Coesão e Coerência",                      slug: "por-coesao-coerencia",    importance: 5, frequency: 5, order: 3  },
    { name: "Funções da Linguagem",                    slug: "por-funcoes-linguagem",   importance: 4, frequency: 4, order: 4  },
    { name: "Variação Linguística e Norma Culta",      slug: "por-variacao-ling",       importance: 4, frequency: 4, order: 5  },
    { name: "Morfologia — Classes de Palavras",        slug: "por-morfologia",          importance: 3, frequency: 3, order: 6  },
    { name: "Sintaxe — Análise Oracional",             slug: "por-sintaxe",             importance: 3, frequency: 3, order: 7  },
    { name: "Concordância e Regência",                 slug: "por-concordancia",        importance: 4, frequency: 4, order: 8  },
    { name: "Semântica — Figuras de Linguagem",        slug: "por-semantica-figuras",   importance: 4, frequency: 4, order: 9  },
    { name: "Intertextualidade e Interdiscurso",       slug: "por-intertextualidade",   importance: 5, frequency: 5, order: 10 },
    { name: "Produção Textual — Dissertação",          slug: "por-producao-textual",    importance: 5, frequency: 5, order: 11 },
    { name: "Pontuação e Ortografia",                  slug: "por-pontuacao-ortografia",importance: 3, frequency: 3, order: 12 },
    { name: "Análise Discursiva e Multimodalidade",    slug: "por-analise-discursiva",  importance: 5, frequency: 5, order: 13 },
    { name: "Publicidade e Linguagem Não-Verbal",      slug: "por-publicidade",         importance: 4, frequency: 4, order: 14 },
  ]

  for (const t of portuguesTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: portugues.id, ...t },
    })
  }

  // ── LITERATURA (12 tópicos) ───────────────────────────────
  const literatura = await prisma.discipline.upsert({
    where: { slug: "literatura" },
    update: {},
    create: { areaId: area.id, name: "Literatura", slug: "literatura", icon: "BookMarked", order: 2 },
  })

  const literaturaTopics = [
    { name: "Trovadorismo e Humanismo",                slug: "lit-trovadorismo",        importance: 2, frequency: 2, order: 1  },
    { name: "Quinhentismo e Barroco",                  slug: "lit-barroco",             importance: 3, frequency: 3, order: 2  },
    { name: "Arcadismo",                               slug: "lit-arcadismo",           importance: 2, frequency: 2, order: 3  },
    { name: "Romantismo",                              slug: "lit-romantismo",          importance: 4, frequency: 4, order: 4  },
    { name: "Realismo e Naturalismo",                  slug: "lit-realismo",            importance: 4, frequency: 4, order: 5  },
    { name: "Parnasianismo e Simbolismo",              slug: "lit-parnasianismo-simb",  importance: 3, frequency: 3, order: 6  },
    { name: "Modernismo — 1ª e 2ª Fase",               slug: "lit-modernismo",          importance: 5, frequency: 5, order: 7  },
    { name: "Modernismo — 3ª Fase e Contemporâneo",    slug: "lit-modernismo-3fase",    importance: 4, frequency: 4, order: 8  },
    { name: "Vanguardas Europeias",                    slug: "lit-vanguardas-europeias",importance: 3, frequency: 3, order: 9  },
    { name: "Análise e Interpretação Literária",       slug: "lit-analise-literaria",   importance: 5, frequency: 5, order: 10 },
    { name: "Cordel e Cultura Popular",                slug: "lit-cordel",              importance: 3, frequency: 3, order: 11 },
    { name: "Cânones Literários Africanos e Port.",    slug: "lit-africa-portugal",     importance: 3, frequency: 3, order: 12 },
  ]

  for (const t of literaturaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: literatura.id, ...t },
    })
  }

  // ── INGLÊS (7 tópicos) ───────────────────────────────────
  const ingles = await prisma.discipline.upsert({
    where: { slug: "ingles" },
    update: {},
    create: { areaId: area.id, name: "Inglês", slug: "ingles", icon: "Languages", order: 3 },
  })

  const inglesTopics = [
    { name: "Leitura e Compreensão em Inglês",         slug: "ing-leitura-compreensao", importance: 5, frequency: 5, order: 1  },
    { name: "Vocabulário e Cognatos",                  slug: "ing-vocabulario",         importance: 4, frequency: 4, order: 2  },
    { name: "Gramática Funcional em Contexto",         slug: "ing-gramatica",           importance: 3, frequency: 3, order: 3  },
    { name: "Textos Argumentativos em Inglês",         slug: "ing-textos-argumentat",   importance: 4, frequency: 4, order: 4  },
    { name: "Gêneros Textuais em Inglês",              slug: "ing-generos-textuais",    importance: 4, frequency: 4, order: 5  },
    { name: "Inferência e Estratégia de Leitura",      slug: "ing-inferencia",          importance: 5, frequency: 5, order: 6  },
    { name: "Expressões Idiomáticas e Gírias",         slug: "ing-expressoes-idiom",    importance: 3, frequency: 3, order: 7  },
  ]

  for (const t of inglesTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: ingles.id, ...t },
    })
  }

  // ── ARTES E EDUCAÇÃO FÍSICA (7 tópicos) ──────────────────
  const artes = await prisma.discipline.upsert({
    where: { slug: "artes-educacao-fisica" },
    update: {},
    create: { areaId: area.id, name: "Artes e Ed. Física", slug: "artes-educacao-fisica", icon: "Palette", order: 4 },
  })

  const artesTopics = [
    { name: "Artes Visuais — Estilos e Movimentos",    slug: "art-artes-visuais",       importance: 3, frequency: 3, order: 1  },
    { name: "Música — História e Linguagem",           slug: "art-musica",              importance: 3, frequency: 3, order: 2  },
    { name: "Teatro e Dança",                          slug: "art-teatro-danca",        importance: 2, frequency: 2, order: 3  },
    { name: "Cinema e Audiovisual",                    slug: "art-cinema",              importance: 4, frequency: 4, order: 4  },
    { name: "Cultura Popular Brasileira",              slug: "art-cultura-popular",     importance: 4, frequency: 4, order: 5  },
    { name: "Educação Física — Esporte e Saúde",       slug: "art-educacao-fisica",     importance: 3, frequency: 3, order: 6  },
    { name: "Tecnologia e Linguagens Digitais",        slug: "art-tecnologia-ling",     importance: 4, frequency: 4, order: 7  },
  ]

  for (const t of artesTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: artes.id, ...t },
    })
  }

  console.log("  ✓ LCT: 4 disciplinas, 40 tópicos")
  return area
}
