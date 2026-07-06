# Prompt para próxima sessão do Claude Code

Cole este prompt inteiro no início de uma nova conversa com Claude Code:

---

```
Você está continuando o desenvolvimento do ENEM Hub — uma plataforma de estudos para o ENEM focada em candidatos a Medicina.

Leia o PROJECT_STATE.md antes de qualquer coisa. Ele documenta tudo: stack, versões, armadilhas do Prisma, todas as sessões já implementadas, e o que falta. Preste atenção especial às seções "Vídeos do YouTube", "Importação de material externo" e "Setup em máquina nova" — foram atualizadas na última sessão.

**Esta sessão provavelmente começa numa máquina/rede diferente da anterior.** A pasta `fonte de conteudo/` (material de provas/Anki/redação, ~3,7GB de PDFs/zips baixados de um Google Drive) está no `.gitignore` e NUNCA foi enviada pro GitHub — ela não existe neste checkout. O usuário já sabe disso e vai baixar o material de novo do Google Drive. Antes de tentar rodar qualquer um dos scripts de importação (`extract-pdf-exams.ts`, `import-anki-decks.ts`, `ingest-resumos.ts`), confirme com `ls "fonte de conteudo"` se a pasta já foi recolocada na raiz do projeto — se não estiver lá, peça para o usuário baixar do Drive e colocar antes de continuar.

## Contexto rápido do projeto

- Next.js 16.2.9 + React 19 + Tailwind 4 + Prisma 6 + NextAuth v5 beta
- Banco: Neon PostgreSQL (variável DATABASE_URL no .env — nunca commitar; .env NÃO existe no repo, precisa ser criado do zero em máquina nova)
- IA: Mentor + geração de conteúdo/flashcards usam **MiMo** (src/lib/mimo.ts, api.xiaomimimo.com/v1) — NUNCA Anthropic SDK. Gemini (gemini-2.5-flash, não mais 1.5-flash) ainda é usado só em essay.actions.ts (avaliação de redação) — cota free tier do Gemini é de só 20 req/dia, por isso não é usado para geração em lote.
- Deploy: Vercel (auto-deploy no push para main)
- Repo: https://github.com/LucasF89k/enem-hub.git

## Convenções críticas que você precisa respeitar

1. Middleware se chama `src/proxy.ts` (não middleware.ts)
2. `params` e `searchParams` são Promise<> no Next.js 16 — sempre await
3. `error.tsx` usa `unstable_retry`, não `reset`
4. `"use server"` só em arquivos que exportam APENAS funções async
5. Server Actions: validar sessão com auth() PRIMEIRO, depois Zod
6. Prisma: modelo é `userSimulado` (não userAttempt), campo é `streak` (não streakDays), `scoreTotal` é percentual 0–100
7. Datas: sempre `getUTCDay()` e `Date.UTC()` — nunca `getDay()` (bug de timezone Brasil)
8. Nunca commitar .env

## O que já foi implementado

- Sessões 1–18: fundação completa (auth, layout, trilhas, flashcards SM-2, questões, simulados, redação, mentor, planejador, analytics, gamificação, PWA, busca global, modo medicina, seeds de 207 tópicos)
- Bugs pós-18: foto de perfil, mentor migrado para MiMo, planner UTC, streak Duolingo-style, settings
- **Sessão 19 (Pipeline de Conteúdo)**: `scripts/generate-content.ts` — 207/207 tópicos com Content completo (via MiMo)
- **Sessão D (Pipeline de Flashcards)**: `scripts/generate-flashcards.ts` — 2.082 flashcards, todos os 207 tópicos com 8+ cards cada
- **Import de questões**: 1.135 questões reais do ENEM importadas via `scripts/import-questions.ts` (total no banco: 1.232, incluindo seeds)
- **Vídeos do YouTube**: EM ANDAMENTO — 113/207 tópicos com vídeo (292 vídeos salvos), bloqueado pela cota diária da YouTube Data API (10.000 unidades/dia, ~100 buscas/dia). Script agora suporta `--skip-existing` (evita reprocessar tópicos que já têm vídeo). Na última sessão também bateu num bloqueio de rede local (portas 5432/6543 do Neon inacessíveis nesta máquina/rede — parece firewall corporativo/governamental) — precisa de outra rede (hotspot móvel) para rodar scripts contra o Neon. Ver seção "Vídeos do YouTube" no PROJECT_STATE.md.
- **Cloudinary**: CONFIGURADO — conta criada, credenciais em `.env`, testado com `cloudinary.api.ping()` (OK). `src/lib/cloudinary.ts` criado com `uploadImage`/`deleteImage`. `updateProfileImage` (avatar) já migrado para usar Cloudinary em vez de base64 no banco. Não testado end-to-end (bloqueio de rede com o Neon nesta sessão).
- **Sessão 21 (Vitest)**: CONCLUÍDA (parcial) — `vitest.config.mts` + 34 testes passando (`sm2.ts` e `trail.ts` 100%, `achievements.ts` ~95%, `xp.ts` parcial). `npm run test` / `test:watch` / `test:coverage`. Falta a parte de Playwright (E2E).
- **Importação de material externo (`fonte de conteudo/`)**: pipeline de 4 scripts construído e validado via dry-run (`scripts/extract-pdf-exams.ts`, `scripts/import-anki-decks.ts`, `scripts/ingest-redacao.ts`, `scripts/ingest-resumos.ts` + `scripts/lib/discover-files.ts` e `scripts/lib/extract-text.ts`). `ingest-redacao.ts` já RODOU e salvou 32/32 arquivos em `public/data/redacao-extra.json`. Os outros 3 dependem do Neon e **bloquearam pela mesma rede que travou o YouTube** — ver seção "Importação de material externo" no PROJECT_STATE.md para os números reais (55.869 candidatos a questão, ~37h de MiMo) e comandos exatos para retomar.

## O que falta

### PRIORIDADE 1 — Terminar vídeos do YouTube E a importação de material externo (mesmo bloqueio de rede)
Antes de qualquer um dos dois, confirme que a rede atual alcança o Neon (teste rápido: `npx prisma db pull` ou qualquer query). Se bloqueado (porta 5432/6543), troque para hotspot móvel ou outra rede.

Vídeos do YouTube:
```powershell
npm run search-videos -- --all --skip-existing
```
Se bater em `429`/quota, pare o processo e tente de novo mais tarde (a cota reseta à meia-noite Pacific Time).

Material externo (assumindo que a pasta `fonte de conteudo/` está presente — ver aviso no topo deste arquivo):
```powershell
npx tsx scripts/extract-pdf-exams.ts --all    # ~37h — usuário pediu para rodar tudo de uma vez em background
npx tsx scripts/import-anki-decks.ts --all
npx tsx scripts/ingest-resumos.ts --all       # 123 arquivos × 15s ≈ 31min
```
`ingest-redacao.ts` já foi concluído (32/32), não precisa rodar de novo a menos que o usuário adicione mais arquivos de redação na pasta.

### PRIORIDADE 2 — Google Drive (pedido explícito do usuário)
- A pasta `fonte de conteudo/` já foi processada nesta sessão (ver acima) — se o usuário mencionar "Google Drive" de novo, provavelmente é sobre essa mesma pasta ou material adicional
- Considerar usar `uploadImage()` (`src/lib/cloudinary.ts`) para imagens de questões/conteúdo quando esse fluxo for implementado

### Sessão 20 — Notificações Push
- Gerar VAPID keys e salvar como env vars
- Criar model `PushSubscription` no schema
- Rota `POST /api/push/subscribe` para salvar subscription
- Service worker já tem handler `self.addEventListener('push', ...)` em `public/sw.js`
- Criar `src/lib/push.ts` com `sendPushNotification(userId, title, body)`
- Disparar notificação quando: streak em risco (não estudou hoje), flashcard pendente, simulado agendado

### Sessão 21b — Testes E2E (Playwright) — pendente
- Vitest (unitário) já feito. Falta Playwright para fluxos críticos: login → responder questão → ver achievement, criar simulado → finalizar → ver resultado

### Sessão 22 — Performance
- `next/dynamic` para Recharts e Framer Motion (evitar hydration de libs pesadas)
- `generateStaticParams` para os tópicos com `importance >= 4`
- `revalidate = 3600` nas páginas de conteúdo estático

## Setup em máquina nova (se necessário)

Ver seção completa "Setup em máquina nova" no PROJECT_STATE.md. Resumo:
1. Docker Desktop precisa estar aberto; recriar container `enem-db` se não existir
2. Node.js pode não estar instalado — `winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements`, depois refrescar `$env:Path` na sessão do PowerShell
3. `npm install` pode bloquear postinstall scripts — `npm approve-scripts "@prisma/client" "@prisma/engines" esbuild prisma sharp unrs-resolver`
4. `.env` não existe no repo — criar do zero com DATABASE_URL, NEXTAUTH_URL, NEXTAUTH_SECRET, GEMINI_API_KEY, MIMO_API_KEY, YOUTUBE_API_KEY

## Como rodar o projeto

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

## Para rodar scripts contra o Neon de produção

```powershell
$env:DATABASE_URL="postgresql://neondb_owner:<senha>@ep-young-pine-ai9fzrc8-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
npx tsx scripts/<nome-do-script>.ts --all
```

---

Comece confirmando que leu o PROJECT_STATE.md, depois retome os vídeos do YouTube e a importação de material externo (Prioridade 1, mesmo bloqueio de rede) antes de partir para as sessões novas.
```
