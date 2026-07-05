# ENEM Hub — Estado Completo do Projeto

> Documento de handoff para Claude Code. Contém tudo que foi implementado, decisões técnicas, armadilhas encontradas e o que falta fazer.

---

## Stack e Versões (CRÍTICO — leia antes de escrever qualquer código)

| Pacote | Versão | Nota crítica |
|--------|--------|--------------|
| Next.js | **16.2.9** | App Router. `params`/`searchParams` são `Promise<…>` — sempre `await`. |
| React | **19.2.4** | Use `useTransition` para pending state de Server Actions. |
| Prisma | **6.19.3** | Nomes de campos diferem do v5 — ver seção Prisma abaixo. |
| NextAuth | **5.0.0-beta.31** | Importar `{ auth }` de `@/lib/auth`, não de `next-auth`. |
| Tailwind | **4.x** | Config via `@tailwindcss/postcss`, sem `tailwind.config.js`. |
| Zod | **4.4.3** | API mudou; `z.string().min()` OK, mas `z.object().parse()` em Server Actions. |
| Zustand | **5.0.14** | `create<Store>()(...)` — parênteses duplos. |
| Sonner | **2.0.7** | `<Toaster position="bottom-right" richColors />` no root layout. |

### Convenções Next.js 16 que DIFEREM do que você treinou
- **Middleware:** arquivo se chama `src/proxy.ts` (não `middleware.ts`)
- **`error.tsx`:** prop é `unstable_retry`, NÃO `reset`
- **`manifest.ts`:** em `app/manifest.ts` (não `public/manifest.json`)
- **`template.tsx`:** re-monta em cada navegação (diferente de `layout.tsx`)
- **`robots.ts` / `sitemap.ts`:** são route handlers nativos em `app/`
- **Server Actions:** `"use server"` só em arquivos que exportam APENAS funções async. Nunca em arquivo que exporta constantes.

### AI — NUNCA use Anthropic SDK
O projeto usa **`@google/generative-ai`** (Gemini 1.5 Flash). O arquivo é `src/lib/gemini.ts`. Nunca instale ou use `@anthropic-ai/sdk`.

---

## Banco de Dados — Neon PostgreSQL

- **Host (pooler):** `ep-young-pine-ai9fzrc8-pooler.c-4.us-east-1.aws.neon.tech`
- **Database:** `neondb`
- **Porta pooler:** 6543 | **Porta direta:** 5432
- **Usuário:** `neondb_owner`
- **`DATABASE_URL` no `.env`:** nunca commitar — está no `.gitignore`

### Para rodar migrate/seed (precisa de rede sem bloqueio de porta 5432/6543)
```bash
DATABASE_URL="postgresql://neondb_owner:<senha>@ep-young-pine-ai9fzrc8-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
DATABASE_URL="..." npx prisma db seed
```
> Se porta 5432/6543 estiver bloqueada (firewall ISP/corporativo), use hotspot móvel ou configure via Vercel Dashboard.

---

## Prisma Schema — Campos Corretos (armadilhas frequentes)

```prisma
model UserProfile {
  streak        Int    // NÃO streakDays
  trail         TrailType  // enum: EXTENSIVA | SEMI_EXTENSIVA | INTENSIVA | SPRINT
  estimatedScore Float?
  totalXP       Int
  currentLevel  Int
}

model UserSimulado {  // NÃO userAttempt
  scoreTotal    Float  // NÃO score (é percentual 0-100, não 0-1000)
  completedAt   DateTime?
}

model TopicVideo {
  @@unique([youtubeId])  // aplicado via db push (não migration)
}
```

### Modelos principais
`User`, `UserProfile`, `Account`, `Session`, `VerificationToken`, `Area`, `Discipline`, `Topic`, `Subtopic`, `Content`, `FlashcardDeck`, `Flashcard`, `FlashcardReview`, `Question`, `QuestionOption`, `UserQuestion`, `StudySession`, `UserSimulado`, `SimuladoQuestion`, `Essay`, `Note`, `NoteFolder`, `StudyPlan`, `StudyPlanItem`, `Achievement`, `UserAchievement`, `TopicVideo`, `VideoWatched`, `Favorite`, `AgentInsight`

---

## Estrutura de Arquivos

