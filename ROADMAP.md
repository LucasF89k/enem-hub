# ENEM Medicina Hub — Roadmap de Implementação

> Use este arquivo para saber exatamente o que implementar em cada sessão do Claude Code.
> Marque tarefas como `[x]` ao concluir. Nunca pule fases.
> A Fase 6 (conteúdo) é independente — rode após o deploy, quando quiser.

---

## INFRAESTRUTURA DE BANCO DE DADOS

### PostgreSQL — Neon.tech (gratuito)

Neon é PostgreSQL serverless. Free tier tem 3GB, sem expiração, sem cartão.

```bash
# Após criar o banco no Neon, a DATABASE_URL tem este formato:
DATABASE_URL="postgresql://user:password@ep-xxx.us-east-1.aws.neon.tech/enem_hub?sslmode=require"
```

**Dev local** (opcional, se quiser banco local):
```bash
docker run --name enem-db -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=enem_hub -p 5432:5432 -d postgres:16

# .env local:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/enem_hub"
```

### Armazenamento de imagens — Cloudinary (gratuito)

Questões ENEM têm gráficos, tabelas e fórmulas como imagem.
Nunca salve imagens no PostgreSQL. Salve só a URL.

Free tier Cloudinary: 25GB storage + CDN global. Não expira.

### IA — Gemini API (gratuito)

- Modelo: `gemini-1.5-flash`
- Free tier: 15 requisições/minuto, 1.000.000 tokens/dia
- Suficiente para Mentor ENEM em uso pessoal e para rodar todos os scripts

### Stack completa — R$ 0/mês

| Serviço | Uso | Free tier |
|---------|-----|-----------|
| Vercel | Deploy | Ilimitado |
| Neon.tech | PostgreSQL | 3GB |
| Gemini API | IA | 1M tokens/dia |
| Cloudinary | Imagens | 25GB |

---

## FONTES DE QUESTÕES ENEM

### Fonte 1 — APIs JSON públicas (principal)

Estas fontes têm as questões já estruturadas em JSON, fácil de importar:

```
# API com questões 2009+ em JSON
https://api.enem.dev/v1/exams

# Endpoint de questões por ano
https://api.enem.dev/v1/exams/2023/questions

# Repositório GitHub com dados estruturados
https://github.com/nicholasess/enem-api
```

> O Claude Code deve fazer um GET primeiro e logar o formato antes de escrever o parser.
> Não assuma estrutura — adapte ao que a API retornar.

### Fonte 2 — INEP Oficial (gabaritos)

```
# Gabaritos e provas oficiais (PDFs)
https://www.gov.br/inep/pt-br/areas-de-atuacao/avaliacao-e-exames-educacionais/enem/provas-e-gabaritos
```

### O que cada fonte tem

| Fonte | Enunciado | Alternativas | Gabarito | Explicação | Imagens |
|-------|-----------|-------------|----------|-----------|---------|
| APIs JSON | ✅ | ✅ | ✅ | ❌ | ⚠️ algumas |
| INEP PDF | ✅ | ✅ | ✅ | ❌ | ✅ |
| Gemini (script) | — | — | — | ✅ gerada | — |

**Estratégia:** importa questões + gabaritos das APIs → Gemini gera as explicações.

### Custo estimado dos scripts (Fase 6)

| Script | Operações | Modelo | Custo |
|--------|-----------|--------|-------|
| import-questions.ts | ~2.700 questões | sem IA | R$ 0 |
| generate-explanations.ts | ~2.700 explicações | gemini-1.5-flash | R$ 0 |
| generate-content.ts | 150 tópicos | gemini-1.5-flash | R$ 0 |
| generate-flashcards.ts | 1.500 cards | gemini-1.5-flash | R$ 0 |
| seed-redacao.ts | 15 temas | gemini-1.5-flash | R$ 0 |
| **TOTAL** | | | **R$ 0** |

Tudo dentro do free tier do Gemini. Só precisa respeitar o rate limit (15 req/min).

---

## FASE 0 — Setup do Projeto
**Objetivo:** Projeto rodando localmente com autenticação funcional.
**Estimativa:** 2 sessões

### Sessão 1 — Scaffold completo
```
Prompt para o Claude Code:

"Fase 0 Sessão 1: cria o projeto completo do zero.

1. Scaffold:
npx create-next-app@latest enem-hub --typescript --tailwind --app --src-dir --import-alias '@/*'

2. Instala todas as dependências de uma vez:
npm install next-auth@beta @auth/prisma-adapter prisma @prisma/client
framer-motion lucide-react zod react-hook-form @hookform/resolvers
zustand @tanstack/react-query recharts idb @google/generative-ai
clsx tailwind-merge date-fns bcryptjs react-markdown remark-gfm
sonner canvas-confetti p-limit @types/bcryptjs --save-dev

3. Inicializa shadcn/ui (npx shadcn@latest init) com:
- Style: Default
- Base color: Violet
- CSS variables: yes

4. Adiciona componentes shadcn necessários:
npx shadcn@latest add button card input label sheet dialog drawer
tabs badge progress skeleton separator avatar select checkbox
radio-group slider popover command tooltip

5. Copia prisma/schema.prisma do repositório (já existe).
Roda: npx prisma generate && npx prisma migrate dev --name init

6. Cria src/lib/db.ts (Prisma singleton para Next.js).

7. Cria src/lib/gemini.ts com cliente GoogleGenerativeAI usando
modelo gemini-1.5-flash. Exporta: gemini, geminiPro, generateText,
generateJSON<T>. Usa process.env.GEMINI_API_KEY.

8. Cria src/styles/globals.css com CSS variables do design system:
primary roxo (#7C3AED família), accent verde (#22C55E),
warning amarelo, background escuro no .dark.

9. Configura next/font com Inter (display + body) e JetBrains Mono
(código/fórmulas) em src/app/layout.tsx.

10. Cria .env.example com todas as variáveis:
DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL,
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
GEMINI_API_KEY, CLOUDINARY_URL, CLOUDINARY_CLOUD_NAME,
CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET, NEXT_PUBLIC_APP_URL"
```

