# Handoff: onde paramos

Escrito em 22/09/2026, na máquina de casa/trabalho onde o banco Neon **não é
alcançável** (porta 5432 bloqueada). Isso limitou algumas etapas, e é o motivo
de várias pendências abaixo.

Branch: `main`. Último commit: `bafdeb9`. Working tree limpo, tudo enviado
para o GitHub.

---

## 1. O que foi feito nesta sessão

### 1.1 Animação da pedra (resolvido)

A gema do gauge da Home ficava parada. Depois de várias tentativas erradas,
a causa foi isolada medindo o `transform` real no DOM, com quatro casos lado
a lado:

| montagem | deslocamento |
| --- | --- |
| sem wrapper nenhum | 23.9px |
| só `motion.main` | 23.9px |
| `AnimatePresence` + `motion.main` | **0px** |
| `AnimatePresence` + `<main>` comum | **0px** |

O culpado é o `AnimatePresence mode="wait" initial={false}` do `AppShell`
(transição entre rotas). Todo `motion` descendente herda o contexto de
presença e, com `initial={false}`, o Framer trata a subárvore como "já estava
aqui" e pula a animação de entrada dos filhos. Como o flutuar dispara na
montagem, ele nunca arrancava.

Correção (`9d10166`): zerar o `PresenceContext` em volta do `OpalCrystal`.

Duas hipóteses foram testadas e **descartadas** antes disso, vale registrar
pra ninguém refazer o caminho:
- `prefers-reduced-motion`: emulei a media query, animava nos dois estados.
- Cache / service worker: não pegava nem no PC.

Depois disso a cadência foi ajustada (`2fa0e55`): voltou pro vaivém simples
de 3 keyframes e o ciclo foi de 5s pra 14s. O que fazia parecer apressado não
era a duração, eram as 4 inversões de sentido da curva de 5 keyframes.

### 1.2 Imagem da pedra

Várias trocas até chegar na atual. O aprendizado que importa está em
**5.2**: o pipeline de corte muda conforme a imagem, não existe receita fixa.

### 1.3 Performance (parcial)

Três commits, todos revertíveis isoladamente:

**`b0ffe3f`**: `sql.js`, `pdf-parse`, `mammoth`, `adm-zip`, `fzstd` moveram
pra `devDependencies` (só rodam nos scripts de importação, mas iam pra
produção). `p-limit` removida, não era usada em lugar nenhum.

**`b28c500`**: as telas de estudo eram as mais lentas por três motivos
somados:
1. O catálogo (áreas → disciplinas → tópicos) era relido do banco a cada
   visita, com `include` aninhado, só pra **contar** tópicos. É o mesmo dado
   pra todo usuário. Virou `src/lib/catalogo.ts`, com cache e tag própria.
2. O progresso usava `WHERE userId = ? AND topicId IN (...)` com centenas de
   ids dentro da query. Virou `src/lib/progresso.ts`, lendo só por `userId`.
3. As duas leituras eram sequenciais. Agora vão em `Promise.all`.

Também paralelizou o planner e a tela de fazer simulado.

**`bafdeb9`**: índice `StudySession(userId, topicId)` + migration. A tabela
só tinha índice em `userId` e `(userId, date)`, então toda pergunta do tipo
"quais tópicos esse aluno já estudou?" varria o histórico inteiro dele.

> **Atenção no próximo deploy:** tem migration nova
> (`prisma/migrations/20260922140000_studysession_topic_index/`). O `build`
> já roda `prisma migrate deploy`, então deve aplicar sozinha, mas vale
> confirmar que passou.

---

## 2. Pendência principal: ligar o adapter Neon

**Esta é a maior otimização que sobrou, e foi adiada justamente pra ser feita
no outro computador**, com acesso ao banco pra testar.

O problema: `@prisma/adapter-neon` e `@neondatabase/serverless` estão
instalados, mas o `src/lib/db.ts` **não usa nenhum dos dois**. O Prisma abre
conexão TCP tradicional. Em serverless (Vercel) isso custa handshake
TCP + SSL a cada cold start, enquanto o adapter usa HTTP/WebSocket com
pooling.

