import { type PrismaClient } from "@prisma/client"

const TEMAS_HISTORICOS = [
  {
    year: 2010,
    theme: "O trabalho na construção da dignidade humana",
    slug: "red-tema-2010",
    importance: 3,
    frequency: 2,
    order: 1,
    keywords: ["trabalho", "dignidade", "direitos trabalhistas", "exploração"],
  },
  {
    year: 2011,
    theme: "Viver em rede no século XXI: os limites entre o público e o privado",
    slug: "red-tema-2011",
    importance: 4,
    frequency: 3,
    order: 2,
    keywords: ["redes sociais", "privacidade", "internet", "exposição"],
  },
  {
    year: 2012,
    theme: "O movimento imigratório para o Brasil no século XXI",
    slug: "red-tema-2012",
    importance: 4,
    frequency: 3,
    order: 3,
    keywords: ["imigração", "refugiados", "xenofobia", "integração"],
  },
  {
    year: 2013,
    theme: "Efeitos da implantação da Lei Seca no Brasil",
    slug: "red-tema-2013",
    importance: 3,
    frequency: 2,
    order: 4,
    keywords: ["alcoolismo", "trânsito", "segurança pública", "saúde"],
  },
  {
    year: 2014,
    theme: "Publicidade infantil em questão no Brasil",
    slug: "red-tema-2014",
    importance: 4,
    frequency: 3,
    order: 5,
    keywords: ["publicidade", "infância", "consumismo", "proteção"],
  },
  {
    year: 2015,
    theme: "A persistência da violência contra a mulher na sociedade brasileira",
    slug: "red-tema-2015",
    importance: 5,
    frequency: 5,
    order: 6,
    keywords: ["feminicídio", "machismo", "violência doméstica", "Lei Maria da Penha"],
  },
  {
    year: 2016,
    theme: "Caminhos para combater a intolerância religiosa no Brasil",
    slug: "red-tema-2016",
    importance: 4,
    frequency: 4,
    order: 7,
    keywords: ["intolerância", "diversidade religiosa", "laicidade", "preconceito"],
  },
  {
    year: 2017,
    theme: "Desafios para a formação educacional de surdos no Brasil",
    slug: "red-tema-2017",
    importance: 4,
    frequency: 4,
    order: 8,
    keywords: ["Libras", "inclusão", "acessibilidade", "educação especial"],
  },
  {
    year: 2018,
    theme: "Manipulação do comportamento do usuário pelo controle de dados na internet",
    slug: "red-tema-2018",
    importance: 5,
    frequency: 5,
    order: 9,
    keywords: ["dados pessoais", "algoritmos", "fake news", "privacidade digital"],
  },
  {
    year: 2019,
    theme: "Democratização do acesso ao cinema no Brasil",
    slug: "red-tema-2019",
    importance: 3,
    frequency: 3,
    order: 10,
    keywords: ["acesso à cultura", "desigualdade", "audiovisual", "inclusão cultural"],
  },
  {
    year: 2020,
    theme: "O estigma associado às doenças mentais na sociedade brasileira",
    slug: "red-tema-2020",
    importance: 5,
    frequency: 5,
    order: 11,
    keywords: ["saúde mental", "preconceito", "depressão", "ansiedade"],
  },
  {
    year: 2021,
    theme: "Invisibilidade e registro civil: o caso dos indígenas no Brasil",
    slug: "red-tema-2021",
    importance: 4,
    frequency: 4,
    order: 12,
    keywords: ["povos indígenas", "cidadania", "direitos fundamentais", "invisibilidade"],
  },
  {
    year: 2022,
    theme: "Desafios para a valorização de comunidades e povos tradicionais no Brasil",
    slug: "red-tema-2022",
    importance: 4,
    frequency: 4,
    order: 13,
    keywords: ["quilombolas", "povos tradicionais", "território", "identidade cultural"],
  },
  {
    year: 2023,
    theme: "Desafios para o enfrentamento da invisibilidade do trabalho de cuidado realizado pela mulher no Brasil",
    slug: "red-tema-2023",
    importance: 5,
    frequency: 5,
    order: 14,
    keywords: ["trabalho doméstico", "cuidado", "gênero", "desigualdade salarial"],
  },
  {
    year: 2024,
    theme: "Desafios para a valorização da herança africana no Brasil",
    slug: "red-tema-2024",
    importance: 5,
    frequency: 5,
    order: 15,
    keywords: ["cultura africana", "racismo estrutural", "Lei 10.639", "patrimônio cultural"],
  },
  // Temas recorrentes por categoria (não exclusivos de um ano)
  {
    year: 0,
    theme: "Violência e Segurança Pública no Brasil",
    slug: "red-tema-violencia",
    importance: 5,
    frequency: 4,
    order: 16,
    keywords: ["violência urbana", "desigualdade", "encarceramento", "políticas públicas"],
  },
  {
    year: 0,
    theme: "Educação como instrumento de transformação social",
    slug: "red-tema-educacao",
    importance: 5,
    frequency: 5,
    order: 17,
    keywords: ["evasão escolar", "qualidade do ensino", "acesso", "IDEB"],
  },
  {
    year: 0,
    theme: "Meio Ambiente e Desenvolvimento Sustentável",
    slug: "red-tema-meio-ambiente",
    importance: 5,
    frequency: 5,
    order: 18,
    keywords: ["desmatamento", "mudanças climáticas", "sustentabilidade", "Amazônia"],
  },
  {
    year: 0,
    theme: "Saúde Pública — Acesso e Desafios no SUS",
    slug: "red-tema-saude",
    importance: 4,
    frequency: 4,
    order: 19,
    keywords: ["SUS", "desigualdade", "prevenção", "cobertura"],
  },
  {
    year: 0,
    theme: "Tecnologia, Trabalho e Desemprego Estrutural",
    slug: "red-tema-tecnologia-trabalho",
    importance: 5,
    frequency: 4,
    order: 20,
    keywords: ["automação", "uberização", "emprego", "qualificação"],
  },
]

