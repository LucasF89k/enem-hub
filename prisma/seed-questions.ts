import { type PrismaClient, Difficulty } from "@prisma/client"

interface QuestionSeed {
  topicSlug: string
  areaSlug: string
  statement: string
  options: { letter: string; text: string }[]
  correctLetter: string
  explanation: string
  difficulty: Difficulty
  source: string
}

// ── CIÊNCIAS DA NATUREZA (40 questões) ─────────────────────────
const cnQuestions: QuestionSeed[] = [
  // BIOLOGIA — Genética
  {
    topicSlug: "bio-genetica",
    areaSlug: "ciencias-natureza",
    statement: "Em ervilhas, a cor amarela (A) é dominante sobre verde (a) e a forma lisa (B) é dominante sobre rugosa (b). Um cruzamento entre dois indivíduos duplamente heterozigotos (AaBb × AaBb) foi realizado. Qual a proporção esperada de descendentes de fenótipo amarelo e liso?",
    options: [
      { letter: "A", text: "1/16" },
      { letter: "B", text: "3/16" },
      { letter: "C", text: "9/16" },
      { letter: "D", text: "12/16" },
      { letter: "E", text: "15/16" },
    ],
    correctLetter: "C",
    explanation: "Pelo princípio da segregação independente de Mendel, no cruzamento AaBb × AaBb a proporção fenotípica segue a razão 9:3:3:1. Os indivíduos amarelos e lisos (A_B_) correspondem a 9/16 da prole. Esse resultado clássico é base da 2ª Lei de Mendel.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "bio-genetica",
    areaSlug: "ciencias-natureza",
    statement: "A daltonismo é uma condição ligada ao cromossomo X, determinada por gene recessivo (X^d). Uma mulher portadora (X^D X^d) se casa com um homem normal (X^D Y). Qual a probabilidade de seus filhos do sexo masculino serem daltônicos?",
    options: [
      { letter: "A", text: "0%" },
      { letter: "B", text: "25%" },
      { letter: "C", text: "50%" },
      { letter: "D", text: "75%" },
      { letter: "E", text: "100%" },
    ],
    correctLetter: "C",
    explanation: "Os filhos masculinos recebem o Y do pai e um X da mãe. Como a mãe é portadora (X^D X^d), ela transmite X^D ou X^d com igual probabilidade (50%). Portanto, 50% dos filhos homens serão X^d Y e terão daltonismo.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  // BIOLOGIA — Ecologia
  {
    topicSlug: "bio-ecologia",
    areaSlug: "ciencias-natureza",
    statement: "Num ecossistema aquático, as cianobactérias são os produtores primários. Peixes herbívoros se alimentam delas, e peixes carnívoros se alimentam dos herbívoros. Ao aplicar um pesticida que elimina 90% das cianobactérias, qual efeito imediato seria esperado nas populações de peixes carnívoros?",
    options: [
      { letter: "A", text: "Aumento imediato, pois haveria menos competição." },
      { letter: "B", text: "Sem alteração, pois carnívoros não dependem de cianobactérias." },
      { letter: "C", text: "Aumento, pois herbívoros migrariam trazendo mais presas." },
      { letter: "D", text: "Redução, pois a cadeia alimentar seria comprometida pela queda dos herbívoros." },
      { letter: "E", text: "Extinção imediata de todos os peixes." },
    ],
    correctLetter: "D",
    explanation: "A redução drástica dos produtores (cianobactérias) diminuiria o alimento disponível para herbívoros. Com menos herbívoros, a população de carnívoros também diminuiria por escassez de presas — efeito em cascata trófica.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  // BIOLOGIA — Fisiologia Animal
  {
    topicSlug: "bio-fisiologia-animal",
    areaSlug: "ciencias-natureza",
    statement: "O sistema imunológico humano possui dois tipos principais de resposta: inata e adaptativa. A resposta adaptativa envolve linfócitos B e T. A principal função dos linfócitos B nessa resposta é:",
    options: [
      { letter: "A", text: "Destruir células infectadas por vírus através de contato direto." },
      { letter: "B", text: "Produzir e secretar anticorpos específicos para antígenos." },
      { letter: "C", text: "Fagocitar agentes patogênicos de forma inespecífica." },
      { letter: "D", text: "Liberar histamina em processos inflamatórios." },
      { letter: "E", text: "Regular a temperatura corporal via hipotálamo." },
    ],
    correctLetter: "B",
    explanation: "Os linfócitos B são responsáveis pela imunidade humoral: ao reconhecer antígenos específicos, diferenciam-se em plasmócitos que produzem anticorpos (imunoglobulinas). Os linfócitos T citotóxicos destroem células infectadas — essa é a imunidade celular.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  // BIOLOGIA — Citologia
  {
    topicSlug: "bio-citologia",
    areaSlug: "ciencias-natureza",
    statement: "A mitose e a meiose são dois processos de divisão celular com funções distintas no organismo. Uma diferença fundamental entre esses processos é:",
    options: [
      { letter: "A", text: "A mitose ocorre apenas em células sexuais." },
      { letter: "B", text: "A meiose produz células diploides idênticas à célula-mãe." },
      { letter: "C", text: "A mitose gera duas células-filhas diploides geneticamente idênticas." },
      { letter: "D", text: "A meiose ocorre em células somáticas para reparo de tecidos." },
      { letter: "E", text: "A mitose produz variabilidade genética por recombinação." },
    ],
    correctLetter: "C",
    explanation: "A mitose é a divisão celular que gera duas células-filhas diploides (2n) geneticamente idênticas à célula-mãe, sendo essencial para crescimento e renovação tecidual. A meiose, por sua vez, produz células haploides (n) com variabilidade genética por recombinação.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  // QUÍMICA — Termoquímica
  {
    topicSlug: "qui-termoquimica",
    areaSlug: "ciencias-natureza",
    statement: "A combustão completa do metano (CH₄) libera 890 kJ/mol. Se uma residência consome 2 mol de metano por hora, qual a energia térmica liberada em 3 horas de uso?",
    options: [
      { letter: "A", text: "890 kJ" },
      { letter: "B", text: "1780 kJ" },
      { letter: "C", text: "2670 kJ" },
      { letter: "D", text: "5340 kJ" },
      { letter: "E", text: "8010 kJ" },
    ],
    correctLetter: "D",
    explanation: "Em 1 hora: 2 mol × 890 kJ/mol = 1780 kJ. Em 3 horas: 1780 kJ × 3 = 5340 kJ. A energia liberada numa reação exotérmica é proporcional à quantidade de reagente consumido.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  // QUÍMICA — Equilíbrio
  {
    topicSlug: "qui-equilibrio",
    areaSlug: "ciencias-natureza",
    statement: "Para a reação N₂(g) + 3H₂(g) ⇌ 2NH₃(g) (ΔH = −92 kJ/mol), qual perturbação desloca o equilíbrio no sentido de maior produção de amônia?",
    options: [
      { letter: "A", text: "Aumento de temperatura." },
      { letter: "B", text: "Redução da pressão total." },
      { letter: "C", text: "Remoção de NH₃ do sistema." },
      { letter: "D", text: "Adição de catalisador inerte." },
      { letter: "E", text: "Adição de gás nitrogênio, mas redução do hidrogênio." },
    ],
    correctLetter: "C",
    explanation: "Pelo Princípio de Le Chatelier, remover um produto desloca o equilíbrio para a direita (sentido de formação de NH₃). O catalisador acelera o atingimento do equilíbrio sem deslocá-lo. O aumento de temperatura favorece a reação endotérmica inversa.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  // QUÍMICA — Orgânica
  {
    topicSlug: "qui-funcoes-organicas",
    areaSlug: "ciencias-natureza",
    statement: "A saponificação é uma reação importante industrialmente. Nessa reação, um éster reage com uma base (NaOH ou KOH) para produzir:",
    options: [
      { letter: "A", text: "Ácido carboxílico + álcool." },
      { letter: "B", text: "Sal de ácido graxo (sabão) + glicerol." },
      { letter: "C", text: "Aldeidído + cetona." },
      { letter: "D", text: "Polímero + água." },
      { letter: "E", text: "Ácido mineral + gás carbônico." },
    ],
    correctLetter: "B",
    explanation: "Na saponificação, triglicerídeos (ésteres de ácidos graxos e glicerol) reagem com base forte. Os produtos são sais de ácidos graxos (sabões) e glicerol. O sabão atua como emulsificante graças à sua estrutura anfipática.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  // FÍSICA — Cinemática
  {
    topicSlug: "fis-cinematica",
    areaSlug: "ciencias-natureza",
    statement: "Um automóvel parte do repouso e acelera uniformemente a 4 m/s². Qual o espaço percorrido após 5 segundos?",
    options: [
      { letter: "A", text: "10 m" },
      { letter: "B", text: "20 m" },
      { letter: "C", text: "50 m" },
      { letter: "D", text: "100 m" },
      { letter: "E", text: "200 m" },
    ],
    correctLetter: "C",
    explanation: "Usando a equação do MRUV: s = v₀t + at²/2. Com v₀ = 0, a = 4 m/s² e t = 5 s: s = 0 + (4 × 25)/2 = 50 m. A distância percorrida é proporcional ao quadrado do tempo no MRUV.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  // FÍSICA — Eletrodinâmica
  {
    topicSlug: "fis-eletrodinamica",
    areaSlug: "ciencias-natureza",
    statement: "Um resistor de 10 Ω é ligado a uma fonte de 220 V. Qual a potência dissipada nesse resistor?",
    options: [
      { letter: "A", text: "22 W" },
      { letter: "B", text: "440 W" },
      { letter: "C", text: "484 W" },
      { letter: "D", text: "2200 W" },
      { letter: "E", text: "4840 W" },
    ],
    correctLetter: "E",
    explanation: "A potência elétrica é P = V²/R. Substituindo: P = (220)²/10 = 48400/10 = 4840 W. Alternativamente, pela Lei de Ohm, i = V/R = 22 A; P = i²R = 484 × 10 = 4840 W.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  // Mais 30 questões (10 CN, serão adicionadas via Phase 6)
  {
    topicSlug: "fis-energia",
    areaSlug: "ciencias-natureza",
    statement: "Uma pedra de massa 2 kg é lançada verticalmente para cima com velocidade inicial de 10 m/s (g = 10 m/s²). A que altura máxima ela chegará?",
    options: [
      { letter: "A", text: "1 m" },
      { letter: "B", text: "2 m" },
      { letter: "C", text: "5 m" },
      { letter: "D", text: "10 m" },
      { letter: "E", text: "20 m" },
    ],
    correctLetter: "C",
    explanation: "Usando conservação de energia: Ec = Ep → mv²/2 = mgh → h = v²/2g = 100/20 = 5 m. Alternativamente: v² = v₀² − 2gh → 0 = 100 − 20h → h = 5 m.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "qui-acidos-bases",
    areaSlug: "ciencias-natureza",
    statement: "Uma solução aquosa a 25°C apresenta concentração de íons H⁺ igual a 10⁻³ mol/L. Essa solução é:",
    options: [
      { letter: "A", text: "Básica, com pH = 3." },
      { letter: "B", text: "Ácida, com pH = 3." },
      { letter: "C", text: "Neutra, pois pH = 7." },
      { letter: "D", text: "Básica, com pH = 11." },
      { letter: "E", text: "Ácida, com pH = 11." },
    ],
    correctLetter: "B",
    explanation: "O pH é definido como −log[H⁺]. Para [H⁺] = 10⁻³, pH = −log(10⁻³) = 3. Como pH < 7, a solução é ácida. Em soluções ácidas, [H⁺] > [OH⁻].",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "bio-biomas",
    areaSlug: "ciencias-natureza",
    statement: "O Cerrado é considerado um hotspot de biodiversidade ameaçado globalmente. Uma das principais características que definem o Cerrado como bioma é:",
    options: [
      { letter: "A", text: "Presença de árvores com copas fechadas formando dossel denso." },
      { letter: "B", text: "Vegetação adaptada a solos ácidos e pobres com árvores retorcidas e raízes profundas." },
      { letter: "C", text: "Clima equatorial com chuvas abundantes o ano todo." },
      { letter: "D", text: "Temperaturas negativas no inverno e ausência de estação seca." },
      { letter: "E", text: "Vegetação exclusivamente herbácea sem presença de árvores." },
    ],
    correctLetter: "B",
    explanation: "O Cerrado ocorre predominantemente em solos ácidos e pobres em nutrientes do Planalto Central. Sua vegetação xeromórfica inclui árvores retorcidas com cortiça grossa (adaptação ao fogo) e sistemas radiculares profundos que acessam lençol freático durante a seca.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "fis-fisica-moderna",
    areaSlug: "ciencias-natureza",
    statement: "O efeito fotoelétrico, explicado por Einstein em 1905, demonstrou que a luz se comporta como partículas (fótons). Para que elétrons sejam ejetados de uma superfície metálica, é necessário que:",
    options: [
      { letter: "A", text: "A intensidade da luz seja suficientemente alta, independente da frequência." },
      { letter: "B", text: "A frequência da luz incidente seja maior que a frequência mínima do metal (frequência limiar)." },
      { letter: "C", text: "A luz seja monocromática e coerente (laser)." },
      { letter: "D", text: "O metal esteja em temperatura elevada para facilitar a ejeção." },
      { letter: "E", text: "A luz tenha comprimento de onda grande (vermelho ou infravermelho)." },
    ],
    correctLetter: "B",
    explanation: "No efeito fotoelétrico, cada fóton possui energia E = hf. Para ejetar um elétron, E deve ser ≥ à função trabalho φ do metal. Isso define a frequência limiar f₀ = φ/h. Abaixo dessa frequência, nenhum elétron é ejetado mesmo com luz intensa.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
]

// ── CIÊNCIAS HUMANAS (40 questões) ─────────────────────────────
const chQuestions: QuestionSeed[] = [
  {
    topicSlug: "hist-ditadura-militar",
    areaSlug: "ciencias-humanas",
    statement: "O Ato Institucional nº 5 (AI-5), decretado em 1968 pelo regime militar brasileiro, ficou conhecido como o ato mais duro da ditadura. Entre suas consequências, destacam-se:",
    options: [
      { letter: "A", text: "A redemocratização do país e a convocação de eleições diretas." },
      { letter: "B", text: "A suspensão de direitos políticos, fechamento do Congresso e censura à imprensa." },
      { letter: "C", text: "A abertura econômica ao capital estrangeiro e fim do milagre econômico." },
      { letter: "D", text: "A criação da ARENA como partido único de oposição." },
      { letter: "E", text: "A implantação do sufrágio universal e eleições para presidência." },
    ],
    correctLetter: "B",
    explanation: "O AI-5 cassou mandatos parlamentares, suspendeu habeas corpus, decretou censura e permitiu intervenções nos estados e municípios. Representou o período mais repressivo da ditadura (1968-1979), marcado por torturas e cassações políticas sistemáticas.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "hist-revolucao-francesa",
    areaSlug: "ciencias-humanas",
    statement: "A Revolução Francesa (1789) representou uma ruptura com o Antigo Regime. O lema 'Liberdade, Igualdade e Fraternidade' sintetizava as aspirações revolucionárias. A burguesia liderou esse movimento principalmente porque:",
    options: [
      { letter: "A", text: "Queria restaurar o poder da Igreja Católica na vida política." },
      { letter: "B", text: "Buscava igualdade jurídica e fim dos privilégios da nobreza que limitavam sua ascensão." },
      { letter: "C", text: "Pretendia estender o voto a todos os cidadãos, incluindo camponeses." },
      { letter: "D", text: "Defendia o retorno ao feudalismo como modelo econômico estável." },
      { letter: "E", text: "Desejava a abolição da propriedade privada e socialização dos meios de produção." },
    ],
    correctLetter: "B",
    explanation: "A burguesia francesa era economicamente ascendente, mas politicamente marginalizada pelo sistema estamental. Inspirada pelo Iluminismo, reivindicava igualdade civil e fim dos privilégios aristocráticos que limitavam sua participação política e econômica plena.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "geo-urbanizacao",
    areaSlug: "ciencias-humanas",
    statement: "O processo de urbanização brasileira foi marcado pela concentração em metrópoles e pelo surgimento de favelas. A principal causa do crescimento das favelas nas grandes cidades brasileiras a partir dos anos 1950 foi:",
    options: [
      { letter: "A", text: "Política habitacional governamental que direcionou imigrantes para áreas periféricas." },
      { letter: "B", text: "Industrialização concentrada que atraiu migrantes rurais sem infraestrutura urbana para absorvê-los." },
      { letter: "C", text: "Excesso de habitações formais que gerou especulação imobiliária." },
      { letter: "D", text: "Incentivos fiscais que direcionaram trabalhadores para centros históricos degradados." },
      { letter: "E", text: "Políticas de reforma agrária que desestimularam o campo sem criar empregos urbanos." },
    ],
    correctLetter: "B",
    explanation: "A industrialização concentrada nas metrópoles, especialmente São Paulo, atraiu fluxos migratórios massivos do campo. A falta de planejamento urbano e habitação acessível fez com que trabalhadores se instalassem em áreas informais — as favelas — tornando-se fenômeno estrutural do capitalismo periférico brasileiro.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "fil-etica",
    areaSlug: "ciencias-humanas",
    statement: "Immanuel Kant propôs o imperativo categórico como fundamento da ética. Segundo Kant, uma ação é moralmente correta quando:",
    options: [
      { letter: "A", text: "Produz o maior bem para o maior número de pessoas." },
      { letter: "B", text: "Segue os costumes e tradições da sociedade em que se vive." },
      { letter: "C", text: "Poderia ser universalizada como lei válida para todos os seres racionais." },
      { letter: "D", text: "Resulta na felicidade pessoal do agente que a pratica." },
      { letter: "E", text: "É aprovada pela autoridade religiosa ou pelo Estado." },
    ],
    correctLetter: "C",
    explanation: "O imperativo categórico de Kant estabelece: 'Age apenas segundo máximas que possas ao mesmo tempo querer que sejam leis universais.' Uma ação é moral quando pode ser universalizada sem contradição — independentemente das consequências ou emoções.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
  {
    topicSlug: "soc-desigualdade",
    areaSlug: "ciencias-humanas",
    statement: "O coeficiente de Gini é um indicador amplamente utilizado para medir desigualdade de renda. O Brasil historicamente apresenta um dos maiores Ginis do mundo. Isso indica que:",
    options: [
      { letter: "A", text: "O país possui alta renda per capita distribuída uniformemente." },
      { letter: "B", text: "Há grande concentração de renda em parcela pequena da população." },
      { letter: "C", text: "A pobreza absoluta é maior que nos países desenvolvidos." },
      { letter: "D", text: "O IDH brasileiro é baixo, abaixo da média mundial." },
      { letter: "E", text: "Não há mobilidade social possível na sociedade brasileira." },
    ],
    correctLetter: "B",
    explanation: "O índice de Gini varia de 0 (igualdade perfeita) a 1 (máxima desigualdade). Um Gini alto, como o do Brasil, indica que uma parcela pequena da população concentra grande parte da renda nacional, enquanto a maioria recebe proporcionalmente muito menos.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "geo-geopolitica",
    areaSlug: "ciencias-humanas",
    statement: "Após a Segunda Guerra Mundial, o mundo foi dividido em duas grandes esferas de influência na chamada Guerra Fria. Essa bipolaridade se baseava principalmente na oposição entre:",
    options: [
      { letter: "A", text: "Monarquias europeias e repúblicas americanas." },
      { letter: "B", text: "Países industrializados e países agrários." },
      { letter: "C", text: "O capitalismo liberal liderado pelos EUA e o socialismo soviético liderado pela URSS." },
      { letter: "D", text: "Democracias ocidentais e teocracias do Oriente Médio." },
      { letter: "E", text: "Nações colonizadoras e seus ex-territórios coloniais." },
    ],
    correctLetter: "C",
    explanation: "A Guerra Fria (1947-1991) foi marcada pela rivalidade ideológica e geopolítica entre os EUA (capitalismo, democracia liberal) e a URSS (socialismo, regime de partido único). Essa disputa influenciou conflitos ao redor do mundo sem confronto militar direto entre as superpotências.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "hist-2a-guerra",
    areaSlug: "ciencias-humanas",
    statement: "O Holocausto foi o genocídio sistemático de judeus e outros grupos pelo regime nazista durante a Segunda Guerra Mundial. Entre os fatores que possibilitaram esse crime, os historiadores destacam:",
    options: [
      { letter: "A", text: "Ausência de estrutura estatal organizada na Alemanha nazista." },
      { letter: "B", text: "A burocracia moderna e a obediência à autoridade legitimaram e executaram o extermínio em massa." },
      { letter: "C", text: "Resistência generalizada da população alemã que tornava o processo ineficiente." },
      { letter: "D", text: "Iniciativa espontânea de grupos paramilitares sem planejamento central." },
      { letter: "E", text: "Pressão exclusiva de outros países do Eixo sobre a Alemanha." },
    ],
    correctLetter: "B",
    explanation: "Sociólogos como Zygmunt Bauman analisaram o Holocausto como produto da modernidade: a burocracia estatal, a divisão do trabalho e a obediência à autoridade permitiram que indivíduos comuns participassem do extermínio sistêmico sem necessariamente nutrir ódio pessoal.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
  {
    topicSlug: "soc-cultura",
    areaSlug: "ciencias-humanas",
    statement: "O conceito de etnocentrismo, na Antropologia e na Sociologia, refere-se à tendência de:",
    options: [
      { letter: "A", text: "Valorizar todas as culturas igualmente, sem julgamento de valor." },
      { letter: "B", text: "Julgar outras culturas com base nos valores e padrões da própria cultura, considerando-a superior." },
      { letter: "C", text: "Adotar os costumes de outras culturas em detrimento da própria identidade." },
      { letter: "D", text: "Comparar culturas usando critérios científicos e objetivos." },
      { letter: "E", text: "Preservar culturas indígenas contra a influência ocidental." },
    ],
    correctLetter: "B",
    explanation: "O etnocentrismo é a tendência de avaliar outras culturas segundo os padrões da própria, tratando-a como referência universal e superior. Contrariamente, o relativismo cultural propõe analisar cada cultura segundo seus próprios valores e contexto histórico.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "geo-meio-ambiente",
    areaSlug: "ciencias-humanas",
    statement: "As mudanças climáticas globais provocadas pelo aquecimento são consideradas uma das maiores ameaças ambientais do século XXI. O principal gás responsável pelo efeito estufa antrópico é:",
    options: [
      { letter: "A", text: "Oxigênio (O₂), liberado pela queima de combustíveis." },
      { letter: "B", text: "Nitrogênio (N₂), por ser o gás mais abundante na atmosfera." },
      { letter: "C", text: "Dióxido de carbono (CO₂), gerado pela queima de combustíveis fósseis e desmatamento." },
      { letter: "D", text: "Hélio (He), liberado por usinas nucleares." },
      { letter: "E", text: "Ozônio (O₃), concentrado na estratosfera." },
    ],
    correctLetter: "C",
    explanation: "O CO₂ é o principal gás do efeito estufa de origem antrópica, gerado pela queima de combustíveis fósseis, desmatamento e processos industriais. O metano (CH₄) e o óxido nitroso (N₂O) também contribuem, mas o CO₂ é o principal responsável pelo aquecimento global.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "fil-politica",
    areaSlug: "ciencias-humanas",
    statement: "John Locke, filósofo iluminista inglês, defendia que o poder político tem origem num contrato social entre os indivíduos. Para Locke, o governo legítimo deve:",
    options: [
      { letter: "A", text: "Ter poder absoluto e indivisível para garantir a ordem social." },
      { letter: "B", text: "Ser hereditário e baseado no direito divino dos reis." },
      { letter: "C", text: "Respeitar os direitos naturais dos indivíduos: vida, liberdade e propriedade." },
      { letter: "D", text: "Abolir a propriedade privada para garantir a igualdade entre os cidadãos." },
      { letter: "E", text: "Centralizar todo o poder no Estado para evitar conflitos entre cidadãos." },
    ],
    correctLetter: "C",
    explanation: "Locke fundou o liberalismo político ao defender que os direitos naturais — vida, liberdade e propriedade — preexistem ao Estado. O governo legítimo existe apenas para protegê-los; quando os viola, o povo tem direito à resistência. Essa teoria influenciou as revoluções americana e francesa.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
  // 30 questões adicionais (simulando 40 por área)
  {
    topicSlug: "hist-revolucao-industrial",
    areaSlug: "ciencias-humanas",
    statement: "A Revolução Industrial, iniciada na Inglaterra no século XVIII, transformou radicalmente as relações de trabalho. Uma das principais consequências sociais desse processo foi:",
    options: [
      { letter: "A", text: "A extinção do trabalho manual e valorização dos artesãos." },
      { letter: "B", text: "A formação do proletariado urbano e piora inicial das condições de trabalho." },
      { letter: "C", text: "A distribuição igualitária da renda entre proprietários e trabalhadores." },
      { letter: "D", text: "A redução do êxodo rural, fixando populações no campo." },
      { letter: "E", text: "O desaparecimento da burguesia como classe dominante." },
    ],
    correctLetter: "B",
    explanation: "A Revolução Industrial criou o proletariado — trabalhadores que vendiam sua força de trabalho em fábricas. As condições iniciais eram precárias: longas jornadas, trabalho infantil, baixos salários e insalubridade. Isso gerou os primeiros movimentos operários e teorias socialistas.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "geo-demografia",
    areaSlug: "ciencias-humanas",
    statement: "A transição demográfica descreve a passagem de altas taxas de natalidade e mortalidade para baixas taxas em ambas. Em qual fase dessa transição se encontra a maioria dos países europeus desenvolvidos atualmente?",
    options: [
      { letter: "A", text: "Fase 1: altas taxas de natalidade e mortalidade, população estacionária." },
      { letter: "B", text: "Fase 2: mortalidade cai, natalidade alta, população cresce rapidamente." },
      { letter: "C", text: "Fase 3: mortalidade baixa, natalidade cai, crescimento desacelera." },
      { letter: "D", text: "Fase 4 ou 5: natalidade muito baixa, envelhecimento populacional acelerado." },
      { letter: "E", text: "Fora da transição demográfica, por serem países desenvolvidos." },
    ],
    correctLetter: "D",
    explanation: "Os países europeus desenvolvidos estão na fase avançada da transição demográfica: baixíssimas taxas de natalidade (algumas abaixo da taxa de reposição de 2,1 filhos/mulher) e alto índice de envelhecimento. Isso gera desafios como déficits previdenciários e necessidade de imigração.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "soc-cidadania",
    areaSlug: "ciencias-humanas",
    statement: "O sociólogo T. H. Marshall distinguiu três tipos de cidadania: civil, política e social. Os direitos sociais — como educação, saúde e moradia — foram conquistados principalmente:",
    options: [
      { letter: "A", text: "No século XVII, com as revoluções liberais europeias." },
      { letter: "B", text: "No século XX, com o desenvolvimento do Estado de bem-estar social." },
      { letter: "C", text: "Na Antiguidade Clássica, com a democracia ateniense." },
      { letter: "D", text: "Simultaneamente aos direitos civis, no século XIX." },
      { letter: "E", text: "Apenas nos países socialistas, sendo negados nas democracias liberais." },
    ],
    correctLetter: "B",
    explanation: "Segundo Marshall, a cidadania se desenvolveu em etapas: direitos civis (sec. XVIII), políticos (sec. XIX) e sociais (sec. XX). O Estado de bem-estar social (welfare state) do século XX institucionalizou direitos como saúde, educação e previdência como obrigações estatais.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
]

// ── LINGUAGENS E CÓDIGOS (40 questões) ─────────────────────────
const lctQuestions: QuestionSeed[] = [
  {
    topicSlug: "por-interpretacao",
    areaSlug: "linguagens",
    statement: "Leia o trecho: 'A linguagem não é apenas um instrumento de comunicação, mas a própria casa do ser.' (adaptado de Heidegger). Essa afirmação sugere que a linguagem:",
    options: [
      { letter: "A", text: "É apenas um código de sinais utilizado para transmitir informações objetivas." },
      { letter: "B", text: "Constitui o modo fundamental pelo qual os seres humanos habitam e compreendem o mundo." },
      { letter: "C", text: "É uma ferramenta criada artificialmente pelas sociedades para fins práticos." },
      { letter: "D", text: "Representa obstáculo ao pensamento filosófico por ser imprecisa." },
      { letter: "E", text: "É determinada biologicamente e não sofre influência cultural." },
    ],
    correctLetter: "B",
    explanation: "A metáfora de Heidegger — 'a linguagem é a casa do ser' — indica que a linguagem não é apenas meio de comunicação, mas condição de existência humana. É através dela que os seres humanos experienciam, interpretam e habitam o mundo, constituindo sua realidade.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
  {
    topicSlug: "por-variacao-linguistica",
    areaSlug: "linguagens",
    statement: "A língua portuguesa possui variações regionais, sociais e históricas. O fenômeno de uma pessoa adaptar sua fala ao contexto comunicativo — falando de modo mais formal em entrevistas de emprego e informalmente com amigos — é chamado de:",
    options: [
      { letter: "A", text: "Preconceito linguístico." },
      { letter: "B", text: "Dialeto regional." },
      { letter: "C", text: "Variação diatópica." },
      { letter: "D", text: "Adequação linguística ou variação diafásica." },
      { letter: "E", text: "Neologismo." },
    ],
    correctLetter: "D",
    explanation: "A variação diafásica (ou situacional) ocorre quando o falante adapta o registro linguístico à situação comunicativa — mais formal ou informal conforme o contexto. Isso demonstra competência comunicativa, não erro gramatical. Preconceito linguístico é a estigmatização de variedades não padrão.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "por-figuras-linguagem",
    areaSlug: "linguagens",
    statement: "No verso 'Minha alma é uma orquestra que toca / Sinfonias de silêncio e de saudade', a figura de linguagem predominante é a:",
    options: [
      { letter: "A", text: "Metonímia, pela substituição do todo pela parte." },
      { letter: "B", text: "Hipérbole, pelo exagero intencional." },
      { letter: "C", text: "Metáfora, pela identificação implícita entre elementos distintos." },
      { letter: "D", text: "Antítese, pela oposição de ideias." },
      { letter: "E", text: "Eufemismo, pela suavização de expressão." },
    ],
    correctLetter: "C",
    explanation: "A metáfora é uma comparação implícita sem 'como' ou 'tal qual'. No verso, 'alma' é identificada diretamente a 'orquestra', transferindo suas características ao conceito abstrato. O sinestésico 'sinfonia de silêncio' também é metafórico, unindo sensações contraditórias.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "lit-modernismo",
    areaSlug: "linguagens",
    statement: "A Semana de Arte Moderna de 1922 é considerada um marco do Modernismo brasileiro. Entre as propostas desse movimento, destacava-se:",
    options: [
      { letter: "A", text: "A imitação dos modelos clássicos europeus e valorização da linguagem formal." },
      { letter: "B", text: "A ruptura com o passado, valorização da cultura brasileira e linguagem coloquial." },
      { letter: "C", text: "O retorno ao Romantismo e idealização da natureza nacional." },
      { letter: "D", text: "A adesão ao Realismo e crítica científica da sociedade." },
      { letter: "E", text: "A defesa do purismo gramatical e combate ao regionalismo linguístico." },
    ],
    correctLetter: "B",
    explanation: "O Modernismo de 1922 propunha ruptura com o academismo europeu, valorização das raízes culturais brasileiras (indígenas, africanas e populares) e uso da linguagem coloquial. Autores como Mário e Oswald de Andrade defendiam a 'antropofagia cultural' — absorver o estrangeiro e transformá-lo em algo brasileiro.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "por-argumentacao",
    areaSlug: "linguagens",
    statement: "Num texto dissertativo-argumentativo, a proposta de intervenção deve apresentar uma solução para o problema abordado. Para ser considerada completa, essa proposta deve conter:",
    options: [
      { letter: "A", text: "Apenas a descrição do problema sem indicar soluções concretas." },
      { letter: "B", text: "Apenas o agente responsável pela ação, sem outros elementos." },
      { letter: "C", text: "Agente, ação, modo/meio, finalidade e possível efeito." },
      { letter: "D", text: "Exemplos históricos e citações de especialistas." },
      { letter: "E", text: "Uma conclusão retórica com apelo emocional ao leitor." },
    ],
    correctLetter: "C",
    explanation: "A proposta de intervenção completa no ENEM deve responder: Quem age? (agente), O que faz? (ação), Como faz? (modo/meio), Por quê? (finalidade) e Qual o efeito/resultado? Esse detalhamento demonstra consistência argumentativa e é critério avaliado na Competência V.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "lit-realismo",
    areaSlug: "linguagens",
    statement: "Machado de Assis é considerado o maior representante do Realismo no Brasil. Em suas obras, como 'Dom Casmurro' e 'Memórias Póstumas de Brás Cubas', o autor apresenta características como:",
    options: [
      { letter: "A", text: "Idealização dos personagens femininos e narrativa linear cronológica." },
      { letter: "B", text: "Narrador onisciente imparcial e descrição objetiva da realidade social." },
      { letter: "C", text: "Narrador não confiável, ironia fina e análise psicológica aprofundada dos personagens." },
      { letter: "D", text: "Exaltação do nacionalismo e natureza como cenário glorioso." },
      { letter: "E", text: "Linguagem simples, direta e ausência de recursos narrativos complexos." },
    ],
    correctLetter: "C",
    explanation: "Machado de Assis inovou ao criar narradores autodiegéticos não confiáveis (Brás Cubas fala do além; Bentinho pode ser vítima de seus próprios ciúmes). Sua ironia fina e análise psicológica dos personagens transcendem o Realismo positivista, antecipando o Modernismo.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
  {
    topicSlug: "ing-interpretacao",
    areaSlug: "linguagens",
    statement: "Read the text: 'Despite rapid technological advances, many researchers argue that face-to-face interaction remains essential for deep learning and meaningful social connections.' The word 'Despite' indicates a relation of:",
    options: [
      { letter: "A", text: "Consequence — something results from the technological advances." },
      { letter: "B", text: "Concession — the argument holds even considering the opposite fact." },
      { letter: "C", text: "Cause — technology causes the need for interaction." },
      { letter: "D", text: "Addition — a new idea is added to the previous one." },
      { letter: "E", text: "Exemplification — providing an example of the main idea." },
    ],
    correctLetter: "B",
    explanation: "'Despite' is a concession marker indicating that even though something (technological advances) is true, the opposite conclusion (face-to-face remains essential) still holds. Other concession markers: although, even though, in spite of. This is a key reading skill for ENEM English questions.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "art-publicidade",
    areaSlug: "linguagens",
    statement: "Uma peça publicitária usa a imagem de uma criança sorrindo ao lado do produto para induzir sentimentos de ternura e confiança no consumidor. Essa estratégia persuasiva é chamada de:",
    options: [
      { letter: "A", text: "Argumento de autoridade — uso de especialistas para validar o produto." },
      { letter: "B", text: "Apelo ao pathos — exploração de emoções para influenciar o público." },
      { letter: "C", text: "Argumento lógico — demonstração racional das qualidades do produto." },
      { letter: "D", text: "Uso de dados estatísticos para comprovar eficácia." },
      { letter: "E", text: "Intertextualidade — referência a outro texto para criar significado." },
    ],
    correctLetter: "B",
    explanation: "O apelo ao pathos (ethos, logos e pathos são as três categorias aristotélicas de persuasão) consiste em despertar emoções no receptor — ternura, medo, esperança — para influenciar seu comportamento. Na publicidade, imagens de crianças, animais e família ativam respostas emocionais positivas.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "por-generos-textuais",
    areaSlug: "linguagens",
    statement: "Os gêneros textuais são formas de comunicação socialmente estabelecidas. Um comunicado oficial do governo, um tweet irônico e um artigo científico são exemplos de gêneros distintos porque:",
    options: [
      { letter: "A", text: "Utilizam diferentes alfabetos e sistemas de escrita." },
      { letter: "B", text: "Possuem distintas funções comunicativas, suportes, estilos e públicos-alvo." },
      { letter: "C", text: "São produzidos em línguas diferentes por culturas distintas." },
      { letter: "D", text: "Divergem apenas no tamanho e número de palavras utilizadas." },
      { letter: "E", text: "Dependem exclusivamente do meio digital ou impresso em que circulam." },
    ],
    correctLetter: "B",
    explanation: "Os gêneros textuais diferem em função comunicativa (informar, persuadir, entreter), suporte (jornal, celular, revista científica), estilo (formal, informal, técnico), estrutura e público. Bakhtin definiu gêneros como 'tipos relativamente estáveis de enunciados' ligados a esferas de atividade social.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "lit-africana",
    areaSlug: "linguagens",
    statement: "A inclusão de obras de autores africanos de língua portuguesa no currículo do ENEM reflete uma mudança na concepção de literatura brasileira e lusófona. Autores como Pepetela (Angola) e Mia Couto (Moçambique) destacam-se por:",
    options: [
      { letter: "A", text: "Reprodução fiel dos modelos literários europeus do século XIX." },
      { letter: "B", text: "Obras que negam qualquer influência da oralidade e das culturas locais." },
      { letter: "C", text: "Narrativas que mesclam tradições orais africanas, colonialismo e identidade pós-colonial." },
      { letter: "D", text: "Literatura exclusivamente voltada para o público infantil africano." },
      { letter: "E", text: "Textos que glorificam o período colonial como fase de desenvolvimento." },
    ],
    correctLetter: "C",
    explanation: "A literatura africana de língua portuguesa dialoga com as tradições orais locais, processa o trauma colonial e constrói novas identidades pós-coloniais. Autores como Mia Couto criam uma língua que funde o português com estruturas e cosmovisões moçambicanas — representação de culturas híbridas.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
  {
    topicSlug: "por-coesao-coerencia",
    areaSlug: "linguagens",
    statement: "No trecho 'João estudou muito. Por isso, foi aprovado no vestibular.' o conectivo 'por isso' estabelece:",
    options: [
      { letter: "A", text: "Relação de oposição entre as ideias." },
      { letter: "B", text: "Relação de causa e consequência, indicando que o estudo causou a aprovação." },
      { letter: "C", text: "Relação de adição, somando informações equivalentes." },
      { letter: "D", text: "Relação de concessão, admitindo um fato contrário." },
      { letter: "E", text: "Relação temporal, indicando sequência cronológica." },
    ],
    correctLetter: "B",
    explanation: "'Por isso' é um conector conclusivo-causal que indica que a segunda oração é consequência da primeira. Coesão sequencial e coerência lógica são aspectos fundamentais para a construção de sentido em textos argumentativos — avaliados na Competência IV da redação ENEM.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "lit-modernismo",
    areaSlug: "linguagens",
    statement: "O poema 'No meio do caminho' de Carlos Drummond de Andrade, com a repetição de 'havia uma pedra no meio do caminho', caracteriza-se pela técnica de:",
    options: [
      { letter: "A", text: "Uso rigoroso de métrica clássica e rimas perfeitas." },
      { letter: "B", text: "Verso livre, repetição como recurso expressivo e linguagem simples carregada de simbolismo." },
      { letter: "C", text: "Descrição objetiva e científica da realidade social brasileira." },
      { letter: "D", text: "Exaltação da natureza e do caráter heroico do povo brasileiro." },
      { letter: "E", text: "Prosa poética de difícil compreensão elitista." },
    ],
    correctLetter: "B",
    explanation: "Drummond inovou com versos livres sem métrica rígida e explorou a repetição como recurso estrutural e simbólico. A 'pedra' representa obstáculos existenciais e sociais — é símbolo polissêmico. A linguagem direta e cotidiana é marca do Modernismo que rompe com o rebuscamento parnasiano.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "ing-vocabulario",
    areaSlug: "linguagens",
    statement: "The sentence 'The scientist's discovery was groundbreaking, completely changing the field of medicine.' The word 'groundbreaking' most likely means:",
    options: [
      { letter: "A", text: "Related to breaking ground physically for construction." },
      { letter: "B", text: "Revolutionary and innovative, representing a major advance." },
      { letter: "C", text: "Destructive and harmful to medical practices." },
      { letter: "D", text: "Slow and gradual, based on previous research." },
      { letter: "E", text: "Controversial and disputed by the scientific community." },
    ],
    correctLetter: "B",
    explanation: "'Groundbreaking' is an idiomatic adjective meaning highly innovative, pioneering, or revolutionary — like 'breaking new ground.' Context clues: 'completely changing the field' confirms it means a major transformative advance, not physical construction.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
]

// ── MATEMÁTICA (40 questões) ────────────────────────────────────
const mtQuestions: QuestionSeed[] = [
  {
    topicSlug: "mat-funcoes-2grau",
    areaSlug: "matematica",
    statement: "A função quadrática f(x) = x² − 6x + 8 possui raízes x₁ e x₂. Qual o valor do vértice da parábola (ponto de mínimo)?",
    options: [
      { letter: "A", text: "f(3) = 1" },
      { letter: "B", text: "f(3) = −1" },
      { letter: "C", text: "f(2) = 0" },
      { letter: "D", text: "f(4) = 0" },
      { letter: "E", text: "f(0) = 8" },
    ],
    correctLetter: "B",
    explanation: "O vértice tem xᵥ = −b/2a = 6/2 = 3. O valor mínimo é f(3) = 9 − 18 + 8 = −1. As raízes (onde f(x) = 0) são x = 2 e x = 4 pelo produto (c/a = 8) e soma (−b/a = 6).",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "mat-probabilidade",
    areaSlug: "matematica",
    statement: "Uma urna contém 4 bolas vermelhas, 3 azuis e 3 brancas. Uma bola é retirada aleatoriamente. Qual a probabilidade de ser vermelha ou azul?",
    options: [
      { letter: "A", text: "2/10" },
      { letter: "B", text: "3/10" },
      { letter: "C", text: "4/10" },
      { letter: "D", text: "7/10" },
      { letter: "E", text: "9/10" },
    ],
    correctLetter: "D",
    explanation: "Total de bolas = 10. Bolas vermelhas ou azuis = 4 + 3 = 7. P(vermelho ou azul) = 7/10. Como os eventos são mutuamente exclusivos, P(A ∪ B) = P(A) + P(B) = 4/10 + 3/10 = 7/10.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "mat-geometria-plana",
    areaSlug: "matematica",
    statement: "Um campo de futebol retangular tem 100 m de comprimento e 60 m de largura. Qual a distância entre dois cantos opostos (diagonal)?",
    options: [
      { letter: "A", text: "100 m" },
      { letter: "B", text: "116 m" },
      { letter: "C", text: "√11600 m ≈ 107,7 m" },
      { letter: "D", text: "160 m" },
      { letter: "E", text: "√13600 m ≈ 116,6 m" },
    ],
    correctLetter: "E",
    explanation: "Pelo teorema de Pitágoras: d² = 100² + 60² = 10000 + 3600 = 13600. d = √13600 = 20√34 ≈ 116,6 m. A diagonal do retângulo é sempre maior que qualquer lado.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "mat-analise-combinatoria",
    areaSlug: "matematica",
    statement: "De quantas maneiras diferentes podem ser formadas comissões de 3 pessoas escolhidas entre 7 candidatos, se a ordem dos membros não importa?",
    options: [
      { letter: "A", text: "21" },
      { letter: "B", text: "35" },
      { letter: "C", text: "42" },
      { letter: "D", text: "210" },
      { letter: "E", text: "343" },
    ],
    correctLetter: "B",
    explanation: "Como a ordem não importa, usamos combinação: C(7,3) = 7!/(3! × 4!) = (7 × 6 × 5)/(3 × 2 × 1) = 210/6 = 35. Se a ordem importasse (permutação), seria P(7,3) = 7 × 6 × 5 = 210.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "mat-trigonometria",
    areaSlug: "matematica",
    statement: "Um observador no topo de uma torre de 20 m de altura visualiza um ponto no solo com ângulo de depressão de 30°. Qual a distância horizontal entre a base da torre e esse ponto? (tan 30° = √3/3 ≈ 0,577)",
    options: [
      { letter: "A", text: "10 m" },
      { letter: "B", text: "10√3 m ≈ 17,3 m" },
      { letter: "C", text: "20 m" },
      { letter: "D", text: "20√3 m ≈ 34,6 m" },
      { letter: "E", text: "40 m" },
    ],
    correctLetter: "D",
    explanation: "O ângulo de depressão (30°) é igual ao ângulo de elevação visto do ponto no solo. tan(30°) = oposto/adjacente = 20/d. Portanto d = 20/tan(30°) = 20/(√3/3) = 20 × 3/√3 = 60/√3 = 20√3 ≈ 34,6 m.",
    difficulty: Difficulty.HARD,
    source: "Custom",
  },
  {
    topicSlug: "mat-estatistica",
    areaSlug: "matematica",
    statement: "As notas de 5 alunos numa prova foram: 6, 7, 8, 9, e 10. Qual o valor da média aritmética e do desvio padrão (aproximado)?",
    options: [
      { letter: "A", text: "Média = 8; desvio padrão = 0." },
      { letter: "B", text: "Média = 8; desvio padrão ≈ 1,41." },
      { letter: "C", text: "Média = 8; desvio padrão = 2." },
      { letter: "D", text: "Média = 7,5; desvio padrão = 1." },
      { letter: "E", text: "Média = 8; desvio padrão ≈ 0,71." },
    ],
    correctLetter: "B",
    explanation: "Média = (6+7+8+9+10)/5 = 40/5 = 8. Variância = [(6-8)² + (7-8)² + (8-8)² + (9-8)² + (10-8)²]/5 = [4+1+0+1+4]/5 = 10/5 = 2. Desvio padrão = √2 ≈ 1,41. O desvio mede a dispersão dos dados em torno da média.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "mat-financeira",
    areaSlug: "matematica",
    statement: "Um capital de R$ 2.000,00 é aplicado por 3 meses a juros simples de 2% ao mês. Qual o montante ao final do período?",
    options: [
      { letter: "A", text: "R$ 2.040,00" },
      { letter: "B", text: "R$ 2.080,00" },
      { letter: "C", text: "R$ 2.120,00" },
      { letter: "D", text: "R$ 2.122,42" },
      { letter: "E", text: "R$ 2.160,00" },
    ],
    correctLetter: "C",
    explanation: "Juros simples: M = C(1 + it) = 2000 × (1 + 0,02 × 3) = 2000 × 1,06 = R$ 2.120,00. O juro simples sempre incide sobre o capital inicial, diferente do composto que incide sobre o montante acumulado.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "mat-geometria-espacial",
    areaSlug: "matematica",
    statement: "Uma caixa cúbica tem volume de 216 cm³. Qual a área total de sua superfície?",
    options: [
      { letter: "A", text: "36 cm²" },
      { letter: "B", text: "72 cm²" },
      { letter: "C", text: "108 cm²" },
      { letter: "D", text: "144 cm²" },
      { letter: "E", text: "216 cm²" },
    ],
    correctLetter: "E",
    explanation: "Volume do cubo: V = a³ = 216 → a = ∛216 = 6 cm. Área total: AT = 6a² = 6 × 36 = 216 cm². (O cubo tem 6 faces quadradas iguais.)",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "mat-sequencias-pa-pg",
    areaSlug: "matematica",
    statement: "Os 5 primeiros termos de uma progressão aritmética são: 3, 7, 11, 15, 19. Qual o valor do 20º termo dessa progressão?",
    options: [
      { letter: "A", text: "75" },
      { letter: "B", text: "79" },
      { letter: "C", text: "83" },
      { letter: "D", text: "87" },
      { letter: "E", text: "91" },
    ],
    correctLetter: "B",
    explanation: "A PA tem razão r = 7 − 3 = 4 e primeiro termo a₁ = 3. Pela fórmula do termo geral: aₙ = a₁ + (n−1)r. a₂₀ = 3 + 19 × 4 = 3 + 76 = 79.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "mat-funcoes-1grau",
    areaSlug: "matematica",
    statement: "Uma empresa de táxi cobra R$ 5,00 de bandeirada mais R$ 2,50 por km rodado. Qual equação representa o custo C em função da distância d percorrida?",
    options: [
      { letter: "A", text: "C = 2,5d" },
      { letter: "B", text: "C = 5d + 2,5" },
      { letter: "C", text: "C = 5 + 2,5d" },
      { letter: "D", text: "C = 7,5d" },
      { letter: "E", text: "C = 5 × 2,5d" },
    ],
    correctLetter: "C",
    explanation: "A bandeirada é o custo fixo (R$ 5,00) e o custo por km é a taxa variável (R$ 2,50/km). Custo total: C = 5 + 2,5d. É uma função do 1º grau do tipo C = a + bd, onde a é o coeficiente linear (fixo) e b é o angular (variação).",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "mat-geometria-analitica",
    areaSlug: "matematica",
    statement: "Dois pontos A(2, 1) e B(6, 4) estão no plano cartesiano. Qual a distância entre eles?",
    options: [
      { letter: "A", text: "5" },
      { letter: "B", text: "√5" },
      { letter: "C", text: "√25 = 5" },
      { letter: "D", text: "7" },
      { letter: "E", text: "√7" },
    ],
    correctLetter: "A",
    explanation: "Fórmula da distância: d = √[(x₂−x₁)² + (y₂−y₁)²] = √[(6−2)² + (4−1)²] = √[16 + 9] = √25 = 5. Essa fórmula é derivada diretamente do teorema de Pitágoras no plano cartesiano.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
  {
    topicSlug: "mat-probabilidade",
    areaSlug: "matematica",
    statement: "Em uma turma de 30 alunos, 18 gostam de matemática, 15 gostam de português e 7 gostam de ambas. Quantos alunos não gostam de nenhuma das duas matérias?",
    options: [
      { letter: "A", text: "4" },
      { letter: "B", text: "7" },
      { letter: "C", text: "8" },
      { letter: "D", text: "11" },
      { letter: "E", text: "14" },
    ],
    correctLetter: "A",
    explanation: "Pelo princípio da inclusão-exclusão: |M ∪ P| = |M| + |P| − |M ∩ P| = 18 + 15 − 7 = 26. Os que gostam de pelo menos uma = 26. Não gostam de nenhuma = 30 − 26 = 4.",
    difficulty: Difficulty.MEDIUM,
    source: "Custom",
  },
  {
    topicSlug: "mat-funcoes-exponencial",
    areaSlug: "matematica",
    statement: "Uma bactéria se duplica a cada hora. Se inicialmente há 100 bactérias, quantas haverá após 4 horas?",
    options: [
      { letter: "A", text: "400" },
      { letter: "B", text: "800" },
      { letter: "C", text: "1.200" },
      { letter: "D", text: "1.600" },
      { letter: "E", text: "1.600" },
    ],
    correctLetter: "D",
    explanation: "Crescimento exponencial: N(t) = N₀ × 2^t. N(4) = 100 × 2⁴ = 100 × 16 = 1.600 bactérias. O crescimento exponencial é caracterizado por duplicação periódica — base de conceitos de juros compostos e decaimento radioativo.",
    difficulty: Difficulty.EASY,
    source: "Custom",
  },
]

async function createQuestion(
  prisma: PrismaClient,
  topicMap: Record<string, string>,
  q: QuestionSeed
) {
  const topicId = topicMap[q.topicSlug]
  if (!topicId) {
    console.warn(`    ⚠ Tópico não encontrado: ${q.topicSlug}`)
    return
  }

  const created = await prisma.question.create({
    data: {
      topicId,
      areaSlug: q.areaSlug,
      statement: q.statement,
      explanation: q.explanation,
      difficulty: q.difficulty,
      source: q.source,
      options: {
        create: q.options.map((opt, i) => ({
          letter: opt.letter,
          text: opt.text,
          order: i + 1,
        })),
      },
    },
    include: { options: true },
  })

  const correct = created.options.find((o) => o.letter === q.correctLetter)
  if (correct) {
    await prisma.question.update({
      where: { id: created.id },
      data: { correctId: correct.id },
    })
  }

  return created.id
}

export async function seedQuestions(prisma: PrismaClient) {
  console.log("  Seeding questões autorais...")

  // Mapeia slug do tópico → id
  const topics = await prisma.topic.findMany({ select: { id: true, slug: true } })
  const topicMap: Record<string, string> = {}
  for (const t of topics) topicMap[t.slug] = t.id

  // Limpa questões autorais existentes antes de recriar (idempotente)
  await prisma.question.deleteMany({ where: { source: "Custom" } })

  let count = 0
  for (const q of [...cnQuestions, ...chQuestions, ...lctQuestions, ...mtQuestions]) {
    await createQuestion(prisma, topicMap, q)
    count++
  }

  console.log(`  ✓ ${count} questões autorais criadas`)
}
