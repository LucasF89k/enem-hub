# Pendências — Vion

> Regra fixa: **NÃO usar MiMo nem Gemini** para tarefas em massa (classificação/conteúdo).
> Isso é feito por **subagentes do Claude** (grátis), **aos poucos, enquanto os usuários usam o app**.
> Gemini fica reservado **só para o chat do Mentor**.

Atualizado em: 2026-07-29

---

## 📚 Conteúdo (incremental, com o tempo — subagentes Claude)

- [ ] **Flashcards** — **8.768** cards genéricos ("Importados do Anki") ainda sem matéria/tópico.
  - Já classificados: ~9.223. Ferramenta: subagente lê o conteúdo e atribui o tópico (~900/rodada, limitado pelo limite de sessão do Claude).
- [ ] **Vídeos do YouTube** — **~84 tópicos** com menos de 6 vídeos.
  - Rodar: `npx tsx scripts/search-videos.ts --fill` (bate na cota diária do YouTube → aos poucos, retomável).
  - Estado atual: 1.076 vídeos, 123 tópicos completos.

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
- Migrar o Mentor para o MiMo **se um dia** houver créditos (hoje: Gemini 2.0-flash).

---

## ✅ Já concluído (referência)

Bug Mentor (Gemini 2.0-flash), Bug Simulado (todas as questões com área; ENEM 2 dias, vestibular único),
Esqueci-a-senha (Resend), Grupos de ranking, reset de contas + logout de sessões órfãs,
upload de foto sem Cloudinary, onboarding com curso+universidade+sugestão de corte,
mesma sugestão nas Configurações, barra de navegação compacta, XP visível, redação (correção + cronômetro + temas 1998-2024), etc.
