# Pendências — Vion

> **Atualização 30/07:** o usuário liberou **MiMo pago** ($2 de crédito) para geração de conteúdo
> e classificação em massa (é barato: ~US$ 0,20-1,00 o lote todo). Antes era só subagente Claude.
> O chat do Mentor também usa **MiMo `mimo-v2.5`** (multimodal) com **Gemini de fallback**.

Atualizado em: 2026-07-30

> ✅ **Novo:** o Mentor agora **lê imagens e PDFs** (anexo no chat). E a aba **Redação** tem
> "Corrigir do papel" — manda a foto direto pro Mentor, que corrige pelas 5 competências do ENEM.
> Falta ainda **gerar** imagens (deixado para depois).

---

## 🧭 Estrutura / organização de tópicos (reportado 29/07 — fazer DEPOIS de terminar a geração de conteúdo)

> Ajustar a TAXONOMIA antes de (re)gerar o conteúdo dessas disciplinas, senão gera resumo pra tópico errado.

- [ ] **Filosofia** — tópicos atuais não cobrem a linha histórica esperada. Deve ter: Pré-socráticos (Tales de Mileto; Heráclito e Parmênides), Sócrates, Sofistas (dialética), Santo Agostinho, São Tomás de Aquino, René Descartes, David Hume, Kant, Utilitarismo e Panóptico, Foucault. **Usuário vai enviar PDF.**
- [ ] **Biologia** — revisar tópicos/relevância. **Usuário vai enviar PDF.**
- [ ] **Linguagens e Códigos** — reorganizar **por HABILIDADE e COMPETÊNCIA da matriz do ENEM**, não por conteúdo. Explicar como cada habilidade é cobrada dentro de cada competência (destrinchar a matriz), em vez de só listar conteúdo. Ex.: há competência ligada a Literatura → precisa existir, mas organizada por competência. Afeta: Língua Portuguesa, Literatura, Inglês, Artes/Ed. Física.
- [ ] **Química — "Equilíbrio Químico" (qui-equilibrio)**: revisar; apareceu conteúdo de **ondulatória (Física)** aí. Estrutura está OK (Ondulatória está em Física); o problema é o BODY gerado — regerar/limpar.
- [ ] **Relevância (importance/frequency)** dos conteúdos em geral está "zoada" — revisar os valores por tópico.
- [x] ~~**Biologia — tópico "Ciclos Biogeoquímicos"**~~ — tópico CRIADO (bio-ciclos-biogeoquimicos). Falta só gerar o conteúdo (próximo run MiMo).
- [x] ~~**Química — tópico "Separação de Misturas"**~~ — tópico CRIADO (qui-separacao-misturas). Falta só gerar o conteúdo (próximo run MiMo).
- [x] ~~**Flashcards do Mentor por tópico**~~ — FEITO: os cards do Mentor agora são vinculados ao tópico atual e ficam no deck "Flashcards do Mentor" (separado do "Meus flashcards").
- [ ] **Questões mal classificadas (Linguagens em Biologia)** — ex.: questão de "variedade linguística" (fonte revistaecologico) está no tópico **Ecologia e Relações Ecológicas** (Biologia). É questão de **Linguagens/Língua Portuguesa**. Reclassificar as questões de Linguagens que caíram em áreas erradas (mesma família do backfill de área/tópico das questões — fazer via subagentes quando o limite semanal permitir).
- [ ] **QA anti-alucinação** — após o run atual do MiMo, varrer o conteúdo em busca de nomes/citações/sites inventados (ex.: "Pereira Junior" apareceu em Trovadorismo/Literatura) e regerar os afetados com o prompt novo (regras anti-invenção já adicionadas).

## 📚 Conteúdo (incremental, com o tempo — subagentes Claude)

