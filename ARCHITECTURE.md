# ENEM Medicina Hub — Arquitetura Completa

---

## 1. Visão Geral do Sistema

```
┌─────────────────────────────────────────────────────────┐
│                    Cliente (PWA)                         │
│   Next.js App Router · TypeScript · Tailwind · shadcn   │
└────────────────────┬────────────────────────────────────┘
                     │  Server Actions + API Routes
┌────────────────────▼────────────────────────────────────┐
│                 Next.js Server (Vercel)                  │
│   Server Components · Server Actions · Route Handlers   │
│   NextAuth · Prisma ORM · Zod validation                │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  Neon PostgreSQL│   │  Gemini API     │
│  (free, 3GB)    │   │  (free tier)    │
└─────────────────┘   └─────────────────┘
          │
          ▼
┌─────────────────┐
│  Cloudinary     │
│  (imagens, free)│
└─────────────────┘
```

---

## 2. Stack de Serviços — 100% Gratuita

| Serviço | Função | Free Tier | Link |
|---------|--------|-----------|------|
| Vercel | Deploy + hosting | Ilimitado (Hobby) | vercel.com |
| Neon.tech | PostgreSQL produção | 3GB, sempre grátis | neon.tech |
| Gemini API | IA (Mentor + scripts) | 1M tokens/dia | aistudio.google.com |
| Cloudinary | Imagens das questões | 25GB, sempre grátis | cloudinary.com |
| NextAuth | Autenticação | Open source | — |

**Custo mensal: R$ 0**

---

## 3. Módulos do Sistema

### 3.1 Autenticação
- NextAuth com Credentials (email/senha) + Google OAuth opcional
- Sessão JWT
- Proteção de rotas via middleware
- UserProfile criado automaticamente no primeiro login

### 3.2 Dashboard
Widget cards com dados reais:
- Meta de nota vs nota estimada atual
- Dias restantes para o ENEM
- Tempo estudado hoje / semana / mês
- Streak de dias consecutivos
- Revisões pendentes (flashcards com nextReview <= hoje)
- Itens do plano de hoje
- Evolução por área (radar chart)
- Próxima sessão recomendada

### 3.3 Estrutura de Conteúdo (Matriz ENEM)

```
Area (5)
  └─ Discipline (13 total)
       └─ Topic (150+)
            └─ Subtopic (500+)
                 └─ Content (teoria, resumo, flashcards, questões)
```

**Áreas e Disciplinas:**
- Ciências da Natureza → Biologia, Química, Física
- Ciências Humanas → História, Geografia, Filosofia, Sociologia
- Linguagens → Português, Literatura, Inglês, Artes, Ed. Física
- Matemática → Matemática
- Redação → Redação

### 3.4 Sistema de Flashcards (SM-2)

**Algoritmo SM-2** implementado em `src/lib/sm2.ts`:

Estados de um card:
- `NEW` → ainda não revisado
- `LEARNING` → primeiras revisões (intervalos curtos)
- `REVIEW` → revisão periódica normal
- `RELEARNING` → esqueceu, voltou para aprendizado

Ratings do usuário:
- 1 = Again (não lembrou)
- 2 = Hard (lembrou com dificuldade)
- 3 = Good (lembrou bem)
- 4 = Easy (muito fácil)

Gestos mobile:
- Swipe direito → Easy (4)
- Swipe esquerdo → Again (1)
- Botões na tela → Hard (2) / Good (3)
- Tap no card → virar

### 3.5 Banco de Questões

Estrutura de uma questão:
```
Question
  ├── statement (enunciado, HTML)
  ├── images[] (URLs Cloudinary)
  ├── options[] (A, B, C, D, E)
  ├── correctId (ID da opção correta)
  ├── explanation (gerado pelo Gemini)
  ├── source ("ENEM 2023", "Custom")
  ├── year (2009-2024)
  ├── difficulty (EASY/MEDIUM/HARD/VERY_HARD)
  └── tags[]
```

### 3.6 Simulados

Tipos:
- `FULL`: 180 questões, 5h30
- `AREA`: ~45 questões de uma área, 90 min
- `DISCIPLINE`: 20-30 questões, 40 min
- `CUSTOM`: usuário define filtros

Fluxo:
```
Configurar → Iniciar → Resolver (cronômetro) → Revisar → Resultado
```

### 3.7 Redação

Editor:
- Contador de linhas (máx 30) e palavras
- Auto-save a cada 30 segundos
- Histórico de versões

Avaliação por Gemini (5 competências × 0-200):
- C1: Domínio da escrita formal
- C2: Compreensão da proposta
- C3: Seleção e organização de argumentos
- C4: Mecanismos linguísticos de argumentação
- C5: Proposta de intervenção

### 3.8 Planejador Inteligente

Input: meta de nota + data da prova + horas disponíveis por dia

Algoritmo de priorização (`src/lib/planner.ts`):
```
score = (frequência_ENEM × 0.4) + (taxa_erro_usuário × 0.4) + (importância × 0.2)
```

Intercala automaticamente revisões FSRS pendentes (30% do tempo diário).

### 3.9 Mentor ENEM (Gemini)

Modelo: `gemini-1.5-flash` (gratuito, rápido)

Modos:
- Chat livre
- Explicar questão (contexto injetado)
- Criar flashcards de um tópico
- Criar resumo
- Sugerir o que estudar hoje

System prompt base:
```
Você é o Mentor ENEM, tutor especializado em preparação para o ENEM,
com foco em aprovação em Medicina. Seja didático, direto e motivador.
Use exemplos práticos. Relacione sempre com questões do ENEM real.
Responda em português brasileiro.
```

