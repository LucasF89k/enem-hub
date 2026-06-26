# Prompt para próxima sessão do Claude Code

Cole este prompt inteiro no início de uma nova conversa com Claude Code:

---

```
Você está continuando o desenvolvimento do ENEM Hub — uma plataforma de estudos para o ENEM focada em candidatos a Medicina.

Leia o PROJECT_STATE.md antes de qualquer coisa. Ele documenta tudo: stack, versões, armadilhas do Prisma, os 18 sessões já implementadas, e o que falta.

## Contexto rápido do projeto

- Next.js 16.2.9 + React 19 + Tailwind 4 + Prisma 6 + NextAuth v5 beta
- Banco: Neon PostgreSQL (variável DATABASE_URL no .env — nunca commitar)
- IA: @google/generative-ai gemini-1.5-flash (NUNCA Anthropic SDK)
- Deploy: Vercel (auto-deploy no push para main)
- Repo: https://github.com/LucasF89k/enem-hub.git

## Convenções críticas que você precisa respeitar

1. Middleware se chama `src/proxy.ts` (não middleware.ts)
2. `params` e `searchParams` são Promise<> no Next.js 16 — sempre await
3. `error.tsx` usa `unstable_retry`, não `reset`
4. `"use server"` só em arquivos que exportam APENAS funções async
5. Server Actions: validar sessão com auth() PRIMEIRO, depois Zod
6. Prisma: modelo é `userSimulado` (não userAttempt), campo é `streak` (não streakDays), `scoreTotal` é percentual 0–100
7. Nunca commitar .env

## O que já foi implementado (sessões 1–18)

- Autenticação completa (NextAuth v5 + Credentials + JWT)
- Hierarquia de conteúdo: Área → Disciplina → Tópico → Conteúdo
- Flashcards com algoritmo SM-2
- Banco de questões com histórico de respostas
- Simulados com scoreTotal e página de resultado
- Editor de redação com avaliação por Gemini
- Mentor IA (chat streaming com Gemini)
- Planejador de estudos adaptado por trilha (Extensiva/Semi/Intensiva/Sprint)
- Analytics (radar de áreas, heatmap, linha de evolução)
- Sistema de trilhas detectado pela data da prova
- Gamificação: 25 achievements, XP, confetti, galeria /conquistas
- PWA: Service Worker, IndexedDB offline queue, install prompt
- Busca global Cmd+K com CommandDialog e debounce 300ms
- Widget Medicina com nota de corte das 20 melhores faculdades
- Polish: skeletons, empty states, error boundaries, transições Framer Motion
- Seeds: 185 tópicos cobrindo toda a matriz ENEM + 20 temas de redação históricos

## O que falta (sessões 19–22)

### Sessão 19 — Pipeline de Conteúdo (PRIORIDADE ALTA)
Criar script `scripts/generate-content.ts` que:
- Lê todos os tópicos do banco sem Content associado
- Para cada tópico, chama Gemini com prompt estruturado pedindo:
  - `summary`: resumo de 3–5 linhas
  - `body`: conteúdo completo em Markdown (teoria, exemplos, tabelas)
  - `keyConcepts`: array de 5–8 conceitos-chave
  - `tips`: array de 3–5 dicas de prova ENEM
  - `formulas`: array de fórmulas (vazio se não for exatas)
  - `tricks`: array de macetes e pegadinhas
- Salva no banco como `Content` com `upsert` (idempotente)
- Processa em lotes de 5 com `p-limit` para não estourar rate limit
- Log de progresso: "X/185 tópicos processados"
- Usar `src/lib/gemini.ts` existente

O model `Content` no schema tem: `title`, `slug`, `summary`, `body`, `keyConcepts String[]`, `tips String[]`, `formulas String[]`, `tricks String[]`, `importance`, `frequency`, `topicId`

### Sessão 20 — Notificações Push
- Gerar VAPID keys e salvar como env vars
- Criar model `PushSubscription` no schema
- Rota `POST /api/push/subscribe` para salvar subscription
- Service worker já tem handler `self.addEventListener('push', ...)` em `public/sw.js`
- Criar `src/lib/push.ts` com `sendPushNotification(userId, title, body)`
- Disparar notificação quando: streak em risco (não estudou hoje), flashcard pendente, simulado agendado

### Sessão 21 — Testes
- Vitest para: `lib/sm2.ts`, `lib/trail.ts`, `lib/achievements.ts`, `lib/xp.ts`
- Playwright para fluxos críticos: login → responder questão → ver achievement, criar simulado → finalizar → ver resultado

### Sessão 22 — Performance
- `next/dynamic` para Recharts e Framer Motion (evitar hydration de libs pesadas)
- `generateStaticParams` para os tópicos com `importance >= 4`
- `revalidate = 3600` nas páginas de conteúdo estático

## Como rodar o projeto

```bash
npm install
# .env já deve ter DATABASE_URL, NEXTAUTH_SECRET, NEXTAUTH_URL, GEMINI_API_KEY
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev
```

## Para migrate/seed no Neon

Se a porta 5432/6543 estiver bloqueada (firewall), use hotspot do celular:
```bash
DATABASE_URL="postgresql://neondb_owner:<senha>@ep-young-pine-ai9fzrc8-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require" npx prisma migrate deploy
```

---

Comece pela Sessão 19 (pipeline de conteúdo). Leia o PROJECT_STATE.md para ver os padrões de código e os campos corretos do Prisma antes de escrever qualquer arquivo.
```
