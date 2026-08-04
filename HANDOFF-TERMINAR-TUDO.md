# HANDOFF — Terminar tudo que falta (Vion / ENEM Hub)

> **Para o Claude Code que abrir este projeto em outra máquina, SEM contexto.**
> Você tem as mesmas pastas e arquivos, mas não sabe de nada. Este documento é a
> fonte da verdade. Leia **inteiro** antes de rodar qualquer coisa. Também leia
> `AGENTS.md`, `PROJECT_STATE.md` e `PENDENCIAS.md` na raiz.

O app é o **Vion** (Next.js 16 + Prisma + Neon Postgres, deploy na Vercel), um app de
estudos para o ENEM/Medicina. O conteúdo (teoria, questões, simulados, flashcards,
vídeos) vive no banco **Neon (produção)**. Os scripts abaixo escrevem **direto na
produção** — são idempotentes, mas trate cada execução como coisa real e ao vivo.

---

## 0) Setup na máquina nova (fazer uma vez)

```bash
npm install
npx prisma generate
```

Precisa de um arquivo **`.env`** na raiz (NUNCA commitar — está no .gitignore) com, no mínimo:

| Variável | Para quê |
|---|---|
| `DATABASE_URL` | Neon Postgres (produção). **Sem isso nada roda.** |
| `MIMO_API_KEY` **ou** `MIMO_API_KEYS` (vírgula) **ou** `OPENROUTER_API_KEY` | IA principal dos scripts pagos (extração/geração/classificação). MiMo `mimo-v2.5`. |
| `GEMINI_API_KEY` / `GEMINI_API_KEYS` | Alternativa em alguns scripts (classify-flashcards). Free tier costuma estar zerado — prefira MiMo. |
| `YOUTUBE_API_KEY` | Busca de vídeos (já concluído, ver §8). |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Só para as **questões de imagem** (§6). |

Todos os scripts rodam com `npx tsx scripts/NOME.ts [flags]` e carregam o `.env`
automaticamente (`import "dotenv/config"`).

### Regras inquebráveis
- **NUNCA** commitar `.env` nem segredos.
- **NUNCA** rodar `prisma migrate reset` nem `db push --force-reset` (apaga a produção). Se precisar sincronizar schema, use `npx prisma db push` (sem reset) e só se souber o que está fazendo.
- Só commitar/push quando fizer sentido; trabalhe em branch se for mexer em código.
- Todos os scripts de dados são **idempotentes/retomáveis** (dedup por hash, `upsert`, ou "pega só o que falta"). Pode re-rodar sem medo de duplicar.
- **Verifique o progresso** com os contadores do §9 antes e depois de cada bloco.

---

## 1) Resumos de teoria (o maior bloco de conteúdo)

**O que é:** cada tópico (`Topic`) tem um `Content.body` que é o resumo teórico. A meta
é um resumo **aprofundado de 10–15 min (≥1800 palavras)** em markdown, **com links
internos estilo Wikipedia** na sintaxe `[[slug-do-topico|texto]]` (vira link azul que
leva a outro tópico — já implementado em `src/lib/wiki-links.ts` + render em
`topic-tabs.tsx`).

**Estado (confira no §9):** ~60/207 tópicos já enriquecidos. Faltam ~147.

**Como rodar (idempotente — pula os que já têm ≥1700 palavras + `[[`):**
```bash
npx tsx scripts/generate-content.ts --all
# ou por disciplina:
npx tsx scripts/generate-content.ts --discipline=quimica
npx tsx scripts/generate-content.ts --discipline=fisica
# teste pequeno:
npx tsx scripts/generate-content.ts --all --limit=3
```
Usa MiMo. Já inclui os slugs dos tópicos irmãos no prompt (pros links resolverem),
regras anti-alucinação e fórmulas em texto simples (nunca LaTeX/barra invertida).

**Ordem sugerida (deixe por último os que dependem de estrutura — §7):** matemática,
ciências da natureza e humanas primeiro; Filosofia/Biologia só depois de aplicar os
PDFs (§7); Linguagens só depois da reorganização por competência (§7).

---

## 2) Reclassificação de questões (finalizar) — ~US$ 0,70

**O que é:** algumas questões estão no tópico errado. `reclassify-questions.ts` usa MiMo
para escolher o tópico correto pelo **assunto/habilidade cobrada** (não pelo tema do
texto). Só troca para slugs de tópico que já existem; se a IA responder algo fora da
lista, não altera.

```bash
npx tsx scripts/reclassify-questions.ts --dry-run --limit=40   # ver de→para, sem gravar
npx tsx scripts/reclassify-questions.ts --all                  # aplica
```

---

## 3) Gabaritos faltando (~1.662 questões) — ~US$ 0,40