**Checklist:**
- [ ] `prisma migrate dev` roda sem erros
- [ ] `npm run dev` sobe sem erros
- [ ] shadcn/ui componentes importando corretamente
- [ ] `src/lib/gemini.ts` criado
- [ ] CSS variables do design system no globals.css
- [ ] `.env.example` completo

### Sessão 2 — Autenticação
```
Prompt para o Claude Code:

"Fase 0 Sessão 2: autenticação completa com NextAuth.

1. Cria src/lib/auth.ts com NextAuth configurado:
- Credentials provider (email + senha com bcrypt)
- PrismaAdapter com o db client
- Callbacks: session e jwt incluindo user.id
- Pages: signIn: '/login'

2. Cria src/app/api/auth/[...nextauth]/route.ts

3. Cria src/middleware.ts:
- Protege todas as rotas em /app/*
- Redireciona para /login se não autenticado
- Se autenticado e sem UserProfile → redireciona para /onboarding

4. Cria páginas:
- /login: formulário email + senha, link para /register,
  validação Zod, feedback de erro inline
- /register: nome, email, senha, confirmar senha,
  validação Zod com regex de força de senha

5. Cria Server Actions em src/app/actions/auth.actions.ts:
- register(data): valida com Zod, verifica email duplicado,
  hash bcrypt(10), cria User + UserProfile padrão, redireciona /onboarding
- logout(): chama signOut do NextAuth

6. Layout (auth)/layout.tsx: centralizado, sem BottomNav,
logo + título do app no topo, card branco/escuro ao centro."
```

**Checklist:**
- [ ] Register cria usuário com senha hasheada
- [ ] Login funciona e cria sessão
- [ ] Logout limpa sessão
- [ ] Middleware redireciona rotas protegidas
- [ ] Erros de validação aparecem inline nos formulários

---

## FASE 1 — Core Loop (MVP)
**Estimativa:** 7 sessões

### Sessão 3 — AppShell
```
Prompt:

"Fase 1 Sessão 3: AppShell responsivo completo.

1. src/components/layout/BottomNav.tsx:
- 5 abas: Home(Início/dashboard), BookOpen(Estudar/study),
  Brain(Revisões/flashcards), HelpCircle(Questões/questions),
  User(Perfil/profile)
- Ativa a aba com base no pathname (usePathname)
- Visível apenas em mobile (md:hidden)
- fixed bottom-0, z-50, blur backdrop, borda top sutil
- Área de toque h-14 em cada aba
- Label pequena abaixo do ícone
- Indicador visual na aba ativa (cor primária + dot ou underline)

2. src/components/layout/Sidebar.tsx:
- Visível apenas tablet+ (hidden md:flex)
- Largura: 240px tablet, 260px desktop
- Recolhível no tablet (ícone para expandir/recolhir)
- Mesmos 5 itens do BottomNav + itens secundários:
  BarChart(Analytics), Calendar(Planner), FileText(Notas),
  MessageCircle(Mentor), Settings(Configurações)
- Avatar + nome do usuário no rodapé

3. src/components/layout/Header.tsx:
- h-12, título da página atual
- Slot direito para ações contextuais (passado via props)
- Botão de busca global (ícone Search → abre CommandDialog)

4. src/app/(app)/layout.tsx:
- Busca sessão do usuário (auth())
- Renderiza Header + conteúdo + BottomNav (mobile) ou Sidebar (tablet+)
- main com padding correto: pt-12 pb-20 (mobile), pt-0 md:pl-60 (tablet+)
- Framer Motion AnimatePresence para transições de página"
```

### Sessão 4 — Onboarding
```
Prompt:

"Fase 1 Sessão 4: fluxo de onboarding em /onboarding.

4 passos com progress bar animada no topo.
Transição entre passos: slide horizontal com Framer Motion.

Passo 1 — Boas-vindas:
Input: como quer ser chamado (pré-preenchido do User.name).
Texto motivacional sobre medicina.

Passo 2 — Sua meta:
Slider de nota alvo: 700-1000, passo 10, padrão 950.
Label dinâmica: abaixo de 750 = 'Boa pontuação', 800-899 = 'Muito boa',
900+ = 'Nota de Medicina'.
Input de texto: universidade alvo (autocomplete com top 20 faculdades
de Medicina do Brasil em src/constants/med-schools.ts).

Passo 3 — Sua disponibilidade:
DatePicker (shadcn): data prevista do ENEM.
Slider: horas por dia (1-12h, passo 0.5).
Checkboxes: dias da semana disponíveis (seg-dom), padrão todos.

Passo 4 — Tudo pronto:
Card de resumo: nome, meta, data, horas/dia.
Botão 'Começar a estudar' (animação de pulso).

Server Action completeOnboarding:
Atualiza UserProfile com targetScore, targetCourse, examDate,
dailyStudyGoal. Redireciona para /dashboard."
```