const CONECTIVOS_CONTENT = `# Conectivos por Função — Banco de Apoio à Redação ENEM

## Introdução e Exemplificação
- **para introduzir**: primeiramente, inicialmente, antes de tudo, a priori
- **para exemplificar**: por exemplo, a título de ilustração, como se pode observar, segundo dados do IBGE
- **para retomar**: como dito anteriormente, conforme exposto, reitero que

## Adição e Progressão
- **soma de ideias**: além disso, ademais, outrossim, não só… mas também, tanto… quanto
- **progressão de argumento**: em segundo lugar, posteriormente, a seguir, nessa perspectiva

## Contraste e Concessão
- **oposição**: no entanto, todavia, contudo, entretanto, por outro lado, em contrapartida
- **concessão**: embora, ainda que, apesar de, mesmo que, não obstante
- **restrição**: porém, mas, entretanto

## Causa e Consequência
- **causa**: porque, pois, visto que, uma vez que, já que, dado que
- **consequência**: logo, portanto, por conseguinte, assim sendo, diante disso, desse modo
- **finalidade**: para que, a fim de que, com o intuito de, com vistas a

## Conclusão e Proposta
- **para concluir**: em suma, em síntese, portanto, conclui-se que, diante do exposto
- **para propor**: cabe ao Estado, é imprescindível que, torna-se necessário, faz-se mister
- **para atribuir agente**: ao poder público, à sociedade civil, às escolas, à mídia

## Explicação e Esclarecimento
- **explicação**: ou seja, isto é, a saber, em outras palavras
- **confirmação**: de fato, com efeito, realmente, evidentemente
`

const PROPOSTA_CONTENT = `# Estruturas de Proposta de Intervenção — ENEM

## Estrutura Completa (5 elementos obrigatórios)
Uma proposta nota 1000 deve conter:
1. **Ação** — o que será feito (verbo no infinitivo)
2. **Agente** — quem vai executar (Estado, escola, mídia, família, sociedade civil)
3. **Modo/Meio** — como será feito (política pública, campanha, lei, programa)
4. **Finalidade** — para quê (conectivo de finalidade + objetivo)
5. **Detalhamento** — especificação concreta (prazo, público-alvo, abrangência)

## Modelos por Agente

### Estado / Poder Público
"Cabe ao Estado [ação], por meio de [meio/instrumento], a fim de [finalidade], garantindo [detalhamento]."

Exemplo:
"Cabe ao Estado implementar políticas públicas de conscientização, por meio de campanhas educativas veiculadas em redes sociais, com o intuito de combater o estigma associado às doenças mentais, priorizando grupos vulneráveis como jovens e trabalhadores precarizados."

### Escola / Sistema Educacional
"É responsabilidade das instituições de ensino [ação], por meio de [instrumento pedagógico], para que [finalidade], contribuindo para [resultado esperado]."

Exemplo:
"É responsabilidade das instituições de ensino promover debates interdisciplinares sobre patrimônio cultural africano, por meio de projetos temáticos e da aplicação da Lei 10.639/2003, para que os alunos desenvolvam senso crítico sobre racismo estrutural, contribuindo para uma sociedade mais justa."

### Mídia e Sociedade Civil
"À mídia e à sociedade civil cabe [ação], por intermédio de [mecanismo], a fim de [finalidade], ampliando [resultado]."

### Família e Comunidade
"À família compete [ação], mediante [abordagem], para que [objetivo], fortalecendo [resultado]."

## Erros Comuns a Evitar
- Proposta vaga: "o governo deve agir" ✗ → especificar COMO e COM QUAL INSTRUMENTO ✓
- Sem finalidade: "criar programas de saúde" ✗ → "criar programas de saúde mental nas UBS, a fim de ampliar o acesso ao tratamento psicológico gratuito" ✓
- Agente genérico: "as pessoas devem" ✗ → especificar o agente responsável ✓
- Proposta inviável ou ilegal: punições desproporcionais, censura ✗

## Repertório de Agentes e Instrumentos
| Agente | Instrumento |
|--------|-------------|
| Estado | leis, decretos, políticas públicas, programas, orçamento |
| Escola | currículo, projetos pedagógicos, formação docente |
| Mídia | campanhas, reportagens, séries educativas |
| ONGs | projetos sociais, advocacy, capacitação |
| Família | diálogo, acompanhamento, afeto |
| Empresas | ESG, contratação inclusiva, capacitação |
`