```
src/
├── app/
│   ├── (app)/               # Rotas autenticadas
│   │   ├── analytics/
│   │   ├── conquistas/      # Galeria de achievements
│   │   ├── dashboard/
│   │   ├── flashcards/
│   │   ├── mentor/          # Chat com Gemini
│   │   ├── planner/
│   │   ├── questions/[id]/
│   │   ├── redacao/         # Editor de redação
│   │   ├── simulados/[id]/[attemptId]/
│   │   ├── study/[areaSlug]/[disciplineSlug]/[topicSlug]/
│   │   ├── error.tsx        # usa unstable_retry (NÃO reset)
│   │   ├── layout.tsx
│   │   ├── loading.tsx
│   │   ├── not-found.tsx
│   │   └── template.tsx     # Framer Motion fade-in entre páginas
│   ├── (auth)/              # Login, Register
│   ├── actions/             # Server Actions
│   │   ├── auth.actions.ts
│   │   ├── essay.actions.ts
│   │   ├── flashcard.actions.ts
│   │   ├── onboarding.actions.ts
│   │   ├── planner.actions.ts
│   │   ├── question.actions.ts   # retorna newAchievements[]
│   │   ├── search.actions.ts     # searchAll() paralelo
│   │   ├── simulado.actions.ts   # retorna newAchievements[]
│   │   └── video.actions.ts
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   └── mentor/route.ts       # Gemini streaming
│   ├── manifest.ts          # Next.js 16 manifest convention
│   ├── robots.ts
│   ├── sitemap.ts           # Gera URLs de todas as áreas/disciplinas/tópicos
│   ├── global-error.tsx
│   ├── layout.tsx           # Toaster + ServiceWorkerRegistrar + OfflineBanner + InstallPrompt
│   ├── not-found.tsx
│   ├── offline/page.tsx     # Página estática para offline
│   └── page.tsx             # Redireciona: autenticado→/dashboard, senão→/login
├── components/
│   ├── achievements/AchievementToast.tsx
│   ├── analytics/           # AreaRadarChart, CalendarHeatmap, ScoreLineChart
│   ├── dashboard/           # Cards do dashboard + MedicinaWidget + TrailBadge
│   ├── layout/              # AppShell, BottomNav, Header, Sidebar
│   ├── pwa/                 # ServiceWorkerRegistrar, OfflineBanner, InstallPrompt
│   ├── search/GlobalSearch.tsx   # Cmd+K, 300ms debounce
│   ├── simulado/
│   ├── study/               # VideoCard, VideoList, VideoModal, FavoriteButton
│   └── ui/                  # shadcn/ui components
├── constants/
│   ├── medicina-cutoffs.ts  # 20 faculdades de medicina + nota de corte 2024
│   ├── med-schools.ts
│   └── redacao-bank.ts      # Conectivos e estruturas (constantes client-side)
├── hooks/
│   └── use-confetti.ts      # canvas-confetti com dynamic import
├── lib/
│   ├── achievements.ts      # ACHIEVEMENT_DEFS (25 conquistas) + checkAchievements()
│   ├── auth.ts              # NextAuth v5 config (JWT, Credentials, PrismaAdapter)
│   ├── db.ts                # Prisma singleton
│   ├── gemini.ts            # @google/generative-ai — gemini-1.5-flash
│   ├── offline-queue.ts     # IndexedDB (idb) para fila offline
│   ├── planner.ts           # Algoritmo de geração de plano de estudos por trilha
│   ├── sm2.ts               # Algoritmo SM-2 para flashcards
│   ├── trail.ts             # detectTrail() + TRAIL_CONFIGS
│   ├── utils.ts
│   ├── validations.ts
│   └── xp.ts                # awardXP(), calcLevel()
├── store/
│   ├── mentor-store.ts      # Zustand — histórico do chat com Gemini
│   └── pwa-store.ts         # Zustand — isOffline, deferredPrompt, pendingCount
├── types/next-auth.d.ts
└── proxy.ts                 # Middleware (NÃO middleware.ts) — protege rotas autenticadas
```