Streaming: usar `streamGenerateContent` do SDK Gemini para resposta progressiva.

### 3.10 Analytics

Dados rastreados:
- `StudySession` → toda sessão de estudo
- `UserQuestion` → toda questão respondida
- `FlashcardReview` → toda revisão de flashcard
- `UserSimulado` → todo simulado realizado

Métricas exibidas:
- Horas estudadas (hoje/semana/mês/total)
- Taxa de acerto por área/disciplina/tópico
- Evolução de nota estimada
- Streak e nível atual
- Tópicos dominados vs críticos

### 3.11 Gamificação

XP por ação:

| Ação | XP |
|------|-----|
| Questão correta | 10 |
| Questão errada | 2 |
| Flashcard revisado | 5 |
| Sessão completada | 20 |
| Simulado completado | 100 |
| Redação enviada | 50 |
| Meta diária atingida | 30 |
| Streak 7 dias | 100 |
| Streak 30 dias | 500 |

Níveis: 1-50, fórmula: `XP_para_subir = 100 × nível²`

30 achievements em `src/constants/achievements.ts`

---

## 4. Fluxos de Navegação

### 4.1 Fluxo Principal

```
App Launch
  ├─ Não autenticado → /login → /register → /onboarding → /dashboard
  └─ Autenticado
       ├─ Sem perfil completo → /onboarding
       └─ Com perfil → /dashboard
```

### 4.2 Fluxo de Estudo

```
/study
  └─ /study/[area]
       └─ /study/[area]/[discipline]
            └─ /study/[area]/[discipline]/[topic]
                 ├─ Tab: Teoria    (content.body em HTML)
                 ├─ Tab: Resumo   (summary + keyConcepts + tips)
                 ├─ Tab: Flashcards
                 └─ Tab: Questões
```

### 4.3 Fluxo de Flashcard

```
/flashcards (fila do dia)
  └─ FlashcardReviewScreen
       ├─ Card frente → tap → vira
       ├─ Card verso → swipe/botões → rating
       ├─ Próximo card
       └─ Sessão completa → ResultScreen → /dashboard
```

### 4.4 Fluxo de Questão

```
/questions (filtros)
  └─ /questions/[id]
       ├─ Enunciado + imagens
       ├─ Opções A-E → tap → seleciona → confirma
       ├─ Feedback imediato (certo/errado)
       ├─ Explicação expansível
       └─ Próxima / Voltar
```

---

## 5. Layout Responsivo

### Mobile (< 768px)
```
┌──────────────────────┐
│ Header (48px)        │
├──────────────────────┤
│ Page Content (scroll)│
│ padding-bottom: 80px │
├──────────────────────┤
│ Bottom Nav (56px)    │ ← fixed
└──────────────────────┘
```

### Tablet (768px+)
```
┌──────────┬───────────────────┐
│ Sidebar  │ Header            │
│ (240px)  ├───────────────────┤
│          │ Page Content      │
│ Nav      │ (scroll)          │
└──────────┴───────────────────┘
```

### Desktop (1024px+)
```
┌──────────┬───────────────────────┬──────────┐
│ Sidebar  │ Page Content          │ Context  │
│ (260px)  │ (max-w-3xl, centered) │ (280px)  │
└──────────┴───────────────────────┴──────────┘
```

---

## 6. Onboarding (4 passos)

1. **Boas-vindas** — nome e motivação
2. **Meta** — nota alvo (slider 700-1000) + universidade alvo
3. **Disponibilidade** — data da prova + horas/dia + dias da semana
4. **Confirmação** — resumo + "Começar a estudar"

---

## 7. Offline First

**Funciona offline:**
- Leitura de conteúdos (Service Worker CacheFirst)
- Resolução de questões (salvas em IndexedDB, sync posterior)
- Revisão de flashcards (idem)
- Leitura de notas

**Requer conexão:**
- Mentor ENEM (Gemini API)
- Sincronização de progresso
- Avaliação de redação
- Download de novos conteúdos

**Estratégias Service Worker:**
- `CacheFirst`: `_next/static/*`, fontes
- `NetworkFirst`: páginas e dados do usuário
- `StaleWhileRevalidate`: imagens de conteúdo

---

## 8. Segurança

- Toda Server Action valida sessão com `auth()` primeiro
- Inputs validados com Zod antes do banco
- Sanitização de HTML com DOMPurify (conteúdo do usuário)
- Chave Gemini apenas no servidor (nunca no bundle cliente)
- CSRF protegido pelo Next.js em Server Actions

---

## 9. Variáveis de Ambiente

```env
# .env.example

# Banco de dados (Neon.tech)
DATABASE_URL=""

# Auth
NEXTAUTH_SECRET=""
NEXTAUTH_URL=""

# Google OAuth (opcional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""

# IA — Gemini (Google AI Studio — GRATUITO)
GEMINI_API_KEY=""

# Imagens (Cloudinary — GRATUITO até 25GB)
CLOUDINARY_URL=""
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""

# App
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

---

## 10. Seed de Dados

`prisma/seed.ts` importa:
- `seed-cn.ts` → Ciências da Natureza (Biologia, Química, Física)
- `seed-ch.ts` → Ciências Humanas (História, Geografia, Filosofia, Sociologia)
- `seed-lct.ts` → Linguagens (Português, Literatura, Inglês, Artes)
- `seed-mt.ts` → Matemática

Cada arquivo de seed tem os tópicos da sua área com `importance` e `frequency` reais.

Seed completo inclui também:
- 200 questões autorais (40 por área)
- 60 flashcards básicos
- 3 simulados pré-configurados
- 30 achievements
