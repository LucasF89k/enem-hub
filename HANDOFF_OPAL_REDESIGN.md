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
public/opal/stage-0.webp     rocha opaca              114 KB
public/opal/stage-1.webp     primeiros veios          117 KB
public/opal/stage-2.webp     cacos se abrindo         158 KB
public/opal/stage-3.webp     gema exposta              98 KB
public/opal/reveal.mp4       vídeo do reveal (pedra)  892 KB — pendente de
                              regeração sem estilhaços caindo (§5, item 1)
public/opal/logo-reveal.mp4  vídeo da logo montando   280 KB — 9:16, full
                              bleed via object-cover, faststart
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

Reprocessamento do arquivo baixado (tira a marca d'água do Kling, reduz, e
**sempre** termina com faststart — ver armadilha na seção 3):

```bash
ffmpeg -i "<mp4 do Kling>" \
  -vf "drawbox=x=670:y=880:w=290:h=80:color=black:t=fill,scale=600:600" \
  -c:v h264_mf -b:v 1500k -pix_fmt yuv420p -an -y public/opal/reveal-raw.mp4
ffmpeg -i public/opal/reveal-raw.mp4 -c copy -movflags +faststart \
  -y public/opal/reveal.mp4
```

> Confira o box do `drawbox` em CADA geração nova — o Kling não coloca a
> marca d'água sempre no mesmo lugar/tamanho entre vídeos diferentes (ex.:
> o vídeo da logo tinha "◯ KlingAI 3.0 Omni", mais largo que o box herdado
> do vídeo da pedra, e sobrou um pedaço visível). Extraia um frame do source
> cru e confira visualmente antes de assumir as mesmas coordenadas.

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

### MP4 sem `+faststart` trava a splash no mobile
O `ffmpeg` sem `-movflags +faststart` grava o átomo `moov` (índice/metadata
do arquivo) no FINAL do MP4 — desktop toca assim numa boa (baixa o arquivo
inteiro rápido o bastante), mas navegador mobile trava esperando o moov
antes de decodificar qualquer frame: apareceu como vídeo congelado sem
tocar. Fix sem recodificar: `ffmpeg -i in.mp4 -c copy -movflags +faststart
out.mp4` — só reordena os átomos do container. Checar com `xxd -l 64
arquivo.mp4`: `moov` tem que vir logo depois de `ftyp`, antes de `mdat`.

### `autoPlay` via atributo JSX falha mais no mobile que `.play()` imperativo
Um `<video autoPlay muted playsInline>` que só monta um instante depois da
navegação (dentro de `AnimatePresence`, por exemplo) tem taxa de rejeição de
autoplay maior no Chrome/Safari mobile do que chamar `.play()` num
`useEffect` depois do mount — e mesmo assim, forçar `el.muted = true` e
`el.playsInline = true` diretamente no objeto DOM (via ref) logo antes do
`.play()`, não só via prop, evita uma corrida de timing que também derruba
autoplay silenciosamente.

### Rejeição de `.play()` NÃO é sinônimo de vídeo quebrado
A Promise de `.play()` rejeita por vários motivos que não são falha de
decodificação (readyState não ideal, corrida com a política de autoplay).
Tratar qualquer rejeição como erro fatal (mostrar fallback estático) faz o
fallback aparecer JUNTO com o vídeo que na verdade tocou normalmente logo
em seguida — dois logos sobrepostos. Quem decide "falha real" é o `onError`
do elemento, não o catch do `.play()`.

### Modo economia de bateria/dados bloqueia autoplay de vídeo — sem contorno via código
No mobile, com o navegador em modo economia (Chrome "Saver de dados" ou
equivalente), a política de autoplay é recusada pelo próprio SO mesmo com
`muted`+`playsInline` corretos. Não tem flag nem técnica que force isso.
A solução que funciona em qualquer motor de renderização (browser hoje, um
WebView nativo se o app for empacotado pra loja no futuro) é: quando
`.play()` rejeita, mostrar um overlay pedindo um toque — o clique é o único
gesto de usuário que garante `.play()` sem exceção. Bônus: depois da
primeira interação real com vídeo, o navegador registra "media engagement"
pro site e passa a liberar autoplay sozinho nas próximas aberturas, então
o overlay tende a só aparecer uma vez por navegador na prática.

### A splash é tela de loading, não "vista uma vez" — cuidado com o storage
Ela deve rodar em TODO carregamento fresco do documento (fechou a aba e
abriu de novo), não só na primeira vez do usuário no aparelho. Guardar um
flag "splash-shown" em `localStorage` (pra nunca mais mostrar) ou checar
`document.readyState` no mount pra tentar detectar "SPA nav vs. abertura
fria" são as duas armadilhas em que essa sessão caiu — a segunda partia de
uma premissa errada (achar que o componente remonta em navegação
client-side; não remonta, ele vive no root layout, que o Next.js mantém
montado entre trocas de rota). O único estado que vale a pena persistir pra
sempre é a autorização de mídia do toque (ver item acima), não "já vi a
splash".

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

1. **Regerar o vídeo da pedra sem os estilhaços caindo.** Ideia do usuário
   (21/08, sessão de correção de bugs de produção): em vez dos cacos da
   rocha se soltando e caindo pra fora de quadro — que é o que força cobrir
   uma área imprevisível de "queda" e é a origem de quase toda a dor de
   cabeça de moldura/borda documentada abaixo — os cacos ficam **flutuando**
   ao redor da gema (não caem), e depois a gema resultante desliza suave até
   a posição final dela na Home. Mais fácil de mascarar sem revelar borda:
   a área a esconder passa a ser só o entorno da gema flutuando, que já é
   exatamente o que a máscara radial (`maskImage` em `AppSplash.tsx`) faz
   hoje — não precisa inventar nada novo de CSS, só o vídeo precisa nascer
   assim. Prompt do Kling deve pedir explicitamente câmera travada, cacos
   orbitando/flutuando sem física de queda, sem sair do enquadramento.

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