```
prisma/
├── schema.prisma
├── migrations/              # Histórico de migrations aplicadas
├── seed.ts                  # Orquestra todos os seeds
├── seed-cn.ts               # Ciências da Natureza: 60 tópicos (bio 22, qui 22, fis 16)
├── seed-ch.ts               # Ciências Humanas: 50 tópicos (hist 15, geo 15, fil 12, soc 8)
├── seed-lct.ts              # Linguagens: 40 tópicos (por 14, lit 12, ing 7, art 7)
├── seed-mt.ts               # Matemática: 35 tópicos (alg 13, geo 13, aplic 9)
├── seed-redacao.ts          # Redação: 20 temas históricos ENEM 2010-2024 + conectivos + proposta
├── seed-questions.ts
├── seed-flashcards.ts
├── seed-simulados.ts
└── seed-achievements.ts
public/
└── sw.js                    # Service Worker: CacheFirst/NetworkFirst/StaleWhileRevalidate
```

---

## Sessões Implementadas (18/18 completas)

### Sessão 1–3: Fundação
- Next.js 16 App Router setup, Tailwind 4, shadcn/ui
- Prisma schema completo, PrismaAdapter
- NextAuth v5 com Credentials provider (email/senha com bcrypt)
- Layout autenticado: AppShell, Sidebar, BottomNav, Header responsivo

### Sessão 4–5: Conteúdo e Estudo
- Hierarquia Área → Disciplina → Tópico → Subtópico → Conteúdo
- Páginas de estudo `/study/[area]/[discipline]/[topic]` com tabs (Teoria, Vídeos, Questões, Flashcards)
- TopicVideo com `@@unique([youtubeId])`, VideoCard com modal YouTube embed
- FavoriteButton (Server Action `toggleFavorite`)

### Sessão 6: Flashcards com SM-2
- Algoritmo SM-2 em `src/lib/sm2.ts`
- `FlashcardReview` model, `saveFlashcardReview` action
- Tela de revisão com flip animation, botões Difícil/Ok/Fácil
- Deck customizado, tipos: BASIC, CLOZE, IMAGE, FORMULA

### Sessão 7: Questões
- Banco de questões com 5 alternativas, `correctOptionId`
- `answerQuestion` Server Action — valida sessão com `auth()`, inputs com Zod
- Filtros por área/disciplina/dificuldade
- `UserQuestion` registra histórico de respostas

### Sessão 8: Simulados
- `UserSimulado` model (NÃO `userAttempt`)
- `scoreTotal` = percentual 0–100 (NÃO 0–1000)
- `finalizeSimulado` Server Action
- Página de resultado com `SimuladoScoreChart` (Recharts)

### Sessão 9: Redação
- Editor de redação com contagem de palavras e caracteres
- `saveEssay` Server Action com Zod
- Banco de apoio (drawer) com conectivos e estruturas de proposta — lidos de `constants/redacao-bank.ts`
- Avaliação por IA via Gemini (5 competências ENEM)

### Sessão 10: Mentor IA
- Chat streaming via `/api/mentor/route.ts` com Gemini 1.5 Flash
- Zustand store para histórico (`mentor-store.ts`)
- Contexto do aluno injetado no system prompt (disciplinas, nota estimada, trilha)

### Sessão 11: Planejador
- `StudyPlan` e `StudyPlanItem` models
- `generatePlan` usa `TRAIL_CONFIGS` para distribuir tempo teoria/questões/flashcards/simulados
- Calendário visual com `react-day-picker`

### Sessão 12: Analytics
- `AreaRadarChart` (Recharts radar) — acerto por área
- `CalendarHeatmap` — minutos estudados por dia
- `ScoreLineChart` — evolução da nota nos simulados

### Sessão 13: Sistema de Trilhas
- Enum `TrailType` no schema: `EXTENSIVA | SEMI_EXTENSIVA | INTENSIVA | SPRINT`
- `detectTrail(examDate)` em `lib/trail.ts` — calcula pela data da prova
- `TrailBadge` no dashboard
- Planejador adapta ratios por trilha
- Migration aplicada via `prisma db push --accept-data-loss` (sem `migrate dev` interativo)

### Sessão 14: Gamificação
- 25 achievement definitions em `src/lib/achievements.ts`
- `checkAchievements(userId)` — chama após `awardXP` em `answerQuestion` e `finalizeSimulado`
- `AchievementToast` com canvas-confetti (dynamic import)
- `/conquistas` — galeria agrupada por categoria, oculta achievements `isHidden` não ganhos
- `<Toaster>` do Sonner no root layout

