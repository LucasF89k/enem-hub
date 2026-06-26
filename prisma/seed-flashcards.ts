import { type PrismaClient, FlashcardType } from "@prisma/client"

interface FlashcardSeed {
  topicSlug: string
  front: string
  back: string
  type: FlashcardType
}

const flashcards: FlashcardSeed[] = [
  // ── CIÊNCIAS DA NATUREZA ─────────────────────────────────
  // Biologia — Genética
  {
    topicSlug: "bio-genetica",
    front: "O que é a 1ª Lei de Mendel (Lei da Segregação)?",
    back: "Cada indivíduo possui dois alelos para cada característica, que se separam durante a formação dos gametas. Cada gameta recebe apenas um alelo de cada par.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "bio-genetica",
    front: "Na herança ligada ao sexo recessiva, quais os genótipos possíveis de uma mulher {{portadora}}?",
    back: "X^A X^a — ela possui um alelo dominante (A) e um recessivo (a) no cromossomo X. Fenotipicamente normal, mas pode transmitir o alelo recessivo aos filhos.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "bio-genetica",
    front: "Qual a proporção fenotípica no cruzamento AaBb × AaBb (dois genes independentes)?",
    back: "9 A_B_ : 3 A_bb : 3 aaB_ : 1 aabb (razão 9:3:3:1). Demonstra a 2ª Lei de Mendel (segregação independente).",
    type: FlashcardType.BASIC,
  },
  // Ecologia
  {
    topicSlug: "bio-ecologia",
    front: "Qual a diferença entre cadeia alimentar e teia alimentar?",
    back: "Cadeia alimentar: sequência linear de transferência de energia (produtor → consumidor primário → secundário...). Teia alimentar: conjunto de cadeias interligadas que representa as relações alimentares reais de um ecossistema.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "bio-ecologia",
    front: "No ciclo do carbono, o processo que remove CO₂ da atmosfera é a {{fotossíntese}} e o que o libera é a {{respiração celular}} e a queima de combustíveis.",
    back: "Fotossíntese: 6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂ (fixa carbono). Respiração: C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + ATP (libera carbono). O equilíbrio entre esses processos regula o CO₂ atmosférico.",
    type: FlashcardType.CLOZE,
  },
  // Química — Termoquímica
  {
    topicSlug: "qui-termoquimica",
    front: "O que é a Lei de Hess?",
    back: "A variação de entalpia de uma reação é independente do caminho percorrido, dependendo apenas dos estados inicial e final. Permite calcular ΔH de reações usando entalpias de reações conhecidas.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "qui-termoquimica",
    front: "Uma reação com ΔH < 0 é chamada de reação {{exotérmica}} e libera calor para o ambiente.",
    back: "ΔH < 0 = exotérmica (libera energia). ΔH > 0 = endotérmica (absorve energia). Exemplos exotérmicos: combustão, neutralização. Exemplos endotérmicos: fotossíntese, fusão do gelo.",
    type: FlashcardType.CLOZE,
  },
  // Física — Cinemática
  {
    topicSlug: "fis-cinematica",
    front: "Qual a equação de Torricelli no MRUV?",
    back: "v² = v₀² + 2aΔs. Relaciona velocidade final, velocidade inicial, aceleração e deslocamento — sem envolver o tempo diretamente. Muito útil quando o tempo não é fornecido.",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "fis-eletrodinamica",
    front: "A Lei de Ohm estabelece que V = {{R}} × {{I}}, onde V é tensão (Volts), R é resistência (Ohms) e I é corrente (Ampères).",
    back: "V = R × I (Lei de Ohm). Potência: P = V × I = I²R = V²/R. A resistência é determinada pela natureza, dimensões e temperatura do condutor.",
    type: FlashcardType.CLOZE,
  },
  // Fisiologia
  {
    topicSlug: "bio-fisiologia-animal",
    front: "Qual a diferença entre imunidade inata e adaptativa?",
    back: "Inata: inespecífica, rápida, não tem memória (fagócitos, NK, complemento). Adaptativa: específica, mais lenta mas com memória imunológica (linfócitos T e B, anticorpos).",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "fis-energia",
    front: "A energia mecânica total é conservada quando {{apenas forças conservativas}} atuam no sistema.",
    back: "Em= Ec + Ep (energia cinética + potencial). Sem atrito: Em = constante. Com atrito: parte da energia mecânica se converte em calor (energia térmica), reduzindo a energia mecânica do sistema.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "qui-equilibrio",
    front: "O Princípio de Le Chatelier afirma que ao perturbar um equilíbrio, o sistema se desloca no sentido de {{minimizar}} a perturbação.",
    back: "Perturbações e respostas: aumento de concentração de reagente → equilíbrio desloca para direita. Aumento de temperatura → favorece reação endotérmica. Aumento de pressão → favorece lado com menor número de mols de gás.",
    type: FlashcardType.CLOZE,
  },

  // ── CIÊNCIAS HUMANAS ──────────────────────────────────────
  {
    topicSlug: "hist-ditadura-militar",
    front: "Quais foram os principais instrumentos legais de repressão da Ditadura Militar brasileira (1964-1985)?",
    back: "Atos Institucionais (AI-1 a AI-17). O AI-5 (1968) foi o mais rígido: fechou o Congresso, cassou mandatos, suspendeu habeas corpus e instaurou censura sistemática. Revogado em 1978 no processo de abertura.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "fil-etica",
    front: "O imperativo categórico de Kant diz: 'Age apenas segundo máximas que possas ao mesmo tempo querer que sejam {{leis universais}}'.",
    back: "É o princípio fundamental da ética kantiana: uma ação é moralmente correta se puder ser universalizada para todos os seres racionais, independente de consequências ou desejos pessoais. Ética deontológica (do dever).",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "soc-desigualdade",
    front: "O índice de Gini mede o quê? Qual seu intervalo?",
    back: "Mede a desigualdade de renda numa população. Varia de 0 (igualdade perfeita — todos ganham igual) a 1 (desigualdade máxima — uma pessoa tem toda a renda). Brasil historicamente tem Gini entre 0,50-0,60.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "geo-urbanizacao",
    front: "O processo de favelização nas cidades brasileiras é resultado direto da {{industrialização}} concentrada que atraiu migrantes rurais sem infraestrutura urbana adequada.",
    back: "Urbanização acelerada + desigualdade de renda + falta de planejamento habitacional = crescimento de habitações informais. Hoje, cerca de 13 milhões de brasileiros vivem em favelas (IBGE).",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "hist-revolucao-francesa",
    front: "Os três estados da sociedade francesa do Antigo Regime eram: Primeiro Estado ({{clero}}), Segundo Estado (nobreza) e Terceiro Estado (povo).",
    back: "O Terceiro Estado pagava impostos enquanto clero e nobreza eram privilegiados. A burguesia, parte do 3º estado, financeiramente poderosa mas politicamente marginalizada, liderou a Revolução de 1789.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "soc-cultura",
    front: "Qual a diferença entre etnocentrismo e relativismo cultural?",
    back: "Etnocentrismo: julgar outras culturas pela ótica da própria cultura, considerando-a superior. Relativismo cultural: analisar cada cultura segundo seus próprios valores e contexto histórico, sem hierarquias.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "fil-politica",
    front: "Para Locke, os direitos naturais que o governo deve proteger são: {{vida}}, {{liberdade}} e {{propriedade}}.",
    back: "Locke fundou o liberalismo político. Para ele, os homens cedem parte de sua liberdade ao Estado (contrato social) apenas para proteger esses direitos naturais. Se o governo os viola, o povo tem direito de resistência.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "geo-geopolitica",
    front: "A Guerra Fria foi o conflito bipolar entre {{EUA}} (capitalismo) e {{URSS}} (socialismo), marcado por corrida armamentista e conflitos por procuração.",
    back: "Período: 1947-1991 (dissolução da URSS). Sem confronto militar direto entre as superpotências. Marcos: Plano Marshall, NATO, Muro de Berlim, Crise dos Mísseis (1962), Corrida Espacial, Guerra do Vietnam.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "hist-2a-guerra",
    front: "O Holocausto foi o genocídio sistemático de judeus (e outros grupos) pelo regime nazista. Quantas pessoas foram assassinadas?",
    back: "Cerca de 6 milhões de judeus foram mortos (2/3 dos judeus europeus). Além deles, foram perseguidos e mortos ciganos, deficientes físicos/mentais, homossexuais, prisioneiros políticos — totalizando ~11 milhões de vítimas.",
    type: FlashcardType.BASIC,
  },

  // ── LINGUAGENS E CÓDIGOS ──────────────────────────────────
  {
    topicSlug: "por-figuras-linguagem",
    front: "Qual a diferença entre metáfora e metonímia?",
    back: "Metáfora: comparação implícita por semelhança ('A vida é uma viagem'). Metonímia: substituição por contiguidade/associação ('Lerás Machado de Assis' = a obra de Machado; 'Tomou três garrafas' = conteúdo pelo continente).",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "por-variacao-linguistica",
    front: "A variação linguística que ocorre conforme a região geográfica é chamada de variação {{diatópica}} ou {{dialetal}}.",
    back: "Tipos de variação: diatópica (regional), diastrática (social/cultural), diafásica (situacional/registro), diacrônica (histórica). Todas são formas legítimas de uso da língua — não há erro, apenas diferença.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "lit-modernismo",
    front: "A Semana de Arte Moderna de 1922 foi realizada em {{São Paulo}} e trouxe propostas de ruptura com o academismo e valorização da cultura brasileira.",
    back: "Participantes: Mário de Andrade, Oswald de Andrade, Tarsila do Amaral, Anita Malfatti. Propunha: libertação das formas fixas, uso da linguagem coloquial, antropofagia cultural e valorização das raízes índigenas e africanas.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "por-argumentacao",
    front: "Quais são as 5 competências avaliadas na redação do ENEM?",
    back: "1. Domínio da norma culta da Língua Portuguesa. 2. Compreensão da proposta e uso de repertório. 3. Seleção, relação e organização das informações. 4. Conhecimento dos mecanismos linguísticos. 5. Proposta de intervenção detalhada e respeitosa aos direitos humanos.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "lit-realismo",
    front: "Machado de Assis é considerado o maior escritor brasileiro. O narrador não confiável em 'Dom Casmurro' é {{Bentinho/Bento Santiago}}, que narra do ponto de vista dele para provar a culpa de Capitu.",
    back: "Dom Casmurro (1899): Bento Santiago narra sua história para provar a traição de Capitu, mas o leitor pode questionar sua objetividade por ciúme e obsessão. 'Capitu traiu ou não traiu?' permanece ambíguo — traço do Realismo psicológico machadiano.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "por-interpretacao",
    front: "O que é inferência na leitura de textos?",
    back: "Inferência é o processo de deduzir informações implícitas a partir do texto, combinando o que está escrito com o conhecimento prévio do leitor. É fundamental para interpretar ironias, metáforas, pressupostos e subentendidos.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "art-publicidade",
    front: "O apelo ao {{pathos}} é uma estratégia persuasiva que explora emoções (medo, ternura, esperança) para influenciar o público.",
    back: "Aristóteles identificou três meios de persuasão: logos (argumentos racionais), ethos (credibilidade do emissor) e pathos (emoções do receptor). Na publicidade, apelos ao pathos incluem imagens de bebês, família e situações de vulnerabilidade.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "por-generos-textuais",
    front: "Qual a diferença entre tipo textual e gênero textual?",
    back: "Tipo textual: categorias teóricas de sequências linguísticas (narração, descrição, exposição, argumentação, injunção). Gênero textual: formas concretas de comunicação social (crônica, artigo, receita, notícia). Um gênero pode combinar vários tipos.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "ing-interpretacao",
    front: "In English reading comprehension, 'inference' questions ask about information that is {{implied}} but not explicitly stated in the text.",
    back: "To answer inference questions: look for context clues, consider the author's tone and purpose, and combine textual evidence with logical reasoning. Key phrases: 'it can be inferred that...', 'the author implies...', 'most likely...'",
    type: FlashcardType.CLOZE,
  },

  // ── MATEMÁTICA ───────────────────────────────────────────
  {
    topicSlug: "mat-funcoes-2grau",
    front: "Na função f(x) = ax² + bx + c, a fórmula para encontrar o x do vértice (mínimo ou máximo) é x = {{-b/2a}}.",
    back: "Vértice: xᵥ = −b/2a e yᵥ = −Δ/4a (onde Δ = b² − 4ac). Se a > 0: parábola com concavidade para cima (mínimo). Se a < 0: concavidade para baixo (máximo).",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "mat-probabilidade",
    front: "A fórmula da probabilidade clássica é P(A) = {{número de casos favoráveis}} / {{número de casos possíveis}}.",
    back: "P(A) = n(A)/n(S). Propriedades: 0 ≤ P(A) ≤ 1. P(evento impossível) = 0. P(evento certo) = 1. P(Ā) = 1 − P(A) (evento complementar). Adição: P(A ∪ B) = P(A) + P(B) − P(A ∩ B).",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "mat-geometria-plana",
    front: "Quais são as fórmulas de área do triângulo, quadrado e círculo?",
    back: "Triângulo: A = base × altura / 2. Quadrado: A = lado². Retângulo: A = base × altura. Círculo: A = πr². Trapézio: A = (B+b)/2 × h. Essas são as mais cobradas no ENEM.",
    type: FlashcardType.BASIC,
  },
  {
    topicSlug: "mat-analise-combinatoria",
    front: "A fórmula de combinação simples é C(n,p) = {{n!}} / ({{p!}} × {{(n-p)!}}), onde n é o total e p é o número de escolhas.",
    back: "C(n,p) = n! / (p! × (n−p)!). Diferença entre combinação e arranjo: combinação — ordem NÃO importa; arranjo — ordem IMPORTA. A(n,p) = n!/(n−p)! = p! × C(n,p).",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "mat-trigonometria",
    front: "No triângulo retângulo, sen(θ) = {{cateto oposto}} / {{hipotenusa}} e cos(θ) = {{cateto adjacente}} / {{hipotenusa}}.",
    back: "Macete SOHCAHTOA: Sen = Oposto/Hipotenusa, Cos = Adjacente/Hipotenusa, Tan = Oposto/Adjacente. Valores principais: sen 30° = 1/2, cos 30° = √3/2, sen 45° = cos 45° = √2/2, sen 60° = √3/2.",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "mat-estatistica",
    front: "Média aritmética, mediana e moda são medidas de {{tendência central}}. O desvio padrão é uma medida de {{dispersão}}.",
    back: "Média: soma/n. Mediana: valor central (dados ordenados). Moda: valor mais frequente. Desvio padrão (σ): mede a dispersão em torno da média. Quanto maior o σ, mais os dados se afastam da média.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "mat-financeira",
    front: "A fórmula do montante em juros simples é M = {{C(1 + it)}}, e em juros compostos é M = {{C(1 + i)^t}}.",
    back: "Juros simples: incidem sempre sobre o capital inicial. Juros compostos (capitalização): incidem sobre o montante acumulado (juros sobre juros). Para o mesmo capital e taxa, o montante composto > simples para t > 1.",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "mat-sequencias-pa-pg",
    front: "O termo geral de uma Progressão Aritmética é aₙ = a₁ + {{(n−1) × r}}, onde r é a razão.",
    back: "PA: diferença constante entre termos consecutivos. Razão r = aₙ − aₙ₋₁. Soma dos n primeiros termos: Sₙ = n(a₁ + aₙ)/2. PG: razão q constante. Sₙ = a₁(qⁿ − 1)/(q − 1) para q ≠ 1.",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "mat-geometria-espacial",
    front: "O volume do cubo com aresta a é V = {{a³}}, e a área total é AT = {{6a²}}.",
    back: "Sólidos e volumes: cubo V = a³, paralelepípedo V = abc, cilindro V = πr²h, cone V = πr²h/3, esfera V = 4πr³/3, pirâmide V = Abase × h/3. Todos muito cobrados no ENEM.",
    type: FlashcardType.FORMULA,
  },
  {
    topicSlug: "mat-funcoes-1grau",
    front: "A função afim f(x) = ax + b tem gráfico de {{reta}}. O coeficiente 'a' indica a {{inclinação}} e 'b' o ponto de intersecção com o eixo y.",
    back: "Se a > 0: função crescente. Se a < 0: decrescente. Se a = 0: constante (reta horizontal). O zero da função (raiz) é x = −b/a. Intercepto y: f(0) = b.",
    type: FlashcardType.CLOZE,
  },
  {
    topicSlug: "mat-geometria-analitica",
    front: "A distância entre dois pontos A(x₁, y₁) e B(x₂, y₂) é d = √[{{(x₂−x₁)²}} + {{(y₂−y₁)²}}].",
    back: "Derivada diretamente do Teorema de Pitágoras no plano cartesiano. Ponto médio M: xₘ = (x₁+x₂)/2 e yₘ = (y₁+y₂)/2. Equação da reta por dois pontos: (y−y₁)/(y₂−y₁) = (x−x₁)/(x₂−x₁).",
    type: FlashcardType.FORMULA,
  },
]

