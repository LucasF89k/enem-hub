import { type PrismaClient } from "@prisma/client"

export async function seedCH(prisma: PrismaClient) {
  console.log("  Seeding Ciências Humanas...")

  const area = await prisma.area.upsert({
    where: { slug: "ciencias-humanas" },
    update: {},
    create: {
      name: "Ciências Humanas",
      slug: "ciencias-humanas",
      description: "História, Geografia, Filosofia e Sociologia",
      icon: "Globe",
      color: "orange",
      order: 2,
    },
  })

  // ── HISTÓRIA (15 tópicos) ─────────────────────────────────
  const historia = await prisma.discipline.upsert({
    where: { slug: "historia" },
    update: {},
    create: { areaId: area.id, name: "História", slug: "historia", icon: "Landmark", order: 1 },
  })

  const historiaTopics = [
    { name: "Antiguidade e Civilizações Clássicas",   slug: "hist-antiguidade",        importance: 3, frequency: 3, order: 1  },
    { name: "Feudalismo e Idade Média",               slug: "hist-feudalismo",         importance: 3, frequency: 3, order: 2  },
    { name: "Expansão Marítima e Colonialismo",       slug: "hist-expansao-maritima",  importance: 4, frequency: 4, order: 3  },
    { name: "Brasil Colonial — Exploração e Soc.",    slug: "hist-brasil-colonial",    importance: 5, frequency: 5, order: 4  },
    { name: "Revoluções Burguesas — Francesa e Ind.", slug: "hist-revolucoes-bourg",   importance: 4, frequency: 4, order: 5  },
    { name: "Brasil Império e Independência",         slug: "hist-brasil-imperio",     importance: 4, frequency: 4, order: 6  },
    { name: "Imperialismo e Neocolonialismo",         slug: "hist-imperialismo",       importance: 4, frequency: 4, order: 7  },
    { name: "Primeira Guerra Mundial",                slug: "hist-primeira-guerra",    importance: 4, frequency: 4, order: 8  },
    { name: "Totalitarismos e Entreguerras",          slug: "hist-totalitarismos",     importance: 5, frequency: 5, order: 9  },
    { name: "Segunda Guerra Mundial e Holocausto",    slug: "hist-segunda-guerra",     importance: 5, frequency: 5, order: 10 },
    { name: "Guerra Fria e Mundo Bipolar",            slug: "hist-guerra-fria",        importance: 5, frequency: 5, order: 11 },
    { name: "Brasil República — Era Vargas",          slug: "hist-era-vargas",         importance: 5, frequency: 5, order: 12 },
    { name: "Ditadura Militar no Brasil (1964–85)",   slug: "hist-ditadura-militar",   importance: 5, frequency: 5, order: 13 },
    { name: "Redemocratização e Brasil Contemp.",     slug: "hist-redemocratizacao",   importance: 4, frequency: 4, order: 14 },
    { name: "Renascimento, Reformas e Iluminismo",    slug: "hist-renascimento-ref",   importance: 3, frequency: 3, order: 15 },
  ]

  for (const t of historiaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: historia.id, ...t },
    })
  }

  // ── GEOGRAFIA (15 tópicos) ────────────────────────────────
  const geografia = await prisma.discipline.upsert({
    where: { slug: "geografia" },
    update: {},
    create: { areaId: area.id, name: "Geografia", slug: "geografia", icon: "Map", order: 2 },
  })

  const geografiaTopics = [
    { name: "Cartografia e Leitura de Mapas",         slug: "geo-cartografia",         importance: 4, frequency: 4, order: 1  },
    { name: "Geopolítica e Ordem Mundial",             slug: "geo-geopolitica",         importance: 5, frequency: 5, order: 2  },
    { name: "Globalização Econômica",                  slug: "geo-globalizacao",        importance: 5, frequency: 5, order: 3  },
    { name: "Conflitos Mundiais e Terrorismo",         slug: "geo-conflitos",           importance: 4, frequency: 4, order: 4  },
    { name: "Migrações e Refugiados",                  slug: "geo-migracoes",           importance: 5, frequency: 5, order: 5  },
    { name: "Fontes de Energia e Matriz Energética",   slug: "geo-energia",             importance: 5, frequency: 5, order: 6  },
    { name: "Climatologia e Mudanças Climáticas",      slug: "geo-climatologia",        importance: 5, frequency: 5, order: 7  },
    { name: "Biomas e Vegetação Brasileira",           slug: "geo-biomas-brasil",       importance: 5, frequency: 5, order: 8  },
    { name: "Geomorfologia — Relevo e Solos",          slug: "geo-relevo-solos",        importance: 3, frequency: 3, order: 9  },
    { name: "Hidrografia e Recursos Hídricos",         slug: "geo-hidrografia",         importance: 4, frequency: 4, order: 10 },
    { name: "Urbanização Brasileira",                  slug: "geo-urbanizacao",         importance: 5, frequency: 5, order: 11 },
    { name: "Agronegócio e Agricultura Familiar",      slug: "geo-agropecuaria",        importance: 4, frequency: 4, order: 12 },
    { name: "Indústria e Desindustrialização",         slug: "geo-industria",           importance: 3, frequency: 3, order: 13 },
    { name: "Questão Ambiental e Desenvolvimento",     slug: "geo-meio-ambiente",       importance: 5, frequency: 5, order: 14 },
    { name: "Desigualdade Regional Brasileira",        slug: "geo-desigualdade-reg",    importance: 4, frequency: 4, order: 15 },
  ]

  for (const t of geografiaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: geografia.id, ...t },
    })
  }

  // ── FILOSOFIA (12 tópicos) ────────────────────────────────
  const filosofia = await prisma.discipline.upsert({
    where: { slug: "filosofia" },
    update: {},
    create: { areaId: area.id, name: "Filosofia", slug: "filosofia", icon: "Brain", order: 3 },
  })

  const filosofiaTopics = [
    { name: "Teoria do Conhecimento — Epistemologia",  slug: "fil-epistemologia",       importance: 4, frequency: 4, order: 1  },
    { name: "Filosofia Antiga — Platão e Aristóteles", slug: "fil-filosofia-antiga",    importance: 4, frequency: 4, order: 2  },
    { name: "Ética e Moral",                           slug: "fil-etica-moral",         importance: 5, frequency: 5, order: 3  },
    { name: "Política — Contrato Social e Estado",     slug: "fil-filosofia-politica",  importance: 5, frequency: 5, order: 4  },
    { name: "Positivismo, Marx e Materialismo",        slug: "fil-positivismo-marx",    importance: 4, frequency: 4, order: 5  },
    { name: "Existencialismo e Fenomenologia",         slug: "fil-existencialismo",     importance: 3, frequency: 3, order: 6  },
    { name: "Nietzsche — Crítica à Moral",             slug: "fil-nietzsche",           importance: 4, frequency: 4, order: 7  },
    { name: "Filosofia da Linguagem e do Sig.",        slug: "fil-linguagem",           importance: 3, frequency: 3, order: 8  },
    { name: "Filosofia da Ciência — Kuhn e Popper",   slug: "fil-ciencia",             importance: 4, frequency: 4, order: 9  },
    { name: "Lógica e Argumentação",                   slug: "fil-logica",              importance: 4, frequency: 4, order: 10 },
    { name: "Bioética e Tecnologia",                   slug: "fil-bioetica",            importance: 4, frequency: 4, order: 11 },
    { name: "Escola de Frankfurt — Teoria Crítica",    slug: "fil-frankfurt",           importance: 3, frequency: 3, order: 12 },
  ]

  for (const t of filosofiaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: filosofia.id, ...t },
    })
  }

  // ── SOCIOLOGIA (8 tópicos) ────────────────────────────────
  const sociologia = await prisma.discipline.upsert({
    where: { slug: "sociologia" },
    update: {},
    create: { areaId: area.id, name: "Sociologia", slug: "sociologia", icon: "Users", order: 4 },
  })

  const sociologiaTopics = [
    { name: "Clássicos — Durkheim, Weber, Marx",       slug: "soc-classicos",           importance: 5, frequency: 5, order: 1  },
    { name: "Cidadania, Democracia e Direitos",         slug: "soc-cidadania",           importance: 5, frequency: 5, order: 2  },
    { name: "Desigualdade Social e Classes",            slug: "soc-desigualdade",        importance: 5, frequency: 5, order: 3  },
    { name: "Movimentos Sociais",                       slug: "soc-movimentos-sociais",  importance: 5, frequency: 5, order: 4  },
    { name: "Etnia, Raça e Racismo",                    slug: "soc-etnia-raca",          importance: 5, frequency: 5, order: 5  },
    { name: "Globalização e Cultura de Massa",          slug: "soc-globalizacao-cult",   importance: 4, frequency: 4, order: 6  },
    { name: "Meios de Comunicação e Indústria Cult.",   slug: "soc-midia-ind-cultural",  importance: 4, frequency: 4, order: 7  },
    { name: "Trabalho — Precarização e Sindicatos",     slug: "soc-trabalho",            importance: 4, frequency: 4, order: 8  },
  ]

  for (const t of sociologiaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: sociologia.id, ...t },
    })
  }

  console.log("  ✓ CH: 4 disciplinas, 50 tópicos")
  return area
}
