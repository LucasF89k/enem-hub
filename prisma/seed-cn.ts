import { type PrismaClient } from "@prisma/client"

export async function seedCN(prisma: PrismaClient) {
  console.log("  Seeding Ciências da Natureza...")

  const area = await prisma.area.upsert({
    where: { slug: "ciencias-natureza" },
    update: {},
    create: {
      name: "Ciências da Natureza",
      slug: "ciencias-natureza",
      description: "Biologia, Química e Física",
      icon: "Microscope",
      color: "green",
      order: 1,
    },
  })

  // ── BIOLOGIA (22 tópicos) ────────────────────────────────
  const biologia = await prisma.discipline.upsert({
    where: { slug: "biologia" },
    update: {},
    create: { areaId: area.id, name: "Biologia", slug: "biologia", icon: "Dna", order: 1 },
  })

  const biologiaTopics = [
    { name: "Citologia",                       slug: "bio-citologia",             importance: 4, frequency: 4, order: 1  },
    { name: "Biologia Molecular e DNA",        slug: "bio-biologia-molecular",    importance: 5, frequency: 5, order: 2  },
    { name: "Genética Mendeliana",             slug: "bio-genetica",              importance: 5, frequency: 5, order: 3  },
    { name: "Genética Molecular e Biotecnol.", slug: "bio-genetica-molecular",    importance: 5, frequency: 5, order: 4  },
    { name: "Evolução Biológica",              slug: "bio-evolucao",              importance: 5, frequency: 5, order: 5  },
    { name: "Evolução Molecular e Filogenia",  slug: "bio-evolucao-molecular",    importance: 3, frequency: 3, order: 6  },
    { name: "Ecologia e Relações Ecológicas",  slug: "bio-ecologia",              importance: 5, frequency: 5, order: 7  },
    { name: "Biomas e Ecossistemas Brasileiros", slug: "bio-biomas",             importance: 5, frequency: 5, order: 8  },
    { name: "Fisiologia Humana — Sistemas",    slug: "bio-fisiologia-humana",     importance: 5, frequency: 5, order: 9  },
    { name: "Fisiologia Animal Comparada",     slug: "bio-fisiologia-animal",     importance: 4, frequency: 4, order: 10 },
    { name: "Neurobiologia e Sentidos",        slug: "bio-neurobiologia",         importance: 3, frequency: 3, order: 11 },
    { name: "Sistema Imunológico",             slug: "bio-imunologia",            importance: 4, frequency: 4, order: 12 },
    { name: "Saúde, Doenças e Epidemiologia",  slug: "bio-saude-doencas",         importance: 5, frequency: 5, order: 13 },
    { name: "Vírus e Bactérias",               slug: "bio-virus-bacterias",       importance: 4, frequency: 4, order: 14 },
    { name: "Fungos e Protistas",              slug: "bio-fungos-protistas",      importance: 3, frequency: 3, order: 15 },
    { name: "Botânica — Morfologia e Fisiol.", slug: "bio-botanica",              importance: 3, frequency: 3, order: 16 },
    { name: "Reprodução e Embriologia",        slug: "bio-reproducao-embriol",    importance: 4, frequency: 4, order: 17 },
    { name: "Histologia Animal",               slug: "bio-histologia",            importance: 3, frequency: 3, order: 18 },
    { name: "Sistemática e Biodiversidade",    slug: "bio-sistematica",           importance: 3, frequency: 3, order: 19 },
    { name: "Parasitologia e Vetores",         slug: "bio-parasitologia",         importance: 4, frequency: 4, order: 20 },
    { name: "Biotecnologia e Bioética",        slug: "bio-biotecnologia",         importance: 4, frequency: 4, order: 21 },
    { name: "Bioquímica — Macromoléculas",     slug: "bio-bioquimica",            importance: 4, frequency: 4, order: 22 },
  ]

  for (const t of biologiaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: biologia.id, ...t },
    })
  }

  // ── QUÍMICA (22 tópicos) ──────────────────────────────────
  const quimica = await prisma.discipline.upsert({
    where: { slug: "quimica" },
    update: {},
    create: { areaId: area.id, name: "Química", slug: "quimica", icon: "FlaskConical", order: 2 },
  })

  const quimicaTopics = [
    { name: "Estrutura Atômica e Tabela Periódica", slug: "qui-tabela-periodica",    importance: 4, frequency: 4, order: 1  },
    { name: "Ligações Químicas",                    slug: "qui-ligacoes-quimicas",   importance: 5, frequency: 5, order: 2  },
    { name: "Geometria Molecular e Polaridade",     slug: "qui-geometria-molecular", importance: 4, frequency: 4, order: 3  },
    { name: "Funções Inorgânicas — Ácidos e Bases", slug: "qui-acidos-bases",        importance: 4, frequency: 4, order: 4  },
    { name: "Reações Ácido-Base e Neutralização",   slug: "qui-reacoes-acido-base",  importance: 4, frequency: 4, order: 5  },
    { name: "Soluções e Concentração",              slug: "qui-solucoes",            importance: 4, frequency: 4, order: 6  },
    { name: "Propriedades Coligativas",             slug: "qui-coligativas",         importance: 3, frequency: 3, order: 7  },
    { name: "Termoquímica e Entalpia",              slug: "qui-termoquimica",        importance: 5, frequency: 5, order: 8  },
    { name: "Cinética Química",                     slug: "qui-cinetica",            importance: 4, frequency: 4, order: 9  },
    { name: "Equilíbrio Químico e Kp/Kc",           slug: "qui-equilibrio",          importance: 5, frequency: 5, order: 10 },
    { name: "Eletroquímica — Eletrólise e Pilhas",  slug: "qui-eletroquimica",       importance: 5, frequency: 5, order: 11 },
    { name: "Radioatividade e Fissão Nuclear",      slug: "qui-radioatividade",      importance: 4, frequency: 4, order: 12 },
    { name: "Oxidação e Número de Oxidação",        slug: "qui-oxirreducao",         importance: 4, frequency: 4, order: 13 },
    { name: "Gases e Lei dos Gases Ideais",         slug: "qui-gases",               importance: 4, frequency: 4, order: 14 },
    { name: "Química Orgânica — Nomenclatura",      slug: "qui-organica-geral",      importance: 5, frequency: 5, order: 15 },
    { name: "Funções Orgânicas",                    slug: "qui-funcoes-organicas",   importance: 5, frequency: 5, order: 16 },
    { name: "Isomeria Orgânica",                    slug: "qui-isomeria",            importance: 4, frequency: 4, order: 17 },
    { name: "Reações Orgânicas",                    slug: "qui-reacoes-organicas",   importance: 4, frequency: 4, order: 18 },
    { name: "Polímeros e Materiais",                slug: "qui-polimeros",           importance: 4, frequency: 4, order: 19 },
    { name: "Biomoléculas — Carboidratos, Lipídios", slug: "qui-biomoleculas",       importance: 4, frequency: 4, order: 20 },
    { name: "Agroquímica e Impacto Ambiental",      slug: "qui-agroquimica",         importance: 5, frequency: 5, order: 21 },
    { name: "Petróleo, Combustíveis e Energia",     slug: "qui-petroleo-combustivel",importance: 4, frequency: 4, order: 22 },
  ]

  for (const t of quimicaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: quimica.id, ...t },
    })
  }

  // ── FÍSICA (16 tópicos) ───────────────────────────────────
  const fisica = await prisma.discipline.upsert({
    where: { slug: "fisica" },
    update: {},
    create: { areaId: area.id, name: "Física", slug: "fisica", icon: "Atom", order: 3 },
  })

  const fisicaTopics = [
    { name: "Cinemática Escalar e Vetorial",   slug: "fis-cinematica",       importance: 5, frequency: 5, order: 1  },
    { name: "Dinâmica e Leis de Newton",       slug: "fis-dinamica",         importance: 5, frequency: 5, order: 2  },
    { name: "Energia, Trabalho e Potência",    slug: "fis-energia",          importance: 5, frequency: 5, order: 3  },
    { name: "Impulso, Momento e Colisões",     slug: "fis-impulso-momento",  importance: 4, frequency: 4, order: 4  },
    { name: "Gravitação e Satélites",          slug: "fis-gravitacao",       importance: 4, frequency: 4, order: 5  },
    { name: "Termodinâmica e Ciclos",          slug: "fis-termodinamica",    importance: 5, frequency: 5, order: 6  },
    { name: "Calorimetria e Mudança de Fase",  slug: "fis-calorimetria",     importance: 4, frequency: 4, order: 7  },
    { name: "Ondulatória e Acústica",          slug: "fis-ondulatorio",      importance: 4, frequency: 4, order: 8  },
    { name: "Óptica Geométrica",               slug: "fis-optica",           importance: 4, frequency: 4, order: 9  },
    { name: "Eletrostática e Campo Elétrico",  slug: "fis-eletrostatica",    importance: 4, frequency: 4, order: 10 },
    { name: "Eletrodinâmica e Circuitos",      slug: "fis-eletrodinamica",   importance: 5, frequency: 5, order: 11 },
    { name: "Magnetismo e Indução",            slug: "fis-magnetismo",       importance: 4, frequency: 4, order: 12 },
    { name: "Física Moderna e Quântica",       slug: "fis-fisica-moderna",   importance: 4, frequency: 4, order: 13 },
    { name: "Radioatividade e Reações Nucleares", slug: "fis-radioatividade",importance: 4, frequency: 4, order: 14 },
    { name: "Relatividade Especial",           slug: "fis-relatividade",     importance: 3, frequency: 3, order: 15 },
    { name: "Oscilações e Pêndulo",            slug: "fis-oscilacoes",       importance: 3, frequency: 3, order: 16 },
  ]

  for (const t of fisicaTopics) {
    await prisma.topic.upsert({
      where: { slug: t.slug },
      update: { importance: t.importance, frequency: t.frequency },
      create: { disciplineId: fisica.id, ...t },
    })
  }

  console.log("  ✓ CN: 3 disciplinas, 60 tópicos")
  return area
}