### Sessão 5 — Seed inicial
```
Prompt:

"Fase 1 Sessão 5: seed completo e modular.

Cria prisma/seed.ts que importa e chama em sequência:
seedAreas(), seedAchievements(), seedSimulados()
de arquivos separados.

prisma/seed-cn.ts — Ciências da Natureza:
- Area: Ciências da Natureza, slug: ciencias-natureza, cor: green
- Disciplines: Biologia, Química, Física
- 36 Topics (12 por disciplina) com importance e frequency reais.
  Biologia: Citologia, Genética, Evolução, Ecologia, Fisiologia Animal,
  Botânica, Vírus e Bactérias, Fungos e Protistas, Embriologia,
  Histologia, Sistemática, Biomas
  Química: Tabela periódica, Ligações químicas, Termoquímica,
  Eletroquímica, Cinética, Equilíbrio, Soluções, Ácidos e bases,
  Orgânica geral, Funções orgânicas, Reações orgânicas, Polímeros
  Física: Mecânica, Cinemática, Dinâmica, Energia, Termodinâmica,
  Óptica, Ondulatória, Eletrostática, Eletrodinâmica, Magnetismo,
  Física moderna, Gravitação

prisma/seed-ch.ts — Ciências Humanas (estrutura similar, 32 tópicos)
prisma/seed-lct.ts — Linguagens (28 tópicos)
prisma/seed-mt.ts — Matemática (20 tópicos)

prisma/seed-questions.ts — 200 questões autorais (40 por área),
cada uma com 5 alternativas, correctId definido, explanation completa
no estilo ENEM.

prisma/seed-flashcards.ts — 60 flashcards básicos (12 por área)
tipo BASIC e CLOZE distribuídos nos tópicos de maior importância.

prisma/seed-simulados.ts — 3 simulados:
1. 'Simulado Completo ENEM' (FULL, 45 questões, 90 min)
2. 'Simulado CN' (AREA, 20 questões, 40 min)
3. 'Simulado CH' (AREA, 20 questões, 40 min)

prisma/seed-achievements.ts — 30 achievements nas categorias:
STREAK (7 conquistas), STUDY (6), QUESTIONS (6),
FLASHCARDS (4), SIMULADO (3), SCORE (2), SPECIAL (2).

Comando: npx prisma db seed"
```

### Sessão 6 — Dashboard
```
Prompt:

"Fase 1 Sessão 6: dashboard completo em /dashboard.

Server Component puro. Busca todos os dados em paralelo com Promise.all:

const [profile, todayTime, weekStreak, pendingCards,
       areaStats, todayPlan] = await Promise.all([...])

Widgets a criar (cada um como componente separado em components/dashboard/):

MetaCard: nota alvo vs estimada, barra de progresso visual,
  dias restantes para o ENEM em destaque.

StreakCard: streak atual em grande, ícone de fogo,
  calendário mini dos últimos 7 dias (bolinhas verde/cinza).

TempoHojeCard: tempo estudado hoje vs meta diária,
  barra de progresso circular (SVG), tempo da semana.

RevisoesPendentesCard: número de flashcards para revisar hoje,
  botão 'Revisar agora' → /flashcards.

EvolucaoAreaChart: RadarChart (Recharts) com taxa de acerto
  nas 4 áreas. Marcadores nos vértices com nome da área.

PlanoHojeCard: lista dos próximos 3 itens do plano do dia,
  checkbox para marcar como feito, link 'Ver plano completo'.

ProximaSessaoCard: sugestão do próximo tópico para estudar
  baseado em prioridade (importance × frequency, sem estudo recente).

Skeleton loaders com Suspense em cada widget.
Layout: grid responsivo, 1 coluna mobile, 2 colunas tablet, 3 desktop."
```

### Sessão 7 — Navegação de conteúdo
```
Prompt:

"Fase 1 Sessão 7: navegação hierárquica de estudo.

/study:
Grid de 5 cards de área. Cada card: ícone grande, nome, cor de fundo suave,
badge com total de tópicos, barra de progresso (% estudados pelo usuário).

/study/[areaSlug]:
Header com nome e cor da área. Lista de disciplinas em cards.
Cada card: ícone, nome, contagem de tópicos, % completado.

/study/[areaSlug]/[disciplineSlug]:
Lista de tópicos com:
- Nome do tópico
- Badges de importância (estrelas 1-5, só mostra ≥4)
- Badge de frequência ENEM ('Muito cobrado' se frequency=5)
- Indicador se já foi estudado (ícone de check verde)
Ordenados por importance DESC, frequency DESC.

/study/[areaSlug]/[disciplineSlug]/[topicSlug]:
Tabs shadcn com 4 abas:

Tab 'Teoria':
  Renderiza content.body com prose do Tailwind Typography.
  Suporte a HTML com h3, strong, em, table, ul, ol.
  Font-size 16px, line-height 1.75 para leitura longa.
  Tempo de leitura estimado no topo ('~8 min').

Tab 'Resumo':
  Card com content.summary.
  Seção keyConcepts: chips/badges de conceitos-chave.
  Seção tips: lista com ícone de lâmpada.
  Seção formulas: código monospace em cards.
  Seção tricks: lista com ícone de estrela.

Tab 'Flashcards':
  Lista de flashcards do tópico (preview da frente).
  Card de stats: total, pendentes para hoje, já dominados.
  Botão 'Iniciar revisão' → /flashcards?topicId=[id]

Tab 'Questões':
  Lista de questões do tópico (preview do enunciado + dificuldade).
  Botão 'Praticar questões' → /questions?topicId=[id]

Header da página: breadcrumb (Área > Disciplina > Tópico),
botão favoritar (Server Action toggleFavorite)."
```

