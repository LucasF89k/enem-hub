# Handoff — Redesign visual inspirado no Opal (sessão de 19–20/08/2026)

> Continuação de `PROJECT_STATE.md`. Este documento cobre **só** a frente de
> design/animação: a abertura do app e o novo visual. As frentes de conteúdo
> (questões, flashcards, vídeos do YouTube) seguem como estão lá.

---

## 1. O que foi feito

Redesign do app com a linguagem visual do **Opal (iOS)**, a partir de
`opalstudyappdesignspec (1).md` (na raiz, não versionado) + 4 prints de
referência + um vídeo de referência que o usuário gravou.

**19 commits**, de `4aafca2` até `fd97313`. Resumo por frente:

### Tema (app inteiro)
- `src/app/globals.css` — paleta `.dark` trocada pela referência Opal: fundo
  quase preto `#06070A`, cards `#0F1215`, accent **mint** `#7CF2C8`, bordas
  translúcidas, warning laranja para o streak.
- Tokens novos: `--gauge-track`, `--gauge-from`, `--gauge-to`, `--glow-mint`,
  `--glow-purple`, com fallback sóbrio no light mode (que ficou intacto).
- `--primary` **deixou de ser roxo** (era `hsl(263 65% 68%)`, o violeta
  clichê de tema de IA) e virou mint. Como o app já usava o token e não a cor
  literal, isso migrou botões, nav ativa, ranking etc. de uma vez.
- Classes utilitárias criadas: `.opal-hero-bg` (vinheta + glow),
  `.opal-glass-card` (glassmorphism), `.opal-breathing-glow`, `.opal-enter`
  (entrada em cascata, CSS puro — funciona em Server Component).

### Componentes novos
| Arquivo | O que é |
|---|---|
| `src/components/AppSplash.tsx` | Sequência de abertura (logo → reveal → recuo de câmera) |
| `src/components/LogoBuild.tsx` | Logo se montando, revelando o PNG real por máscaras |
| `src/components/OpalCrystal.tsx` | A pedra nas 4 fases (usa as imagens de `public/opal/`) |
| `src/components/dashboard/MetricPill.tsx` | Cápsula ícone + valor + label |
| `src/components/dashboard/StudyNudgeCard.tsx` | Card de sugestão/ação |
| `scripts/prepare-opal.js` | Prepara as artes da pedra (classifica fase, recorta fundo, exporta WebP) |

### Telas
- **Dashboard** — hero com a gema no miolo do anel de meta e o tempo por cima;
  pills de Foco/Consistência/Revisão; nudge card contextual.
- **Flashcards** — hero com número grande + CTA único (em vez de título solto).
- **Login/registro** — vinheta + card de vidro.
- **`<Card>` do shadcn** — recebeu o glassmorphism no primitivo, então as 20
  telas que o usam herdaram de uma vez.

---

## 2. Assets da pedra

Geradas pelo usuário no ChatGPT (uso comercial permitido) e processadas por
`scripts/prepare-opal.js`:

```
public/opal/stage-0.webp   rocha opaca         114 KB
public/opal/stage-1.webp   primeiros veios     117 KB
public/opal/stage-2.webp   cacos se abrindo    158 KB
public/opal/stage-3.webp   gema exposta         98 KB
public/opal/reveal.mp4     vídeo do reveal     894 KB
```

Os PNGs originais estão em `C:\Users\lucas.lourenco\Downloads\Nova pasta`
(fora do repo). Para reprocessar:

```bash
node scripts/prepare-opal.js "C:\Users\lucas.lourenco\Downloads\Nova pasta"
```

### O vídeo do reveal
Gerado no **Kling AI 3.0** (`klingai.com`), free tier com créditos diários:
- **Image to Video**, com *start frame* = `stage-0` e *end frame* = `stage-3`
- 720p · 5s · sem áudio · custo ~30 créditos
- Prompt usado:

```
One continuous physical transformation of the SAME rock. Locked camera,
pure black background, no cuts, no crossfade, no morphing, no text.
The intact dark volcanic boulder cracks along its real surface. Cyan and
green iridescent light glows from inside the widening cracks. The stone
shell fractures and several realistic rock chunks detach and drift
outward in 3D with small particles. The precious opal core that was
inside all along becomes fully exposed, emitting intense play-of-color
in cyan, turquoise, green and magenta.
Realistic rock fracture physics, premium Apple-style product animation,
cinematic, smooth ease-in-out. locked camera, no text, no logo.
```