- [ ] **Resumos aprofundados (Teoria)** — 10-15 min, markdown, com links `[[slug|texto]]` (azuis).
  - ✅ Recurso pronto ([src/lib/wiki-links.ts](src/lib/wiki-links.ts)); geração via **MiMo** (`scripts/generate-content.ts`).
  - **Progresso (30/07): 135/209 tópicos prontos.** Faltam **74**: ~29 falharam por fórmula com `\` (prompt já corrigido → re-rodar `--all`), + Filosofia (12) e Biologia (em espera de PDF), + os 2 novos tópicos.
- [ ] **Reclassificação de questões (via MiMo)** — EM ANDAMENTO (`scripts/reclassify-questions.ts`), rodando nas 6.433 questões pra corrigir área/tópico (dry-run validou ~37% de correções reais).

- [ ] **Flashcards** — **8.768** cards genéricos ("Importados do Anki") ainda sem matéria/tópico.
  - Já classificados: ~9.223. Ferramenta: subagente lê o conteúdo e atribui o tópico (~900/rodada, limitado pelo limite de sessão do Claude).
- [x] ~~**Vídeos do YouTube**~~ — ✅ CONCLUÍDO (30/07): todos os tópicos com 6 vídeos. Última rodada `--fill` salvou 495 vídeos, 83/83 tópicos completados, 0 sem resultado.

## 📝 ENEM regular incompleto (api.enem.dev — GRÁTIS, sem IA)

- [ ] **ENEM 2009–2023** só tem ~74–89 de 180 questões cada. A API `api.enem.dev` lista ~183–185/ano, MAS as ~100 que faltam são **baseadas em imagem** (sem texto/alternativas estruturados) → o import pula.
  - O re-import só recupera as poucas com texto. Rodar `npx tsx scripts/import-questions.ts --all` (idempotente) recupera essas + gabarito; depois `build-simulados.ts`.
  - **As questões de imagem ficam para a SESSÃO/FASE F**, usando **Ghostscript** (renderizar/extrair as imagens dos PDFs oficiais do INEP) + **Cloudinary** (hospedar as imagens). É assim que se chega aos 180 reais por prova.

## 🎓 ENCCEJA (via subagentes Claude — sem MiMo)

- [ ] Importar as provas do **ENCCEJA** (não está no api.enem.dev → extração de PDF via subagente, aos poucos).

## 📝 Provas ENEM PPL (extração de PDF — "faça depois" antigo)

- [ ] **Anos incompletos:** PPL **2018, 2024, 2025** (import parcial).
- [ ] **Gabaritos faltando:** PPL **2020, 2023**.
- [ ] **PDFs cifrados** (texto embaralhado, não extraiu): PPL **2014, 2015, 2016, 2017, 2021**.
- [ ] **503 arquivos de simulado privados** — extrair questões + gabaritos embutidos.
  - Fazer **com o tempo, via subagentes do Claude** (grátis) — **NÃO** com MiMo. Usar o fluxo do `scripts/claude-extract.ts` (subagente lê o PDF, estrutura as questões e o gabarito, grava no banco).

## 🔑 Ações suas (infra — não é código)

- [ ] **Resend — rotacionar a chave** (a atual apareceu no chat).
- [ ] **Resend — verificar um domínio** (sem isso, e-mails de "esqueci a senha" só chegam ao e-mail da conta Resend).
- [ ] **AUTH_SECRET no Vercel** (opcional, reforço) — colocar o novo segredo nas env vars e redeploy. Já atualizei o `.env` local.

## 💡 Opcionais / ideias

- Ranking estilo Duolingo com **ligas** (hoje é ranking global + grupos entre amigos).
- ✅ **Mentor migrado para o MiMo** (`mimo-v2.5`, multimodal — lê imagem) com rotação de chaves e **Gemini como fallback** (o Gemini ainda é quem lê PDF).
- **Gerar imagens** no Mentor (hoje ele só **lê**; gerar exigiria outro modelo/pago) — deixado para depois.

---

## ✅ Já concluído (referência)

Bug Mentor (Gemini 2.0-flash), Bug Simulado (todas as questões com área; ENEM 2 dias, vestibular único),
Esqueci-a-senha (Resend), Grupos de ranking, reset de contas + logout de sessões órfãs,
upload de foto sem Cloudinary, onboarding com curso+universidade+sugestão de corte,
mesma sugestão nas Configurações, barra de navegação compacta, XP visível, redação (correção + cronômetro + temas 1998-2024),
Mentor multimodal (lê imagens/PDFs), "Corrigir do papel" (foto da redação → Mentor corrige pelas 5 competências), etc.