### Sessão 15: PWA
- `app/manifest.ts` (Next.js 16 file convention)
- `public/sw.js`: CacheFirst (static/icons/fonts), NetworkFirst (API routes), StaleWhileRevalidate (páginas)
- IndexedDB com `idb`: `enqueueOfflineAction`, `flushOfflineQueue`, `getPendingCount`
- `pwa-store.ts` (Zustand): `isOffline`, `deferredPrompt`, `isInstalled`, `pendingOfflineCount`
- `ServiceWorkerRegistrar`, `OfflineBanner`, `InstallPrompt`, `/offline` page
- Headers no `next.config.ts`: security headers + cache headers para icons + SW header

### Sessão 16: Busca Global e Modo Medicina
- `GlobalSearch.tsx`: CommandDialog (shadcn/ui), Cmd+K/Ctrl+K, 300ms debounce, `useTransition`
- Prop `iconOnly` para mobile (ícone) vs desktop (barra completa)
- `searchAll()` Server Action: busca paralela em Content/Question/Flashcard/Note
- `MedicinaWidget`: 20 faculdades com nota de corte 2024, gap até meta, universidades alcançáveis

### Sessão 17: Polish
- `global-error.tsx`, `(app)/error.tsx` (usa `unstable_retry`), `not-found.tsx`
- `loading.tsx` com Skeleton para todas as rotas principais
- Empty state na listagem de simulados
- `toast.success/error` em planner-client e essay-editor
- `template.tsx` com Framer Motion fade `opacity 0→1, y 6→0, duration 0.18`
- `robots.ts` (desativa rotas autenticadas), `sitemap.ts` (gera árvore completa de study)
- Security headers no `next.config.ts`

### Sessão 18: Seeds Completos
- `seed-cn.ts`: 60 tópicos — Bio (22), Qui (22), Fis (16)
- `seed-ch.ts`: 50 tópicos — Hist (15), Geo (15), Fil (12), Soc (8)
- `seed-lct.ts`: 40 tópicos — Por (14), Lit (12), Ing (7), Art (7)
- `seed-mt.ts`: 35 tópicos — Álgebra (13), Geometria+Estat. (13), Mat. Aplicada (9)
- `seed-redacao.ts`: disciplina "Redação" em LCT com 20 temas históricos ENEM 2010–2024 + tópicos de conectivos (com Content record) + proposta de intervenção (com Content record)

---

## Segurança — Regras Invioláveis

1. **NUNCA commitar `.env`** — está no `.gitignore`
2. **NUNCA usar Anthropic SDK** — sempre `@google/generative-ai` (Gemini 1.5 Flash)
3. **Server Actions sempre validam** sessão com `auth()` PRIMEIRO, depois inputs com Zod
4. **SQL injection:** usar apenas Prisma ORM, nunca `db.$queryRawUnsafe` com interpolação
5. **XSS:** nunca `dangerouslySetInnerHTML` sem sanitização; markdown via `react-markdown`

---

## Padrões de Código

### Server Action padrão
```typescript
"use server"
import { auth } from "@/lib/auth"
import { z } from "zod"

const schema = z.object({ ... })

export async function myAction(data: unknown) {
  const session = await auth()
  if (!session?.user?.id) throw new Error("Unauthorized")
  const parsed = schema.parse(data)
  // ... lógica
}
```

### Seed padrão (idempotente)
```typescript
await prisma.topic.upsert({
  where: { slug: t.slug },
  update: { importance: t.importance, frequency: t.frequency },
  create: { disciplineId: discipline.id, ...t },
})
```

### `params` no App Router (Next.js 16)
```typescript
// CORRETO — params é Promise
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
}
```

---

## Sessões Implementadas após Sessão 18

### Bugs corrigidos (pós-sessão 18)
- **Foto de perfil:** `AvatarUpload.tsx` + `profile.actions.ts` — upload base64, salvo em `User.image`; layout busca imagem do DB direto (JWT não atualiza automaticamente)
- **Mentor IA:** reescrito para MiMo (OpenAI-compatible, `api.xiaomimimo.com/v1`, `mimo-v2.5`); cliente mostra erro real no chat (não mais mensagem genérica); fallback não-streaming
- **Planner dias errados:** `getUTCDay()` em vez de `getDay()` em todo o código; weekStart calculado com `Date.UTC()` para evitar bug de timezone Brasil UTC-3
- **Streak/XP:** Duolingo-style — primeiro `StudySession` do dia por tipo incrementa streak; `recordStudyActivity()` chamada em flashcards, planner e questões
- **Planner Recalibrar:** botão "Recalibrar" em `planner-client.tsx`; action `recalibratePlan()` detecta weekDays do plano atual e regenera com scoring de erros frescos
- **Settings:** página `/profile/settings` com form de configurações; `updateUserSettings()` action