Estado atual de `src/lib/db.ts`:

```ts
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  })
```

O que fazer:
1. Adicionar `previewFeatures = ["driverAdapters"]` no bloco `generator
   client` do `prisma/schema.prisma` (hoje não tem).
2. Instanciar o `PrismaNeon` como adapter no `db.ts`.
3. `npx prisma generate`.
4. Testar **com o banco acessível**: login, dashboard, uma tela de estudo e
   um simulado. O adapter muda como toda query sai, então não dá pra validar
   por typecheck.

Relacionado: o Neon hiberna quando fica ocioso. Se o site demora muito no
primeiro acesso depois de parado, é cold start do banco, e o adapter ajuda a
amenizar.

---

## 3. Pendência: segurança

### 3.1 Vulnerabilidades de dependência

> **RESOLVIDO em 23/09/2026, commit `a5b2930`.** O audit saiu de 20 problemas
> com 4 críticas para **14 com nenhuma crítica**. Versões agora: `next@16.3.6`,
> `next-auth@5.0.0-beta.32`, `@auth/prisma-adapter@2.11.3`, que puxa o
> `@auth/core@0.41.3` corrigido.
>
> Detalhe que custou um passo a mais: subir só o `next-auth` não bastava. Ele
> já usava o `@auth/core@0.41.3`, mas o `@auth/prisma-adapter@2.11.2`
> continuava arrastando a `0.41.2` vulnerável como dependência própria. Só
> ficou limpo depois de subir o adapter para `2.11.3`.
>
> Validado com typecheck, 66 testes, lint e `next build` chegando em
> "Compiled successfully". **Ainda falta o teste manual** com o app rodando
> (login, Mentor, upload de foto, um simulado inteiro), que aqui não dá por
> falta de banco.
>
> Sobram 14 moderate/high, a maioria em ferramental de build (`postcss`,
> `browserslist`, `vitest`) e nos scripts de importação (`adm-zip`,
> `@xmldom/xmldom`), que não rodam em produção. O texto abaixo fica como
> registro do que era e do que foi corrigido.

O que tinha no `next` 16.2.9, entre outras:
- **RCE não autenticado em servidores Windows**
- **RCE não autenticado** na Image Optimization API via arquivos AVIF
- Bypass de Middleware/Proxy no App Router
- SSRF em Server Actions e em rewrites
- DoS via Server Actions e via SVG na Image Optimization

No Auth.js:
- **Erro de configuração pode fazer a checagem de autenticação "fail open"**
  (passa em vez de bloquear)
- Bypass de e-mail por homóglifo de `@` (normaliza depois de validar)
- Cookies de `state`/`nonce`/PKCE não vinculados ao provider que os criou

Dois atenuantes que apurei, pra dimensionar sem alarmismo:
- O bypass de proxy tem impacto reduzido aqui: as rotas de API
  (`/api/mentor`, `/api/planner/recalibration-check`, `/api/profile`)
  validam sessão por conta própria, não dependem só do `src/proxy.ts`.
- A Image Optimization tem superfície pequena: `next/image` só é referenciado
  em `src/proxy.ts` e os `remotePatterns` se limitam a domínios do Google.

Ainda assim, **subir o Next é a ação mais urgente do projeto**. O `npm audit
fix --force` quer instalar `next@16.3.6`, que sai do range declarado, então
é atualização de minor com teste manual depois: login, Mentor (usa Server
Actions e streaming), upload de foto de perfil e um simulado inteiro.

### 3.2 O que já está correto

Apurado, não assumido:
- `.env` **nunca** foi commitado (conferido em todo o histórico do git).
- A credencial do Neon não aparece em nenhum arquivo versionado.
- Nenhum segredo hardcoded em `src/` (procurei por padrões de chave
  OpenAI e Google).
- Senhas com `bcrypt`, cost 10.
- Sessão por JWT, sem hit no banco a cada request.
- Todas as rotas de API checam `auth()`.

### 3.3 Strix (pendente, precisa de combinado antes)

Ferramenta pedida: https://github.com/usestrix/strix