### Sessão 8 — Flashcards com SM-2
```
Prompt:

"Fase 1 Sessão 8: sistema completo de flashcards com SM-2.

1. src/lib/sm2.ts — algoritmo SM-2 completo:
Interface SM2Input { rating: 1|2|3|4, stability: number,
  difficulty: number, elapsed: number }
Interface SM2Output { stability: number, difficulty: number,
  scheduled: number, nextReview: Date, state: ReviewState }

Implementação:
- rating 1 (Again): state=LEARNING, scheduled=1, difficulty+=0.2
- rating 2 (Hard): scheduled=max(1, floor(scheduled*1.2)), difficulty+=0.1
- rating 3 (Good): scheduled=floor(stability * difficulty_factor)
  difficulty_factor = 1 + (difficulty - 5) * 0.1 (clamped 0.5-1.5)
- rating 4 (Easy): scheduled=floor(scheduled*1.3*1.3), difficulty-=0.1
difficulty sempre clampado entre 1 e 10
stability = scheduled após cada revisão
nextReview = addDays(now, scheduled)

2. /flashcards — página principal:
Server Component: busca flashcards com nextReview <= now do usuário.
Mostra: total pendente em destaque, lista de decks com pendentes,
botão 'Revisar tudo' e botão por deck.
Se zero pendentes: empty state com próxima revisão agendada.

3. FlashcardReviewScreen (Client Component):
State: cards[], currentIndex, isFlipped, sessionStats
Card principal: div com perspective-1000, rotateY animation no flip.
Frente: front do flashcard.
Verso (após flip): back do flashcard.
Tap em qualquer lugar do card = flip.

Após flip aparecem 4 botões:
Again(vermelho), Hard(laranja), Good(azul), Easy(verde).
Largura mínima h-12 cada.

Gestos de swipe com useDragControls Framer Motion:
threshold 80px horizontal: direita=Easy(4), esquerda=Again(1).
Animação: card sai voando na direção do swipe.

Progresso: barra no topo (currentIndex/total).
Estatísticas ao vivo: ✓ certas, ✗ erradas.

Server Action submitFlashcardReview(cardId, rating):
Chama sm2() com dados do último review ou defaults (stability=1, difficulty=5).
Cria FlashcardReview no banco.
Chama awardXP(userId, 5, 'flashcard').

4. Tela de conclusão:
Cards revisados, tempo total, XP ganho, breakdown Again/Hard/Good/Easy.
Botão 'Voltar ao início'."
```

### Sessão 9 — Banco de questões
```
Prompt:

"Fase 1 Sessão 9: banco de questões completo.

1. /questions — página de listagem com filtros:
Filtros colapsáveis (Sheet no mobile, sidebar no desktop):
- Área (select), Disciplina (select dependente), Tópico (select dependente)
- Dificuldade (checkbox: Fácil, Médio, Difícil, Muito difícil)
- Ano (select: 2009-2024 + 'Questões autorais')
- Toggle 'Somente erradas', Toggle 'Somente favoritas'

Lista paginada (20 por página):
- Preview do enunciado (máx 120 chars)
- Badge de área com cor, badge de dificuldade
- Ícone de check se já respondeu corretamente
- Ícone de coração se favoritada

2. /questions/[id] — tela de resolução:
Server Component busca a questão.
Client Component QuestionResolver para interatividade.

Layout mobile:
- Enunciado: HTML renderizado, font-size 15px, suporte a imagens
  (next/image responsivo)
- 5 opções (A-E): botões com min-h-14, letra em badge circular
  no início, texto à direita. Estado: default/selecionado/correto/errado
- Ao selecionar: destaque visual (ring colorido)
- Botão 'Confirmar' aparece após selecionar (evita toque acidental)
- Cronômetro discreto no header (conta tempo, não pressiona)

Após confirmar:
- Feedback: banner verde 'Correto! +10 XP' ou vermelho 'Errado'
- Opção correta fica verde, selecionada errada fica vermelha
- Expansão animada da explicação completa (Accordion)
- Botões: 'Favoritar', 'Ver teoria' (link para conteúdo do tópico)
- Botão 'Próxima questão' (ou 'Finalizar' se for a última)

Server Action answerQuestion(questionId, selectedOptionId):
Cria UserQuestion no banco.
Chama awardXP(userId, isCorrect ? 10 : 2, 'question').
Retorna { isCorrect, correctId, explanation }."
```

---

## FASE 2 — Simulados + Redação + Analytics + Planejador
**Estimativa:** 4 sessões

### Sessão 10 — Simulados
```
Prompt:

"Fase 2 Sessão 10: simulados completos.

/simulados: lista de simulados disponíveis.
Cada card: título, tipo badge, duração, última nota do usuário,
botão 'Iniciar' ou 'Continuar' (se IN_PROGRESS).

/simulados/[id]: página de configuração.
Resumo do simulado. Botão 'Iniciar simulado'.
Server Action startSimulado: cria UserSimulado com status IN_PROGRESS,
redireciona para /simulados/[id]/[attemptId].

/simulados/[id]/[attemptId]: tela de resolução (Client Component).
Estado: answers{}, currentIndex, timeLeft, markedForReview[].
Cronômetro: countdown do tempo total, vermelho quando <5min.
Header: tempo + progresso (X/Y questões respondidas).
Painel lateral de navegação (Sheet no mobile):
  Grid de números, cor: cinza=não respondida, azul=respondida,
  amarelo=marcada para revisão. Tap para navegar.
Uma questão por vez (mesmo componente do banco de questões, sem feedback).
Auto-save: Server Action saveSimuladoAnswer a cada resposta.
Botão 'Finalizar': confirma se há questões sem resposta,
  chama finishSimulado → calcula score, status=COMPLETED.

/simulados/[id]/[attemptId]/result: resultado.
Score total em grande. Barras de score por área (4 barras).
Lista de questões: ✓ certas | ✗ erradas (filtráveis).
Tap em questão errada: expande com enunciado + explicação.
LineChart (Recharts): evolução de score neste simulado vs anteriores.
Botões: 'Revisar erros' → /questions?simuladoId=[id]&filter=wrong."
```