**O que é:** questões sem `correctId` (sem gabarito) não viram simulado praticável.
- Para **ENEM regular** (2009–2023): o gabarito vem do `api.enem.dev` (grátis, sem IA):
  ```bash
  npx tsx scripts/import-questions.ts --all      # idempotente; traz questões + gabarito
  ```
- Para questões vindas de **PDF** (vestibulares/ENCCEJA/simulados): o gabarito é extraído
  junto na etapa de extração (§4/§5) — reprocessar o PDF preenche o `correctId`.

Depois de recuperar gabaritos, **reconstrua os simulados**:
```bash
npx tsx scripts/build-simulados.ts   # cria/atualiza 1 simulado por prova com ≥20 questões com gabarito
```

**Investigue primeiro** (query no §9) de qual fonte são as 1.662 sem gabarito para
escolher a rota certa.

---

## 4) Provas em PDF: Vestibulares de Medicina, ENCCEJA e outros vestibulares

Os PDFs de origem estão em **`fonte de conteudo/`** (já descompactados em subpastas):
`Materiais FAMEMA`, `Materiais FAMERP`, `Materiais Unifesp`, `Provas ENCCEJA`,
`Provas UNESP 2018 - 2024`, `Provas ENEM normal e ENEM PPL`, além de PDFs soltos
(UFT, Exato). Veja `fonte de conteudo/OBERSERVAÇÕES IMPORTANTES.txt`.

Dois extratores (ambos deduplicam por MD5 do enunciado → idempotentes):

**A) `extract-pdf-exams.ts` (usa MiMo — automático):**
```bash
npx tsx scripts/extract-pdf-exams.ts --dry-run              # só detecta blocos, não gasta IA
npx tsx scripts/extract-pdf-exams.ts --file="FAMEMA"        # um conjunto por substring do nome
npx tsx scripts/extract-pdf-exams.ts --all                  # tudo
```
Cobre os blocos da tabela:
- **Vestibulares Medicina** (FAMEMA / FAMERP / Unifesp / Einstein) — ~US$ 1,00–1,50
- **ENCCEJA** (69 PDFs) — ~US$ 1,00
- **Outros vestibulares** (UERJ / UNESP / UFT completar) — ~US$ 1–2

**B) `claude-extract.ts` (SEM MiMo — quem estrutura é você, o Claude):** loop resumível
com estado em `scripts/.claude-extract/`. Use se quiser economizar a API nos lotes
grandes de **Simulados (~650 PDFs, o bloco mais caro, ~US$ 12–18)**:
```bash
npx tsx scripts/claude-extract.ts --prepare      # lista provas por prioridade
npx tsx scripts/claude-extract.ts --next=40      # gera .claude-extract/todo.json (um lote de blocos)
#   -> você lê todo.json e escreve done.json com o JSON estruturado das questões
npx tsx scripts/claude-extract.ts --commit       # insere done.json no Neon e avança o cursor
npx tsx scripts/claude-extract.ts --status       # progresso
```

Depois de qualquer extração, rode `build-simulados.ts` (§3) para gerar os simulados.

---

## 5) Simulados (~650 PDFs) — ~US$ 12–18

Mesmo fluxo do §4. É o maior volume: prefira `claude-extract.ts` (sem custo de API,
você estrutura) OU `extract-pdf-exams.ts --all` (MiMo, mais caro porém automático).
Rodar em lotes; é resumível. Ao final: `npx tsx scripts/build-simulados.ts`.

---

## 6) Questões de IMAGEM do ENEM (render + visão) — ~US$ 15–25  ⚠️ precisa ser construído

**Problema:** ENEM 2009–2023 tem ~100 questões/ano baseadas em imagem (gráficos, mapas,
charges) que o import de texto **pula** — por isso vários anos têm só ~75–90 de 180.

**Abordagem (ainda NÃO existe script — criar):**
1. **Ghostscript** para rasterizar as páginas dos PDFs oficiais do INEP em imagens PNG
   (uma por questão / por região). (Ghostscript precisa estar instalado na máquina.)
2. **Cloudinary** para hospedar as imagens (vars `CLOUDINARY_*` no `.env`). O modelo
   `Question.images` (array de URLs) já existe no schema — é onde as URLs entram.
3. **Modelo de visão** (MiMo `mimo-v2.5` é multimodal, ou Gemini) para ler cada imagem e
   estruturar enunciado + alternativas + gabarito.
4. Salvar como `Question` + `QuestionOption` (dedup por hash, igual aos outros), com as
   URLs do Cloudinary em `Question.images`. Depois `build-simulados.ts`.

Guie-se pelos padrões de `extract-pdf-exams.ts` (detecção de blocos, dedup, insert) e de
`src/app/api/mentor/route.ts` (como enviar imagem multimodal ao MiMo: `image_url` com
data URL / URL). Faça um `--dry-run` que só renderiza e conta antes de gastar visão.

---

## 7) Ajustes de ESTRUTURA/TAXONOMIA (fazer ANTES do conteúdo dessas disciplinas)

