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

## Próximas Sessões (não implementadas)

### Sessão 19: Pipeline de Conteúdo
- Script para popular Content records via Gemini (teoria + resumo + conceitos-chave + dicas por tópico)
- Estimativa: ~185 tópicos × ~300ms = ~1 minuto de processamento

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
- **Banco:** Neon PostgreSQL (pooler na porta 6543)
- **Variáveis de ambiente Vercel:** `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GEMINI_API_KEY`
- **Branch principal:** `main`
- **Repositório:** `https://github.com/LucasF89k/enem-hub.git`

### Rodar localmente
```bash
npm install
cp .env.example .env  # preencher com credenciais
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

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