### Sessão 11 — Redação + Analytics + Planejador
```
Prompt:

"Fase 2 Sessão 11: redação, analytics e planejador.

─── REDAÇÃO ───

/redacao: lista de redações. Card: tema, data, nota total (badge colorido).
Botão 'Nova redação'.

/redacao/new:
Campo 'Tema da redação' (input texto).
Textarea principal: font-size 16px, line-height 1.8, sem resize horizontal.
Contador de linhas no lado esquerdo (1-30, estilo editor de código).
Linha 30 em vermelho se ultrapassar.
Contador de palavras/chars no rodapé.
Auto-save: debounce 30s, ícone de status ('Salvando...' / 'Salvo').
Drawer lateral 'Banco de apoio':
  Tabs: Repertórios | Conectivos | Estruturas de proposta
Botão 'Avaliar redação': loading state 'O Mentor está corrigindo...'
  Chama Server Action evaluateEssay → gemini.generateJSON com prompt
  pedindo { comp1: number, comp2: number, comp3: number, comp4: number,
  comp5: number, feedback: string, suggestionsPerComp: string[] }.
  Salva no banco, exibe resultado.
Resultado: 5 barras de progresso (0-200 cada) + nota total + feedback.

─── ANALYTICS ───

/analytics: Server Component, queries agregadas com Prisma.

Seção 'Visão Geral': 4 cards — horas hoje, horas semana, streak, XP total.
Seção 'Taxa de acerto por área': RadarChart (Recharts, 4 eixos).
Seção 'Evolução': LineChart com nota estimada ao longo do tempo
  (pontos = simulados completados).
Seção 'Atividade': CalendarHeatmap — SVG 52×7 grid,
  cor proporcional a minutos estudados naquele dia,
  últimos 365 dias, tooltip no hover.
Seção 'Tópicos críticos': lista de tópicos com taxa de acerto <40%,
  link direto para estudar.

─── PLANEJADOR ───

/planner: calendário semanal (7 colunas, dom-sab).
Cada dia: data no topo, lista de StudyPlanItems do dia.
Item: ícone do tipo, título, duração, checkbox de concluído.
Tap no item: Sheet com detalhes + opções (concluir, reagendar, remover).
Botão 'Gerar novo plano': Sheet com formulário simples.

Server Action generateStudyPlan(params):
Importa src/lib/planner.ts.
Algoritmo: busca tópicos sem Content ou com taxa de erro alta,
calcula score = (freq × 0.4) + (taxaErro × 0.4) + (imp × 0.2),
ordena DESC, preenche os dias disponíveis respeitando dailyGoal,
intercala 30% do tempo com revisões FSRS pendentes,
cria StudyPlanItems no banco."
```

---

## FASE 3 — Mentor + PWA + Gamificação
**Estimativa:** 3 sessões

### Sessão 12 — Mentor ENEM
```
Prompt:

"Fase 3 Sessão 12: Mentor ENEM com streaming via Gemini.

/mentor: interface de chat mobile-first (Client Component).
Estado: messages[], input, isLoading
Layout: mensagens scrolláveis + input fixo acima do BottomNav.

Chips de ação rápida (scroll horizontal, acima do input):
'Meus pontos fracos' | 'O que estudar hoje' |
'Explique [tópico atual]' | 'Crie 5 flashcards'
Ao clicar: insere texto no input e dispara.

Bolhas de mensagem: usuário (direita, cor primária),
mentor (esquerda, card). Suporte a markdown (react-markdown).

Streaming: Route Handler em /api/mentor/route.ts.
POST recebe { messages[], context }.
Monta system prompt com contexto do usuário:
- Últimas 5 questões erradas (tópico + disciplina)
- Nota estimada atual
- Tópico atual (se passado via query param)
- Plano do dia de hoje

Chama gemini.generateContentStream().
Retorna ReadableStream com os chunks.

No cliente: fetch com reader, atualiza a mensagem do assistente
chunk a chunk (efeito de digitação real).

Histórico: mantido em Zustand (não persiste no banco).
Botão de copiar em cada mensagem do assistente."
```

### Sessão 13 — PWA + Offline
```
Prompt:

"Fase 3 Sessão 13: PWA completo e modo offline.

1. public/manifest.json:
name: 'ENEM Medicina Hub', short_name: 'ENEM Hub',
theme_color: '#7C3AED', background_color: '#0F0A1E',
display: 'standalone', orientation: 'portrait',
start_url: '/dashboard', scope: '/',
icons: 192x192, 512x512, 512x512 maskable (criar SVG simples),
screenshots: 1 mobile.

2. public/sw.js — Service Worker manual:
Install event: pre-cache shell (/, /dashboard, /study, /flashcards,
  /questions, fontes, CSS, JS crítico).
Fetch event com estratégias:
- CacheFirst: /_next/static/*, /icons/*, fontes Google
- NetworkFirst com fallback: /api/*, páginas dinâmicas
- StaleWhileRevalidate: imagens de conteúdo (/cloudinary/*)
Background sync: ao voltar online, processa offline queue.

3. next.config.js:
Headers para manifest e service worker.
Adiciona tag <link rel=manifest> e registro do SW no layout.tsx.

4. src/lib/offline-queue.ts com idb:
openDB com store 'pending-actions'.
enqueue(action: { type, payload, timestamp }): adiciona à fila.
dequeue(): retorna e remove primeiro item.
processQueue(): itera e chama Server Actions correspondentes.
Types de action: ANSWER_QUESTION, REVIEW_FLASHCARD.

5. AppShell: useEffect detecta online/offline.
Banner fixo 'Você está offline — suas respostas serão salvas'
aparece quando offline.
Ao voltar online: chama processQueue(), toast 'Sincronizando...'.

6. Prompt de instalação:
Captura beforeinstallprompt em Zustand (installPromptStore).
Banner aparece na primeira visita após 60s se não instalado:
'Instale o app para estudar offline' + botão 'Instalar'."
```

