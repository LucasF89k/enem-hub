# Pendências — Vion

> Regra fixa: **NÃO usar MiMo nem Gemini** para tarefas em massa (classificação/conteúdo).
> Isso é feito por **subagentes do Claude** (grátis), **aos poucos, enquanto os usuários usam o app**.
> O chat do Mentor usa **MiMo `mimo-v2.5`** (multimodal) com **Gemini de fallback**; nenhum dos dois em massa.

Atualizado em: 2026-07-29

> ✅ **Novo:** o Mentor agora **lê imagens e PDFs** (anexo no chat). E a aba **Redação** tem
> "Corrigir do papel" — manda a foto direto pro Mentor, que corrige pelas 5 competências do ENEM.
> Falta ainda **gerar** imagens (deixado para depois).

---

## 📚 Conteúdo (incremental, com o tempo — subagentes Claude)

- [ ] **Flashcards** — **8.768** cards genéricos ("Importados do Anki") ainda sem matéria/tópico.
  - Já classificados: ~9.223. Ferramenta: subagente lê o conteúdo e atribui o tópico (~900/rodada, limitado pelo limite de sessão do Claude).
- [ ] **Vídeos do YouTube** — **~84 tópicos** com menos de 6 vídeos.
  - Rodar: `npx tsx scripts/search-videos.ts --fill` (bate na cota diária do YouTube → aos poucos, retomável).
  - Estado atual: 1.076 vídeos, 123 tópicos completos.

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