Reprocessamento do arquivo baixado (tira a marca d'água do Kling e reduz):

```bash
ffmpeg -i "<mp4 do Kling>" \
  -vf "drawbox=x=670:y=880:w=290:h=80:color=black:t=fill,scale=600:600" \
  -c:v h264_mf -b:v 1500k -pix_fmt yuv420p -an -y public/opal/reveal.mp4
```

> O ffmpeg do sistema é o do Free Download Manager
> (`C:\Program Files\Softdeluxe\Free Download Manager\ffmpeg.exe`).
> Ele **não tem** `libx264`, `libvpx` nem o filtro `eq` — só `h264_mf`.
> O ffmpeg do Playwright é ainda mais limitado (só VP8/PNG, não lê H.264).

---

## 3. Armadilhas descobertas (leia antes de mexer nisso)

Cada uma custou pelo menos uma iteração. São específicas e não óbvias.

### Framer Motion dentro de `<mask>` só anima `pathLength`
`r`, `rx`, `ry`, `x`, `y` e `scale` **não animam** ali: viram transform CSS ou
são ignorados, e a máscara fica congelada no valor inicial. Por isso, em
`LogoBuild.tsx`, só o anel tem máscara animada (usa `pathLength`); as outras
peças usam máscara **estática** com o `<g>` animado por fora.

### `hsl(var(--token))` gera CSS inválido neste projeto
Os tokens já vêm com `hsl(...)` embutido no valor, então `hsl(var(--primary))`
vira `hsl(hsl(...))` e o navegador descarta. Era por isso que os gráficos
Recharts apareciam sem a cor do tema. Use `var(--primary)` direto; para alpha,
`color-mix(in srgb, var(--primary) 45%, transparent)`.

### `mix-blend-mode` não alcança o fundo se o pai tiver transform
O `transform` que o Framer Motion aplica cria stacking context e isola o blend.
Foi por isso que `screen` no vídeo não removeu o fundo.

### Blend `screen` sobre base clara satura tudo em branco
A opala saía branca e lisa porque a base era `#E8F8F1` e as cores entravam em
screen. Base tem que ser **escura** para as cores somarem luz sobre ela.

### O preto do H.264 nunca chega a zero
O pipeline YUV devolve ~`RGB(20,25,25)` para o preto. Medido em cada tentativa:

| Tentativa | Fundo resultante |
|---|---|
| original do Kling | `(24, 29, 29)` |
| `colorlevels rimin=0.24` | `(12, 14, 14)` |
| `lutrgb -26` | `(15, 17, 17)` |
| `lutyuv threshold 54` | `(20, 23, 23)` |
| vinheta por blend multiply | `(18, 22, 22)` |

E o valor renderizado ainda passa pelo color management do aparelho — igualar
por CSS funcionava no desktop e falhava no celular. **Não tente casar cor.**
A solução foi máscara radial levando o alpha a zero em 80% do raio, bem antes
da borda do elemento: não há aresta possível seja qual for a cor.

### Recorte de fundo preto pede flood fill, não threshold
As sombras da rocha são tão escuras quanto o fundo; um threshold global abre
buracos no meio da pedra. `prepare-opal.js` usa flood fill a partir das bordas,
e mesmo assim o limiar teve que cair de 20 para **7**.

### Dois spinners circulares seguidos parecem bug
O `app/loading.tsx` tinha um anel girando e logo depois a splash começava com
o anel da logo — lia como se a animação repetisse. O loading agora é só fundo.

### `<video>` precisa montar antes da hora de tocar
Montá-lo só na troca de fase deixava **2s de tela preta** (medido: brilho 0.00
de t=2.67s a t=4.67s). Ele agora fica montado desde o início, invisível,
carregando durante a logo; o `play()` dispara por efeito quando a fase muda.

### Fallback de vídeo não pode aparecer durante o carregamento
Estava renderizando a gema (`stage-3`) enquanto `canPlay` fosse falso, então a
abertura mostrava a gema → apagava → começava pela rocha. Fallback só em falha
real (`onError`); quem cobre o carregamento é o `poster`.

### `object-cover` em vídeo quadrado numa tela vertical
Amplia ~1.7x e corta a pedra pela metade. Em tela larga fica pior ainda.

---

## 4. Como validar mudanças visuais

A rede local bloqueia as portas do Neon (5432/6543), então use o Postgres do
Docker:

```bash
docker start enem-db
cd c:\Users\lucas.lourenco\Desktop\enem-hub
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/enem_hub" npx next build
AUTH_TRUST_HOST=true DATABASE_URL="postgresql://postgres:postgres@localhost:5432/enem_hub" \
  NEXTAUTH_URL="http://localhost:3001" PORT=3001 npx next start
```

> `AUTH_TRUST_HOST=true` é obrigatório em `next start` fora da porta 3000,
> senão o NextAuth recusa com `UntrustedHost`.

**Usuário de teste local:** `opaltest_1787168818099@example.com` / `Senha123!`

Para inspecionar animação, grave a tela com Playwright e extraia os quadros —
foi assim que os bugs de timing apareceram. Medir luminância por coluna é o
jeito confiável de provar que não há moldura (procure degrau = 0.00).

---

## 5. Pendências

1. **Confirmar a correção da moldura no celular.** O último commit (`fd97313`)
   troca a estratégia de "casar cor" para "alpha zero antes da borda". Foi
   verificado por medição (degrau 0.00 em dois momentos), mas o usuário ainda
   não validou no aparelho dele. Era o problema em aberto quando a sessão
   encerrou.

2. **Telas ainda sem redesenho estrutural:** Simulados, Redação, Planner,
   Analytics, Perfil. Elas já herdaram a paleta e o glassmorphism (via o
   `<Card>` base), mas não ganharam hero próprio como Dashboard e Flashcards.

3. **O slime da gema no hero** (deformação de gelatina por `feTurbulence`)
   está ativo em `StudyScoreGauge`. O usuário chegou a comentar que o
   movimento certo "não tem deformação gelatinosa" — mas isso era sobre a
   animação de abertura, não sobre o hero. Vale confirmar se ele quer manter.

4. **Hydration warning pré-existente** no `ExamCountdown` (contador ao vivo,
   mismatch de segundos entre SSR e cliente). Não foi introduzido aqui e não
   foi tratado.

---

## 6. O que NÃO fazer

- **Não copiar assets do Opal.** O objeto do vídeo de referência é um render 3D
  proprietário deles. As artes em `public/opal/` foram geradas para este
  projeto e são de uso livre — mantenha assim.
- **Não redesenhar a logo em SVG.** Foi tentado e sempre saía diferente do
  arquivo real (a seta virava uma "bandeirinha"). `LogoBuild.tsx` revela o
  `logo-app.png` real por máscaras, então é pixel-perfect por construção.
- **Não tentar igualar a cor do fundo do vídeo.** Ver a tabela de medições
  acima.