### Sessão 14 — Gamificação completa
```
Prompt:

"Fase 3 Sessão 14: sistema de gamificação completo.

1. src/constants/achievements.ts — 30 achievements:
Cada um: { id, name, description, icon (emoji), xpReward,
category, condition: object }.
Exemplos:
STREAK: streak_3(3 dias/50xp), streak_7(7 dias/100xp),
  streak_30(30 dias/500xp), streak_100(100 dias/2000xp)
QUESTIONS: first_question, q_10, q_100, q_500, q_1000, all_areas
FLASHCARDS: first_review, fc_50, fc_500
SIMULADO: first_simulado, simulado_900, all_areas_simulado
SCORE: score_800, score_900
STUDY: study_1h, study_10h, study_100h
SPECIAL: night_owl(estudou após 23h), early_bird(estudou antes das 6h)

2. src/lib/gamification.ts:
awardXP(userId, amount, reason): atomic update no UserProfile.totalXP,
  recalcula nível (nível = floor(sqrt(totalXP/100)) + 1, máx 50),
  atualiza UserProfile.currentLevel se subiu,
  retorna { newXP, newLevel, leveledUp }.

updateStreak(userId): compara lastStudyDate com hoje.
  Se ontem: streak++, atualiza lastStudyDate.
  Se hoje: noop (já contou).
  Se mais de 1 dia atrás: streak = 1 (resetou).
  Atualiza longestStreak se necessário.

checkAchievements(userId, event): event = { type, value }.
  Para cada achievement não desbloqueado, avalia condition.
  Retorna achievement[] dos novos desbloqueios.
  Chama awardXP para cada um.
  Cria UserAchievement no banco.

3. Integração nas Server Actions existentes:
answerQuestion: chama awardXP + updateStreak + checkAchievements.
submitFlashcardReview: idem.
finishSimulado: idem com xp maior.
saveEssay (submit): idem.

4. AchievementUnlocked — componente toast especial:
Quando checkAchievements retorna conquistas, Server Action retorna
o array. Cliente exibe toast customizado para cada uma:
  Ícone grande (emoji), nome, descrição, '+N XP'.
  canvas-confetti dispara no aparecimento.
  Duração: 4 segundos, não bloqueante.

5. /profile/achievements:
Grid de todos os achievements.
Desbloqueados: coloridos, data de conquista, XP ganho.
Bloqueados: grayscale, mostra condição ('Estude 100 horas').
Filtro por categoria.
Progresso: X/30 conquistados."
```

---

## FASE 4 — Busca + Modo Medicina + Polish
**Estimativa:** 2 sessões

### Sessão 15 — Busca global + Modo Medicina
```
Prompt:

"Fase 4 Sessão 15: busca global e modo Medicina.

BUSCA GLOBAL:
Componente GlobalSearch: CommandDialog do shadcn/ui.
Aberto por: ícone Search no Header (mobile) + Cmd+K (desktop).
Input com debounce 300ms.
Server Action searchAll(query: string):
  Busca em paralelo com Promise.all:
  - Contents: WHERE title ILIKE %query% OR summary ILIKE %query%, limit 3
  - Questions: WHERE statement ILIKE %query%, limit 3
  - Flashcards: WHERE front ILIKE %query%, limit 3
  - Notes: WHERE title ILIKE %query% OR body ILIKE %query%, limit 3
  Retorna agrupado por tipo.
Renderiza grupos com ícone e label.
Setas do teclado navegam entre resultados, Enter navega para a página.
Esc fecha.

MODO MEDICINA:
src/constants/med-schools.ts: array das top 20 faculdades de Medicina
do Brasil com nome, cidade, UF e nota de corte 2024 (aproximada):
FMUSP ~960, UNIFESP ~950, UFRJ ~940, UFMG ~935, etc.

Toggle 'Modo Medicina' em /profile (salva no UserProfile).
Quando ativo, adiciona widget MedicinaWidget no Dashboard:
  - Universidade alvo (selecionada no onboarding) + nota de corte
  - Gap: nota atual vs meta (ex: 'Faltam 42 pontos')
  - Barra de progresso até a meta
  - Áreas prioritárias: as 2 áreas com maior gap de acerto
  - Universidades alcançáveis agora: lista das que a nota atual supera
  - Mensagem motivacional dinâmica baseada no gap"
```

### Sessão 16 — Polish final
```
Prompt:

"Fase 4 Sessão 16: polish completo e performance.

1. Skeleton loaders: auditar TODAS as páginas. Qualquer dado assíncrono
  deve ter <Suspense fallback={<ComponentSkeleton />}>. Criar skeletons
  para: DashboardSkeleton, QuestionListSkeleton, FlashcardSkeleton,
  TopicPageSkeleton, AnalyticsSkeleton.

2. Empty states: criar EmptyState component com props:
  icon, title, description, actionLabel, actionHref.
  Aplicar em: /flashcards (sem revisões), /questions (sem resultados),
  /simulados (nenhum feito), /redacao (nenhuma), /notes (nenhuma),
  /planner (sem plano).

3. Error boundaries: src/components/shared/ErrorBoundary.tsx.
  Mensagem: 'Algo deu errado', botão 'Tentar novamente'.
  Aplicar como wrapper nos widgets do dashboard e páginas principais.

4. Transições de página: no (app)/layout.tsx, usar AnimatePresence
  com key={pathname}. Animação: opacity 0→1, translateY 8px→0, 200ms.

5. Toast system: instalar e configurar sonner.
  Adicionar <Toaster /> no layout.tsx.
  Substituir todos os alerts/console.log por toast.success/toast.error
  nas Server Actions (via retorno de { success, message }).

6. Otimização: auditar todos os next/image (sizes correto),
  verificar se há 'use client' desnecessário,
  garantir que não há waterfalls de dados (usar Promise.all).

7. Metadados: generateMetadata em todas as páginas com
  title, description, openGraph básico.

8. Rodar Lighthouse no Chrome DevTools (mobile simulation).
  Resolver issues até: Performance >85, Accessibility >95,
  Best Practices >90, SEO >90."
```