export async function seedFlashcards(prisma: PrismaClient) {
  console.log("  Seeding flashcards...")

  // Mapeia slug do tópico → id
  const topics = await prisma.topic.findMany({ select: { id: true, slug: true } })
  const topicMap: Record<string, string> = {}
  for (const t of topics) topicMap[t.slug] = t.id

  // Cria deck de sistema (sem usuário)
  const existingDeck = await prisma.flashcardDeck.findFirst({
    where: { name: "Deck Base ENEM", userId: null },
  })

  if (existingDeck) {
    await prisma.flashcard.deleteMany({ where: { deckId: existingDeck.id } })
    await prisma.flashcardDeck.delete({ where: { id: existingDeck.id } })
  }

  const deck = await prisma.flashcardDeck.create({
    data: {
      name: "Deck Base ENEM",
      description: "Flashcards fundamentais das 4 áreas do ENEM",
      isPublic: true,
    },
  })

  let count = 0
  for (const f of flashcards) {
    const topicId = topicMap[f.topicSlug]
    if (!topicId) {
      console.warn(`    ⚠ Tópico não encontrado: ${f.topicSlug}`)
      continue
    }

    await prisma.flashcard.create({
      data: {
        deckId: deck.id,
        topicId,
        front: f.front,
        back: f.back,
        type: f.type,
      },
    })
    count++
  }

  console.log(`  ✓ ${count} flashcards criados`)
}