### Arquivos novos criados nessas sessões
- `src/lib/mimo.ts` — cliente OpenAI apontando para api.xiaomimimo.com/v1
- `src/components/profile/AvatarUpload.tsx` — upload circular de foto de perfil
- `src/app/actions/profile.actions.ts` — `updateProfileImage(base64)`
- `src/app/(app)/profile/settings/page.tsx` — página de configurações
- `src/app/actions/settings.actions.ts` — `updateUserSettings(formData)`
- `src/app/api/profile/route.ts` — GET dados do perfil para pré-preencher settings
- `scripts/import-questions.ts` — importa ~2.700 questões reais do ENEM via api.enem.dev

### Variáveis de ambiente adicionadas
- `MIMO_API_KEY` — chave da API do MiMo (já preenchida em `.env` local; adicionar no Vercel também)
- `GEMINI_API_KEY` — usada em `essay.actions.ts` (avaliação de redação) e como fallback histórico; já preenchida em `.env` local
- `YOUTUBE_API_KEY` — usada em `scripts/search-videos.ts`; já preenchida em `.env` local

---

## Sessão 19 — Pipeline de Conteúdo (concluída)

- **Script:** `scripts/generate-content.ts` — busca Topics sem Content, gera via MiMo, `upsert` por `topicId`
- **Schema:** adicionado `@@unique([topicId])` em `Content` (aplicado via `db push --accept-data-loss`, local e Neon) para permitir o upsert
- **Decisão importante:** o ROADMAP original mandava usar `gemini-1.5-flash`, mas esse modelo está **descontinuado**. Além disso a cota free tier do Gemini (`gemini-2.5-flash`) é de só **20 requisições/dia** (não por minuto) — inviável para gerar conteúdo em lote. Por isso o pipeline de geração de conteúdo/flashcards foi migrado para **MiMo** (`src/lib/mimo.ts`), que não tem esse limite.
- `src/lib/gemini.ts` foi atualizado para `gemini-2.5-flash` mesmo assim (ainda é usado em `essay.actions.ts`), com `maxOutputTokens` do `geminiPro` subido para 8192.
- Adicionado `generateMimoJSON<T>(prompt, maxTokens)` em `src/lib/mimo.ts` — helper reutilizável para gerar JSON estruturado via MiMo (`mimo-v2.5-pro`), com limpeza de markdown fences e `JSON.parse`.
- **Resultado:** 207/207 tópicos com `Content` completo (summary, body HTML, 6 keyConcepts, 4 tips, formulas quando aplicável, 3 tricks). Falhas de truncamento de JSON (raras) resolvidas com reruns idempotentes.

## Sessão D (ROADMAP) — Pipeline de Flashcards (concluída)

- **Script:** `scripts/generate-flashcards.ts` — busca Topics com Content mas menos de 8 Flashcards, gera 10 cards via `generateMimoJSON()` (4 BASIC, 4 CLOZE, 2 FORMULA — ou mais BASIC se não houver fórmulas)
- **Dedup:** normaliza `front` (remove acentos/pontuação via `\p{M}` unicode) e compara por similaridade de tokens (Jaccard ≥ 0.6) contra cards já existentes do tópico, para não duplicar em re-execuções
- `MAX_TOKENS = 6144` (maior que os 4096 do `generate-content.ts`) porque um array de 10 objetos trunca mais fácil
- **Resultado:** 2.082 flashcards no banco (207 tópicos com 8+ cards cada). Variação de 10-11 cards por tópico é normal (LLM às vezes gera 1 a mais) — aceito pelo usuário como não-problema.

## Vídeos do YouTube (`scripts/search-videos.ts`) — EM ANDAMENTO, retomar aqui

Script já existia antes desta sessão (não foi criado agora). Busca vídeos via YouTube Data API v3 e salva em `TopicVideo` (upsert por `youtubeId`).