É pentest autônomo: roda agentes com acesso a shell e browser pra atacar o
alvo. **Não rodar contra a produção**, porque pode corromper dados de alunos
reais, disparar e-mails de verdade e derrubar o serviço.

O certo é subir uma instância separada (banco próprio, dados falsos) e
apontar o Strix pra ela. Antes de rodar, confirmar:
- que o alvo é ambiente de teste, não produção;
- que o banco daquele ambiente é descartável;
- que as chaves de IA são de teste (o Mentor gasta cota de verdade).

---

## 4. Pendência: LGPD

O app guarda dado pessoal de estudante, provavelmente **menor de idade** (é
público de vestibular, o que puxa o Art. 14, consentimento de responsável).

O que é guardado: nome, e-mail, senha (hash), foto, mais dados de
desempenho, e **redações**, que são texto escrito pelo próprio aluno e podem
conter dado pessoal e até sensível.

Faltam três coisas que a lei exige, e nenhuma existe hoje (verifiquei no
código, não achei nada):

1. **Política de privacidade e termos de uso.** Não existe nenhuma página.
   Precisa dizer o que é coletado, por quê, por quanto tempo, e com quem é
   compartilhado.
2. **Exclusão de conta** (Art. 18, direito à eliminação). Não existe. O
   schema tem `onDelete: Cascade` nas relações, então o efeito técnico é
   simples; falta a funcionalidade e a tela.
3. **Exportação de dados** (Art. 18, portabilidade). Não existe.

Ponto extra de transparência: dados do aluno são enviados a **terceiros**
(OpenAI em `src/lib/mimo.ts` e `/api/mentor`; Google Gemini em
`src/lib/gemini.ts` e `/api/planner/recalibration-check`). Transferência a
terceiros precisa estar declarada na política, e provavelmente há
transferência internacional, o que tem regra própria.

---

## 5. Coisas que aprendemos e não podem se perder

### 5.1 Service Worker segura troca de imagem por um carregamento

`public/sw.js` serve imagens com `staleWhileRevalidate`: entrega a versão em
cache e busca a nova em segundo plano. Na prática, **toda troca de imagem só
aparece no segundo carregamento**. Isso já causou confusão ("não trocou") em
duas ocasiões. Ao trocar arte, recarregar duas vezes antes de concluir que
deu errado.

### 5.2 Corte de imagem: não existe receita única

Três imagens diferentes precisaram de três tratamentos:

- **Halo escuro na borda** (alpha contaminado, cor misturada com o preto
  original): zerar pixels com alpha < 250. Resolveu.
- **Imagem já limpa**: só `trim` + `resize`. Aplicar o corte de alpha aqui
  **estragaria** a imagem.
- **Pedra com sparkles translúcidos de propósito**: o corte por limiar abriu
  buracos na superfície, porque os brilhos têm alpha baixo legítimo.

**Sempre testar a imagem contra fundo magenta antes de escolher o
tratamento.** É o que revela franja e buraco.

### 5.3 O banco não é alcançável desta máquina

Impede `prisma migrate dev`, `next build` completo (o build faz prerender de
`/sitemap.xml`, que consulta o banco) e qualquer teste E2E que exija login.
Foi por isso que a migration do índice foi escrita à mão, no formato que o
Prisma geraria.

---

## 6. Ordem sugerida pra retomar

1. ~~Atualizar o Next e os pacotes de auth~~ **feito em 23/09**, commit
   `a5b2930`. Falta só o teste manual com o app no ar: login, Mentor, upload
   de foto e um simulado inteiro.
2. **Ligar o adapter Neon** (seção 2), com o banco acessível pra validar.
   Esta é a próxima da fila.
3. Confirmar que a migration do índice foi aplicada.
4. LGPD: política de privacidade, exclusão de conta, exportação de dados.
5. Strix, em ambiente de teste separado, com o combinado da seção 3.3.

Itens 1 e 2 mexem em runtime e é melhor não fazer os dois no mesmo deploy:
se algo quebrar, fica difícil saber qual foi. Como o 1 já subiu sozinho,
vale confirmar que a produção está de pé antes de mexer no adapter.