Se a taxonomia estiver errada, gerar resumo (§1) para o tópico errado é desperdício.

- **Filosofia** — faltam tópicos da linha histórica. Deve cobrir: Pré-socráticos (Tales
  de Mileto; Heráclito e Parmênides), Sócrates, Sofistas (dialética), Santo Agostinho,
  São Tomás de Aquino, Descartes, Hume, Kant, Utilitarismo e Panóptico, Foucault. **Há
  PDF em `fonte de conteudo/`** (recebido) — use-o como base para ajustar os `Topic` da
  disciplina `filosofia` (renomear/adicionar/reordenar) e só então rodar §1.
- **Biologia** — revisar tópicos e relevância com base no **PDF** correspondente em
  `fonte de conteudo/`.
- **Linguagens e Códigos por COMPETÊNCIA** — ~US$ 0,50. Reorganizar as disciplinas de
  Linguagens **por habilidade/competência da matriz do ENEM**, não por conteúdo.
  Explicar como cada habilidade é cobrada dentro de cada competência (destrinchar a
  matriz). Afeta: Língua Portuguesa, Literatura, Inglês, Artes/Ed. Física, Redação.
- **Química — `qui-equilibrio` ("Equilíbrio Químico")**: um resumo antigo vazou conteúdo
  de **ondulatória (Física)**. Regerar esse tópico (§1) garantindo que fale só de
  equilíbrio (Kp/Kc, Le Chatelier).
- **Relevância (importance/frequency)** dos tópicos em geral está inconsistente — revisar.
  Existe `scripts/calibrate-relevance.ts` (analisa incidência no ENEM) como ponto de partida.

Para editar `Topic` (nome/slug/ordem/importance/frequency) escreva um script pequeno em
`scripts/` com Prisma (`db.topic.update`), ou um `.mjs` avulso. Ao mudar tópicos, rode
depois §1 (conteúdo) e considere §2 (reclassificar questões para os novos tópicos).

---

## 8) Flashcards e Vídeos — quase/totalmente prontos

- **Vídeos do YouTube:** ✅ **CONCLUÍDO** (todos os tópicos com 6 vídeos). Se quiser
  reconferir: `npx tsx scripts/search-videos.ts --fill` (retomável, respeita cota).
- **Flashcards:** **98% classificados** (faltam ~319 sem `topicId`). Finalizar:
  ```bash
  npx tsx scripts/classify-flashcards.ts --limit=400     # lê o card e atribui o Topic
  ```
  (Existe também `classify-flashcards-mimo.ts` como variante MiMo.) — bloco
  "Reclassificação (finalizar)" da tabela.

---

## 9) Como medir o progresso (contadores)

Crie um `.mjs` avulso na raiz e rode com `node --import dotenv/config arquivo.mjs`
(apague depois). Exemplos de queries úteis (Prisma):

```js
import { PrismaClient } from "@prisma/client"; import "dotenv/config"
const db = new PrismaClient()

// Resumos prontos (≥1700 palavras + link wiki)
const cont = await db.content.findMany({ select: { body: true } })
const okC = cont.filter(c => c.body.trim().split(/\s+/).length >= 1700 && c.body.includes("[[")).length
console.log("Resumos:", okC, "/", await db.topic.count())

// Questões sem gabarito
console.log("Sem gabarito:", await db.question.count({ where: { correctId: null } }))
// Total de questões e por fonte
console.log("Questões:", await db.question.count())
console.log(await db.question.groupBy({ by: ["source"], _count: true }))

// Flashcards sem tópico
console.log("Flashcards sem tópico:", await db.flashcard.count({ where: { topicId: null } }))

// Simulados existentes
console.log("Simulados:", await db.simulado.count())
await db.$disconnect()
```

---

## 10) Ordem recomendada de execução (barato → caro)

1. **§2 Reclassificar** questões (~US$0,70) e **§8 flashcards** (finalizar 319).
2. **§3 Gabaritos** (`import-questions --all` grátis) → **`build-simulados`**.
3. **§7 Estrutura** (Filosofia/Biologia via PDF, Química equilíbrio, Linguagens por
   competência) — precisa vir antes do conteúdo dessas disciplinas.
4. **§1 Resumos** (`generate-content --all`) — o grosso do conteúdo.
5. **§4 Vestibulares Medicina + ENCCEJA + outros** (US$1–4).
6. **§5 Simulados** (~US$12–18, em lotes com `claude-extract`).
7. **§6 Questões de imagem do ENEM** (US$15–25) — construir o pipeline Ghostscript+Cloudinary+visão.

**Custo total estimado do que falta: ~US$ 35 a 50** (a maior parte em §5 e §6).

Ao terminar cada bloco: rode os contadores (§9), atualize `PENDENCIAS.md`, e faça um
commit pequeno e descritivo do que mudou em `scripts/` ou `PENDENCIAS.md` (nunca do `.env`).