**Estado atual (verificado em produção/Neon):**
- `totalVideos`: 292 salvos
- `topicsWithVideo`: 113 de 207 tópicos têm pelo menos 1 vídeo
- **Faltam ~94 tópicos sem vídeo**

**Problema conhecido — cota diária do YouTube Data API:**
- Cada busca (`search.list`) custa **100 unidades**; cota gratuita é **10.000 unidades/dia** (~100 buscas/dia)
- O script `--all` **sempre reprocessa do tópico 1** (não pula quem já tem vídeo — só evita duplicar via upsert). Isso significa que cada rodada gasta cota nos primeiros ~100 tópicos antes de chegar nos que faltam
- A cota reseta à **meia-noite Pacific Time**, que cai de madrugada/manhã no horário do Brasil (verificar o horário exato conforme horário de verão dos EUA)
- Nesta sessão, foram feitas **11+ tentativas horárias automáticas** (via loop de `ScheduleWakeup` + `TaskStop` quando batia em `429`) e a cota não resetou dentro de ~11h de tentativas — mais lento que o esperado. Ficou em aberto se há algo além do reset diário padrão consumindo a cota (outro processo usando a mesma key?)

**Como retomar:**
```powershell
$env:DATABASE_URL="<neon DATABASE_URL, ver .env>"
npm run search-videos -- --all
```
Se bater em `429`/quota, parar o processo (não deixar martelar) e tentar de novo mais tarde. Considerar:
1. Esperar mais o reset natural
2. Criar uma **segunda API key** do YouTube (projeto novo no Google Cloud Console) e usá-la temporariamente
3. Modificar o script para aceitar `--skip-existing` e não reprocessar tópicos que já têm vídeo (economizaria cota nas retentativas — **melhoria pendente, não implementada**)

---

## Pendências mencionadas pelo usuário (ainda não iniciadas)

- **Cloudinary**: configurar conta (25GB grátis) para upload de imagens de questões/conteúdo — necessário antes do processamento de arquivos do Google Drive
- **Processar arquivos do Google Drive**: usuário vai enviar arquivos de Redação (INEP) e Anki para importar — aguardando ele organizar e enviar

---

## Próxima Tarefa IMEDIATA — Importar Questões ENEM (concluída nesta sessão)

O script `scripts/import-questions.ts` já rodou com sucesso contra o Neon.

**Resultado:** 1.135 questões importadas, 1.623 puladas (sem alternativas/disciplina/duplicatas), 0 erros. Total de questões no banco agora: 1.232 (inclui seeds anteriores).

Script continua idempotente — pode rodar de novo (`--all`) se quiser tentar recuperar parte das puladas ajustando o keyword-matching de disciplina/tópico:
```powershell
$env:DATABASE_URL="<copie do .env local>"
npx tsx scripts/import-questions.ts --all
```

**Como o script funciona:**
- Fonte: `https://api.enem.dev/v1/exams/{year}/questions/{index}` (endpoint individual — o de lista não retorna alternativas)
- Busca cada questão individualmente com 150ms de delay entre requisições (~7 min total)
- Idempotente: pula questões já importadas (`source + year + number` únicos)
- Mapeia disciplina → areaSlug, usa keyword matching para topicId
- Anos: 2009–2023, ~183 questões/ano = ~2.745 questões

---

## Próximas Sessões (pendentes)

### ~~Sessão 19: Pipeline de Conteúdo~~ ✅ CONCLUÍDA (ver seção acima)

### ~~Sessão D (ROADMAP): Pipeline de Flashcards~~ ✅ CONCLUÍDA (ver seção acima)

### EM ANDAMENTO: Completar vídeos do YouTube
Ver seção "Vídeos do YouTube" acima — 113/207 tópicos com vídeo, bloqueado por cota diária da YouTube Data API. **Retomar isso primeiro** na próxima sessão.

### Pendente (mencionado pelo usuário, ainda não iniciado): Cloudinary + Google Drive
- Configurar conta Cloudinary (25GB grátis) — necessário para upload de imagens (questões com gráficos, resumos com imagens)
- Processar arquivos que o usuário vai enviar do Google Drive (Redação INEP + Anki)

### Sessão 20: Notificações Push
- Web Push API com VAPID keys
- `PushSubscription` model no schema
- Service Worker já tem handler de push (`self.addEventListener('push', ...)` em `public/sw.js`)
- `sendPushNotification` utility