---

## FASE 5 — Seed Completo da Matriz ENEM
**Estimativa:** 1 sessão

### Sessão 17 — Matriz completa
```
Prompt:

"Fase 5 Sessão 17: expande os arquivos de seed para cobrir
TODA a matriz ENEM oficial.

Expande seed-cn.ts para 60 tópicos com todos os subtópicos relevantes.
Expande seed-ch.ts para 50 tópicos.
Expande seed-lct.ts para 40 tópicos.
Expande seed-mt.ts para 35 tópicos.

Para cada tópico, importance e frequency devem ser precisos:
- importance 5: tópico eliminatório ou de altíssimo peso
- frequency 5: caiu em mais de 80% das edições do ENEM
- Baseie os valores na incidência histórica real do ENEM

Exemplos de importance=5 e frequency=5:
CN: Genética Mendeliana, Ecossistemas, Termoquímica, Cinemática
CH: Ditadura Militar, Geopolítica, Iluminismo, Brasil República
LCT: Interpretação textual, Variação linguística, Figuras de linguagem
MT: Funções do 1º e 2º grau, Geometria plana, Probabilidade

Cria também seed-redacao.ts com:
- 20 temas históricos do ENEM 2010-2024
- Para cada tema: ano, tema completo, tipo (social/científico/cultural),
  e 3 palavras-chave
- 60 conectivos organizados em 6 funções
- 10 estruturas de proposta de intervenção prontas"
```

---

## FASE 6 — Content Pipeline (Pós-Deploy, a qualquer momento)

> Rode quando quiser após o deploy. Usa Gemini free tier — custo R$ 0.
> Execute um script por vez. Sempre use flag --area primeiro para testar.

### Como rodar

```bash
# Aponta pro banco de produção (Neon.tech)
export DATABASE_URL="sua-connection-string-neon"
export GEMINI_API_KEY="sua-chave-gemini"

# Teste com uma área primeiro
npx ts-node scripts/import-questions.ts --year=2023 --dry-run
npx ts-node scripts/generate-content.ts --area=ciencias-natureza

# Depois roda tudo
npx ts-node scripts/import-questions.ts --all
npx ts-node scripts/generate-explanations.ts --all
npx ts-node scripts/generate-content.ts --all
npx ts-node scripts/generate-flashcards.ts --all
npx ts-node scripts/seed-redacao.ts
```

### Sessão A — Import de questões reais
```
Prompt:

"Fase 6 Sessão A: cria scripts/import-questions.ts.

1. Faz GET em https://api.enem.dev/v1/exams.
   Loga o formato JSON completo antes de continuar.
   Adapta o parser ao formato real encontrado.

2. Para cada prova disponível, busca as questões.

3. Mapeia para o schema Prisma:
   - statement: enunciado da questão
   - options: array de alternativas → QuestionOption[]
   - correctId: identifica a opção correta
   - areaSlug: mapeia área da prova para os slugs do sistema
   - source: 'ENEM YYYY', year: número do ano

4. Para imagens no enunciado:
   - Detecta URLs de imagem no HTML do enunciado
   - Faz download e upload para Cloudinary
     (usa cloudinary.uploader.upload com folder='enem-questions')
   - Substitui URL original pela URL do Cloudinary
   - Se CLOUDINARY_URL não configurado: mantém URL original

5. prisma.question.upsert onde unique = source + year + number.
   Idempotente: pode rodar múltiplas vezes.

6. Rate limit: processa 10 questões por vez, sem delay (sem IA aqui).

7. Log de progresso: 'ENEM 2023 Dia 1: 15/90 questões...'
   Ao final: total importado, duplicatas puladas, erros.

Flags: --year=2023 (só um ano), --all (todos), --dry-run (simula)."
```

### Sessão B — Geração de explicações
```
Prompt:

"Fase 6 Sessão B: cria scripts/generate-explanations.ts.

1. Busca Questions onde explanation = '' ou NULL, limit 200.

2. Para cada questão, chama Gemini API:
model: gemini-1.5-flash
prompt: 'Você é professor especialista em ENEM.
Questão: [statement]
Alternativas: A) [texto] B) [texto] C) [texto] D) [texto] E) [texto]
Gabarito: [letra correta]

Escreva uma explicação didática em português com:
1. Por que a alternativa [correta] está certa (2-3 frases)
2. Por que cada alternativa errada está incorreta (1 frase cada)
3. Habilidade/competência ENEM avaliada (1 frase)
Máximo 250 palavras. Sem markdown.'

3. Salva explanation no banco.

4. Rate limit Gemini free: máximo 14 requisições por minuto.
   Processa em lotes de 7, delay de 35 segundos entre lotes.
   (conservador para não bater no limite)

5. Em caso de erro 429 (rate limit): aguarda 60s e tenta novamente.
   Em caso de outro erro: loga e pula para a próxima.

6. Ao final: total processado, erros, estimativa de tokens usados.

Flags: --limit=100, --area=ciencias-natureza, --year=2023."
```