export async function seedRedacao(prisma: PrismaClient) {
  console.log("  Seeding Redação...")

  // Busca a área de linguagens (criada pelo seedLCT)
  const area = await prisma.area.findUnique({ where: { slug: "linguagens" } })
  if (!area) {
    console.warn("  ⚠ Área 'linguagens' não encontrada — execute seedLCT primeiro")
    return
  }

  // ── DISCIPLINA REDAÇÃO ───────────────────────────────────
  const redacao = await prisma.discipline.upsert({
    where: { slug: "redacao" },
    update: {},
    create: {
      areaId: area.id,
      name: "Redação",
      slug: "redacao",
      icon: "FileEdit",
      order: 5,
    },
  })

  // ── TÓPICO RAIZ: Banco de Conectivos ─────────────────────
  const topicConectivos = await prisma.topic.upsert({
    where: { slug: "red-conectivos" },
    update: { importance: 5, frequency: 5 },
    create: {
      disciplineId: redacao.id,
      name: "Conectivos por Função",
      slug: "red-conectivos",
      importance: 5,
      frequency: 5,
      order: 0,
    },
  })

  await prisma.content.upsert({
    where: { slug: "red-conectivos-guia" },
    update: { body: CONECTIVOS_CONTENT },
    create: {
      topicId: topicConectivos.id,
      title: "Guia Completo de Conectivos — ENEM",
      slug: "red-conectivos-guia",
      summary: "Lista completa de conectivos organizados por função: adição, contraste, causa, consequência e conclusão, com modelos prontos para a redação ENEM.",
      body: CONECTIVOS_CONTENT,
      importance: 5,
      frequency: 5,
    },
  })

  // ── TÓPICO RAIZ: Proposta de Intervenção ─────────────────
  const topicProposta = await prisma.topic.upsert({
    where: { slug: "red-proposta-intervencao" },
    update: { importance: 5, frequency: 5 },
    create: {
      disciplineId: redacao.id,
      name: "Proposta de Intervenção",
      slug: "red-proposta-intervencao",
      importance: 5,
      frequency: 5,
      order: 0,
    },
  })

  await prisma.content.upsert({
    where: { slug: "red-proposta-guia" },
    update: { body: PROPOSTA_CONTENT },
    create: {
      topicId: topicProposta.id,
      title: "Estrutura Completa da Proposta de Intervenção",
      slug: "red-proposta-guia",
      summary: "Os 5 elementos obrigatórios da proposta nota 1000: ação, agente, modo/meio, finalidade e detalhamento. Modelos prontos por agente (Estado, escola, mídia) e erros comuns a evitar.",
      body: PROPOSTA_CONTENT,
      importance: 5,
      frequency: 5,
    },
  })

  // ── TÓPICOS: TEMAS HISTÓRICOS ─────────────────────────────
  for (const tema of TEMAS_HISTORICOS) {
    const topicName = tema.year > 0
      ? `ENEM ${tema.year} — ${tema.theme.slice(0, 60)}${tema.theme.length > 60 ? "…" : ""}`
      : tema.theme

    await prisma.topic.upsert({
      where: { slug: tema.slug },
      update: { importance: tema.importance, frequency: tema.frequency },
      create: {
        disciplineId: redacao.id,
        name: topicName,
        slug: tema.slug,
        importance: tema.importance,
        frequency: tema.frequency,
        order: tema.order,
      },
    })
  }

  console.log("  ✓ Redação: 1 disciplina, 23 tópicos (20 temas + conectivos + proposta + raiz)")
}