### Sessão 21: Testes
- Vitest para lib/sm2.ts, lib/trail.ts, lib/achievements.ts
- Playwright para fluxos críticos: login → questão → achievement

### Sessão 22: Performance
- `next/dynamic` para componentes pesados (Recharts, Framer Motion)
- `generateStaticParams` para rotas de estudo com tópicos frequentes
- ISR com `revalidate` nas páginas de conteúdo

---

## Deploy

- **Plataforma:** Vercel (auto-deploy em push para `main`)
- **Banco:** Neon PostgreSQL (pooler)
- **Variáveis de ambiente Vercel:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`, `MIMO_API_KEY`, `YOUTUBE_API_KEY`
- **Branch principal:** `main`
- **Repositório:** `https://github.com/LucasF89k/enem-hub.git`

### Rodar localmente
```bash
npm install
# NÃO existe .env.example no repo — crie .env manualmente com:
# DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GEMINI_API_KEY, MIMO_API_KEY, YOUTUBE_API_KEY
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

### Setup em máquina nova (checklist, aprendido nesta sessão)
1. **Docker Desktop** precisa estar aberto antes de `docker run`/`docker ps`
2. Recriar container local: `docker run --name enem-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=enem_hub -p 5432:5432 -d postgres:16`
3. **Node.js pode não estar instalado** (ou pode "sumir" entre sessões/reinícios do ambiente) — instalar via `winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements`. Depois de instalar, a sessão atual do PowerShell não pega o PATH novo automaticamente — rodar: `$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")` antes de usar `node`/`npm`/`npx`
4. `npm install` pode bloquear scripts de postinstall (Prisma, esbuild, sharp) por segurança — rodar `npm approve-scripts "@prisma/client" "@prisma/engines" esbuild prisma sharp unrs-resolver`
5. `.env` **não existe no repo** (nem `.env.example`) — precisa ser criado do zero. `NEXTAUTH_SECRET` pode ser gerado com `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"`

---

## Problemas Conhecidos e Soluções

| Problema | Causa | Solução |
|----------|-------|---------|
| `"use server"` em arquivo com constante | Next.js 16 exige que arquivos `"use server"` exportem apenas funções async | Remover `"use server"` do arquivo; mover actions para arquivo separado |
| `streakDays` não existe | Campo se chama `streak` no schema | Usar `profile.streak` |
| `userAttempt` não existe | Model se chama `userSimulado` | Usar `db.userSimulado` |
| `scoreTotal` vs `score` | Campo correto é `scoreTotal` (percentual 0–100) | Para ENEM scale: `scoreTotal * 10` |
| `prisma migrate dev` trava | Requer terminal interativo | Usar `prisma db push` em dev, `migrate deploy` em produção |
| Porta 5432/6543 bloqueada | Firewall de ISP/rede corporativa | Usar hotspot móvel ou configurar via Vercel Dashboard |
| `handlers[item.type]` TypeScript error | `item.type` é `any` | Cast: `handlers[item.type as keyof typeof handlers]` |
| `gemini-1.5-flash` retorna 404 | Modelo descontinuado pelo Google | Usar `gemini-2.5-flash` (ver `src/lib/gemini.ts`) |
| Gemini free tier trava com `429` rápido | Cota é 20 requisições/DIA por modelo (não por minuto) — inviável para geração em lote | Usar MiMo (`generateMimoJSON()`) para geração de conteúdo/flashcards em massa |
| `Content.topicId` não aceita `upsert({ where: { topicId } })` | Não havia `@unique` no campo | Adicionado `@@unique([topicId])` no schema — aplicar com `prisma db push --accept-data-loss` (local E produção) |
| `search-videos.ts --all` sempre recomeça do tópico 1 | Script não filtra por "já tem vídeo", só evita duplicar vídeo individual via upsert | Gasta cota nos primeiros ~100 tópicos toda vez — considerar adicionar flag `--skip-existing` (não implementado) |
| YouTube Data API 429 | Cota de 10.000 unidades/dia, ~100 por busca (~100 buscas/dia) | Esperar reset (meia-noite Pacific Time) ou usar uma segunda API key |
| Node.js "sumiu" do PATH/máquina | Ambiente Windows pode reiniciar/resetar entre sessões longas | Reinstalar via winget e refrescar `$env:Path` (ver checklist "Setup em máquina nova") |
