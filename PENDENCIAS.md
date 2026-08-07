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

- [x] ~~**Filosofia**~~ — REESTRUTURADO (03/08, guia recebido): +9 tópicos (Pré-socráticos, Sócrates/Sofistas, Medieval, Moderna, Contratualistas, Kant, Foucault, Utilitarismo, Estética) + relevância pela ordem do guia. Falta gerar o conteúdo (próximo run — já liberado no gerador).
- [x] ~~**Biologia**~~ — OK: a estrutura atual já cobre o guia (10 áreas), Ciclos Biogeoquímicos adicionado. Liberado no gerador. Falta gerar o conteúdo.
- [ ] **Relevância global (Enem's Anatomy 2026.pdf, 70MB)** — usar essa análise pra ajustar importance/frequency de TODOS os tópicos (não só chute). Pendente — PDF grande, ler em partes.
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

- [ ] **Flashcards — imagens perdidas na importação (07/08):** **4.082 cards** tinham imagem e a importação trocou por o texto `[imagem]` (perdeu o nome do arquivo). As imagens **existem** nos `.apkg` de `fonte de conteudo/ANKI - FLASHCARDS/` (zip com SQLite + mídia). **Conserto GRÁTIS (sem IA):** re-parsear os `.apkg`, casar cards por texto, subir as imagens no Cloudinary e trocar o `[imagem]` pela URL. (Adaptar `import-anki-decks.ts`.)
- [ ] **Classificar ~1.616 questões sem tópico** — a maioria são as novas questões de imagem do ENEM (têm área, falta o tópico específico). Rodar `scripts/reclassify-questions.ts --missing` (MiMo, barato).
- [x] ~~**Flashcards classificação**~~ — 98% (faltam ~319 sem tópico + os 4.082 acima que são de imagem).
- [x] ~~**Vídeos do YouTube**~~ — ✅ CONCLUÍDO (30/07): todos os tópicos com 6 vídeos. Última rodada `--fill` salvou 495 vídeos, 83/83 tópicos completados, 0 sem resultado.
- [x] ~~**Vídeos do YouTube**~~ — ✅ CONCLUÍDO (30/07): todos os tópicos com 6 vídeos. Última rodada `--fill` salvou 495 vídeos, 83/83 tópicos completados, 0 sem resultado.

## 🎯 Gabaritos faltando (~1.671 questões sem `correctId`)

> Os do **ENEM regular** já foram preenchidos. Os que restam são de **vestibulares / PPL / simulados** (não-ENEM).
- [ ] Backfill de gabarito. Principais: ENEM PPL 2020 (181), UERJ 2024 (155), UFT (~500), UNESP 2022 (74), Exato 25/26 (~200), ENEM PPL 2023 (44), UniCEUB Med 2021 (40).
  - Maioria tem PDF de gabarito na pasta → **pdftotext + casar nº da questão → letra → `correctId`** (grátis, sem IA). Os bagunçados: MiMo (barato).

## ✅ ENEM regular 2009–2023 — COMPLETO (07/08)

- [x] ~~**Questões de imagem do ENEM**~~ — **FEITO.** As **15 provas (2009–2023)** agora têm ~180 questões cada (antes ~74–89). Pipeline: `enem-render-upload.ts` (Ghostscript → Cloudinary + gabarito do api.enem.dev no manifesto) → subagente Sonnet extrai (ou MiMo p/ 2009) → `enem-images-import.ts`. Simulados reconstruídos (`build-simulados.ts`).
- [ ] **Gabaritos faltando em algumas questões de imagem** (usuário vai pegar os oficiais do INEP depois):
  - **ENEM 2009:** 5 questões sem gabarito — **101, 140, 157, 166, 180** (o MiMo não leu essas letras na folha amarela). → 175/180 no simulado.
  - **ENEM 2015:** questão **145** e **ENEM 2020:** **144, 168, 179** — provavelmente **ANULADAS** (não aparecem no gabarito oficial). Confirmar; se anuladas, `correctId` null está correto. → 179/180 e 177/180.
  - Fonte: baixar o **gabarito oficial do INEP** (Caderno Amarelo) desses anos e casar número → letra.
- [ ] **ENEM 2013 (86–90):** recuperadas do caderno amarelo (baixado em `Novas fontes/`), gabarito lido da própria prova. OK (180/180).

## 🎓 ENCCEJA (via subagentes Claude — sem MiMo)

- [ ] Importar as provas do **ENCCEJA** (não está no api.enem.dev → extração de PDF via subagente, aos poucos).

## 📝 Provas ENEM PPL — INCOMPLETAS (só questões de texto)

> Os PPL aparecem com poucas questões (ex.: PPL 2025 = 45, PPL 2024 = 85) porque **só as de texto foram importadas**; as de **imagem NÃO foram feitas**. O pipeline de imagem (Ghostscript+Cloudinary+extração) foi rodado só no **ENEM regular 2009–2023**, ainda **não** no PPL.
- [ ] **Completar o PPL com o mesmo pipeline** — rodar `enem-render-upload.ts` + extração nos PDFs de `fonte de conteudo/.../02 - ENEM PPLs (2009-2025)` (gabarito: ler do PDF ou api). Cada ano ~180.
- [ ] **Anos incompletos:** PPL **2018, 2024, 2025** (import parcial).
- [ ] **Gabaritos faltando:** PPL **2020, 2023**.
- [ ] **PDFs cifrados** (texto embaralhado, não extraiu): PPL **2014, 2015, 2016, 2017, 2021**.
- [ ] **503 arquivos de simulado privados** — extrair questões + gabaritos embutidos.
  - Fazer **com o tempo, via subagentes do Claude** (grátis) — **NÃO** com MiMo. Usar o fluxo do `scripts/claude-extract.ts` (subagente lê o PDF, estrutura as questões e o gabarito, grava no banco).

## 🔑 Ações suas (infra — não é código)

- [x] ~~Resend — rotacionar a chave~~ ✅ feito pelo usuário (30/07).
- [x] ~~Resend — verificar um domínio~~ ✅ feito pelo usuário (30/07).
- [x] ~~AUTH_SECRET no Vercel~~ ✅ feito pelo usuário (30/07).

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