### Sessão C — Geração de conteúdo teórico
```
Prompt:

"Fase 6 Sessão C: cria scripts/generate-content.ts.

1. Busca Topics sem Content associado (ou com body vazio).

2. Para cada tópico, chama Gemini:
prompt: 'Você é professor especialista em ENEM preparando material
para candidatos a Medicina. Crie conteúdo completo para:
Tópico: [topic.name]
Disciplina: [discipline.name]
Área: [area.name]

Retorne SOMENTE JSON (sem markdown, sem explicação):
{
  summary: string (80 palavras: o que é e por que é importante no ENEM),
  body: string (HTML com h3/p/ul/strong, 600 palavras, teoria completa),
  keyConcepts: string[] (6 conceitos-chave, frases de até 8 palavras),
  tips: string[] (4 dicas de como este tema aparece no ENEM),
  formulas: string[] (fórmulas em texto simples, vazio se não houver),
  tricks: string[] (3 macetes e pegadinhas comuns na prova)
}'

3. Parseia JSON, trata erros de parse (pula o tópico e loga).
4. prisma.content.upsert pelo topicId.
5. Lotes de 3 tópicos em paralelo, delay 25s entre lotes.

Flags: --area, --discipline, --topic-id, --all."
```

### Sessão D — Geração de flashcards
```
Prompt:

"Fase 6 Sessão D: cria scripts/generate-flashcards.ts.

1. Busca Topics com Content mas com menos de 8 Flashcards.

2. Para cada tópico, chama Gemini:
prompt: 'Crie 10 flashcards de estudo para o ENEM sobre [topic.name].
Foque nos conceitos mais cobrados nas provas.
Retorne SOMENTE um JSON array:
[
  {
    front: string (pergunta clara, máx 100 chars),
    back: string (resposta completa, máx 200 chars),
    type: BASIC | CLOZE | FORMULA
  }
]
CLOZE: use {{lacuna}} na frente para indicar o que completar.
FORMULA: use notação clara (ex: E = mc²).
Varie: pelo menos 4 BASIC, 4 CLOZE, 2 FORMULA (se houver fórmulas).'

3. Cria Flashcard[] no banco com topicId.
4. Não duplica: verifica se já existem cards similares pelo front.
5. Lotes de 5 tópicos, delay 25s.

Flags: --area, --topic-id, --count=10."
```

### Sessão E — Seed de redação
```
Prompt:

"Fase 6 Sessão E: cria scripts/seed-redacao.ts.

Parte 1 — hardcoded (sem IA):
Arquivo src/constants/redacao-bank.ts com:

TEMAS_HISTORICOS: array com os 15 temas reais do ENEM 2010-2024.
  Cada um: { ano, tema, tipo: social|científico|cultural|comportamental }

CONECTIVOS: objeto com 6 chaves (funcoes):
  adicao: ['além disso', 'ademais', 'outrossim', ...] (10 cada)
  oposicao: ['entretanto', 'todavia', 'no entanto', ...]
  conclusao: ['portanto', 'logo', 'assim sendo', ...]
  exemplificacao: ['por exemplo', 'como ilustração', ...]
  causalidade: ['pois', 'porque', 'uma vez que', ...]
  temporalidade: ['inicialmente', 'posteriormente', ...]

ESTRUTURAS_PROPOSTA: 10 templates de proposta de intervenção:
  Cada um: { agente, acao, modo, finalidade, exemplo_completo }

Parte 2 — com Gemini (para temas prováveis 2025):
Gera 8 temas prováveis para o ENEM 2025 baseados em tendências atuais.
Para cada tema gera: contexto (parágrafo), 5 repertórios tipados,
3 teses possíveis.
Salva em public/data/temas-2025.json (carregado no cliente)."
```

---

## ORDEM EXATA DAS SESSÕES

```
DESENVOLVIMENTO (local):

Sessão 1:  Fase 0 — Scaffold completo + dependências + Prisma + Gemini
Sessão 2:  Fase 0 — Autenticação (NextAuth Credentials)
Sessão 3:  Fase 1 — AppShell (BottomNav + Sidebar responsivo)
Sessão 4:  Fase 1 — Onboarding 4 passos
Sessão 5:  Fase 1 — Seed inicial modular
Sessão 6:  Fase 1 — Dashboard com widgets e dados reais
Sessão 7:  Fase 1 — Navegação de conteúdo /study hierárquico
Sessão 8:  Fase 1 — Flashcards com SM-2 e swipe
Sessão 9:  Fase 1 — Banco de questões com filtros
Sessão 10: Fase 2 — Simulados com cronômetro
Sessão 11: Fase 2 — Redação + Analytics + Planejador
Sessão 12: Fase 3 — Mentor ENEM com streaming Gemini
Sessão 13: Fase 3 — PWA + Service Worker + offline
Sessão 14: Fase 3 — Gamificação (XP, streak, achievements)
Sessão 15: Fase 4 — Busca global + Modo Medicina
Sessão 16: Fase 4 — Polish + Lighthouse
Sessão 17: Fase 5 — Seed completo da matriz ENEM

──── DEPLOY NA VERCEL ────

Sessão A:  Fase 6 — import-questions.ts (questões reais, R$ 0)
Sessão B:  Fase 6 — generate-explanations.ts (Gemini, R$ 0)
Sessão C:  Fase 6 — generate-content.ts (teoria por tópico, R$ 0)
Sessão D:  Fase 6 — generate-flashcards.ts (10 cards/tópico, R$ 0)
Sessão E:  Fase 6 — seed-redacao.ts (temas, repertórios, R$ 0)
```
