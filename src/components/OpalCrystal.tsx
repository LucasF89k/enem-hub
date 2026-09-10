"use client"

import { motion } from "framer-motion"
import { useEffect, useId, useRef, useSyncExternalStore } from "react"

/**
 * A pedra de opala, nas 4 fases da animação de abertura:
 *
 *   stage 0: rocha bruta opaca
 *   stage 1: os primeiros veios de fogo acendem nas fendas
 *   stage 2: os cacos se abrem e o núcleo aparece
 *   stage 3: a gema pura, exposta
 *
 * As artes são imagens reais (geradas para o projeto e recortadas por
 * `scripts/prepare-opal.js`, que remove o fundo preto por flood fill).
 *
 * A troca entre fases é um crossfade: as quatro ficam empilhadas e só a opacidade
 * muda, então não há "pulo" de forma nem recarregamento no meio da animação.
 *
 * MODO SLIME (stage 3): UM calombo que PERCORRE a superfície, inchando e
 * relaxando enquanto anda, dando a leitura de "algo empurrando de dentro".
 *
 * Por que não uma pilha de imagens pré-deformadas com crossfade (a tentativa
 * anterior): dissolver entre deformações paradas não gera movimento. A camada
 * A vira fantasma e a B aparece por cima; o calombo não DESLIZA de um ponto ao
 * outro. Como as silhuetas ocupam quase a mesma área, o olho lê como imagem
 * parada, mesmo com o filtro e a animação corretos. Deformação contínua exige
 * o mapa de deslocamento se movendo de fato, quadro a quadro.
 *
 * Custo: o filtro é reavaliado a cada quadro, mas só sobre a caixa da pedra
 * (~200px), e as primitivas são baratas (blit + matriz + deslocamento). O que
 * travava em sessões passadas era `feTurbulence` animado, que RECALCULA ruído
 * procedural na região inteira todo quadro. Aqui não há turbulência: o mapa é
 * rasterizado uma única vez e só é DESLOCADO (feOffset).
 */

/**
 * Geometria dos bojos.
 *
 * O mapa tem 300 unidades = 3x a região do filtro (100 unidades = 1 região), e
 * é povoado por VÁRIOS bojos espalhados. A pedra ocupa ~62 unidades no centro,
 * então a qualquer momento 2 ou 3 deles estão sobre ela, que é a leitura da
 * referência: um blob com alguns lóbulos grandes saindo ao mesmo tempo, não um
 * único calombo passeando.
 *
 * O `feOffset` passeia com o mapa inteiro, então os bojos entram, atravessam a
 * pedra e saem: cada um nasce, cresce e some sozinho.
 */
const MAP_UNITS = 300
// TAMANHO DO BOJO: o número mais sensível do efeito.
// A pedra ocupa ~62 unidades do mapa. Um bojo perto disso empurra a pedra
// INTEIRA pra fora junto, o que o olho lê como escala uniforme, ou seja,
// zoom, não como um lóbulo. Bem menor que a pedra faz caberem 3 ou 4 ao
// mesmo tempo, e aí cada um incha o seu pedaço: é a leitura da referência.
// O que evita o rasgo não é o tamanho, é a curva em sino do gradiente.
const BULGE_R = 46
const LOBE_OFF = BULGE_R * 0.5 // afastamento de cada lóbulo ao centro do bojo
const LOBE_R = BULGE_R * 0.52 // raio de cada lóbulo
const CYCLE = 11 // segundos por volta completa do passeio dos bojos

/** Centros dos bojos, espalhados e desalinhados de propósito. */
const BULGES: [number, number][] = [
  [50, 45], [165, 60], [275, 40],
  [40, 160], [150, 150], [262, 168],
  [58, 268], [170, 258], [282, 275],
]

/**
 * Mapa de deslocamento, como imagem SVG autocontida (data URI).
 *
 * Data URI e não `href="#id"`: `feImage` apontando pra outro elemento do
 * documento (ainda mais dentro de um `<svg width="0">`) é malsuportado: sai
 * vazio e o filtro vira um no-op silencioso, sem erro nenhum.
 *
 * Dois LÓBULOS RADIAIS por bojo (claro/escuro), não um gradiente linear: faixa
 * linear atravessa a imagem inteira e gera cisalhamento em cruz; lóbulo radial
 * confina a deformação num círculo, que é uma elevação de verdade.
 *
 * Sinal: o feDisplacementMap lê P(p + d), ou seja, cada ponto do resultado
 * BUSCA a cor de outro lugar. Pra parecer que a superfície inchou pra fora,
 * cada lado busca conteúdo mais PERTO do centro do bojo: claro do lado de cá,
 * escuro do lado de lá. Invertido, vira uma pinça sugando pra dentro.
 */
function bulgeMapDataUri(axis: "x" | "y"): string {
  const circles = BULGES.map(([cx, cy]) => {
    const [lx, ly] = axis === "x" ? [cx - LOBE_OFF, cy] : [cx, cy - LOBE_OFF]
    const [dx, dy] = axis === "x" ? [cx + LOBE_OFF, cy] : [cx, cy + LOBE_OFF]
    return (
      `<circle cx="${lx}" cy="${ly}" r="${LOBE_R}" fill="url(#l)"/>` +
      `<circle cx="${dx}" cy="${dy}" r="${LOBE_R}" fill="url(#d)"/>`
    )
  }).join("")
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP_UNITS}" height="${MAP_UNITS}">` +
    `<defs>` +
    // queda em sino (não linear): linear deixa um bico no centro do lóbulo,
    // o sino dá a barriga arredondada que a referência tem
    `<radialGradient id="l">` +
    `<stop offset="0" stop-color="#fff" stop-opacity="1"/>` +
    `<stop offset="0.35" stop-color="#fff" stop-opacity="0.92"/>` +
    `<stop offset="0.62" stop-color="#fff" stop-opacity="0.6"/>` +
    `<stop offset="0.82" stop-color="#fff" stop-opacity="0.25"/>` +
    `<stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="d">` +
    `<stop offset="0" stop-color="#000" stop-opacity="1"/>` +
    `<stop offset="0.35" stop-color="#000" stop-opacity="0.92"/>` +
    `<stop offset="0.62" stop-color="#000" stop-opacity="0.6"/>` +
    `<stop offset="0.82" stop-color="#000" stop-opacity="0.25"/>` +
    `<stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>` +
    `</defs>` +
    `<rect width="${MAP_UNITS}" height="${MAP_UNITS}" fill="#808080"/>` +
    circles +
    `</svg>`
  return `data:image/svg+xml,${encodeURIComponent(svg)}`
}

const MAP_X = bulgeMapDataUri("x")
const MAP_Y = bulgeMapDataUri("y")

const STAGES = [0, 1, 2, 3] as const

/** Sem assinatura de verdade: só serve pro useSyncExternalStore devolver
 *  `false` no servidor e `true` no cliente (o jeito idiomático de saber que a
 *  hidratação terminou, sem setState dentro de efeito). */
const subscribeNoop = () => () => {}

export function OpalCrystal({
  size = 150,
  stage = 3,
  slime = false,
  icon = false,
  bubble = false,
}: {
  size?: number
  stage?: 0 | 1 | 2 | 3
  /** um calombo passeando por dentro da pedra (só no stage 3), tipo gosma viva */
  slime?: boolean
  /** modo ícone: sem halo (em avatar pequeno o blur vira borrão). */
  icon?: boolean
  /** bolha de vidro transparente envolvendo a pedra (rim + brilho especular) */
  bubble?: boolean
  /** @deprecated não usado, mantido pra não quebrar chamadas antigas */
  slimeScale?: number
}) {
  // id único por instância: se duas pedras montarem na mesma página, filtros
  // com o mesmo id fariam uma roubar o filtro da outra.
  const filterId = `opal-slime-${useId().replace(/[^a-zA-Z0-9]/g, "")}`

  // O filtro só entra DEPOIS da montagem. Assim o servidor e o primeiro render
  // do cliente produzem exatamente a mesma árvore, e não há incompatibilidade
  // de hidratação. Isso importa muito aqui: quando o React encontra árvores
  // diferentes ele DESCARTA e recria aquele pedaço, e o efeito abaixo, que
  // guarda referências aos nós do filtro, ficava apontando pros nós antigos,
  // já fora da tela. A animação seguia rodando, escrevendo no lugar errado.
  const hydrated = useSyncExternalStore(subscribeNoop, () => true, () => false)
  const active = slime && stage === 3 && hydrated

  const hostRef = useRef<HTMLDivElement>(null)
  const offXRef = useRef<SVGFEOffsetElement>(null)
  const offYRef = useRef<SVGFEOffsetElement>(null)
  const dispRef = useRef<SVGFEDisplacementMapElement>(null)

  useEffect(() => {
    if (!active) return
    const host = hostRef.current

    // Nota: esta animação NÃO é travada por `prefers-reduced-motion`, por
    // decisão explícita do dono do produto: a pedra viva é identidade da
    // marca aqui, e as outras animações da tela (flutuar, halo) já rodam via
    // Framer Motion, que também ignora essa preferência. Se um dia isso
    // mudar, é só voltar a checar o matchMedia aqui.

    const travel = size * 0.35 // raio do passeio do mapa, em px
    const baseScale = size * 0.24 // força do empurrão, em px

    // Só anima enquanto a pedra está na tela: rolar a página pra longe não deve
    // continuar queimando quadros. (Aba em segundo plano o próprio
    // requestAnimationFrame já pausa sozinho.)
    let visible = true
    const io =
      host && "IntersectionObserver" in window
        ? new IntersectionObserver(([e]) => {
            visible = e.isIntersecting
          })
        : null
    if (io && host) io.observe(host)

    let raf = 0
    const t0 = performance.now()

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame)
      if (!visible) return

      const a = ((now - t0) / 1000 / CYCLE) * Math.PI * 2

      // Harmônicos somados: o caminho fecha o ciclo (períodos inteiros) mas não
      // é um círculo perfeito, então o passeio sai irregular, com cara de gosma
      // se remexendo em vez de um ponto girando em órbita.
      const px = travel * (0.78 * Math.cos(a) + 0.22 * Math.cos(3 * a))
      const py = travel * (0.78 * Math.sin(a) + 0.22 * Math.sin(2 * a))

      // O bojo incha e relaxa enquanto anda: sem isso ele só desliza, e
      // deslizar não lê como "empurrando de dentro".
      const swell = baseScale * (0.78 + 0.22 * Math.sin(2 * a + 0.7))

      // Lidas a cada quadro de propósito (e não capturadas na montagem): se o
      // React recriar esses nós, continuamos escrevendo nos que estão de fato
      // na tela, em vez de num elemento órfão.
      const offX = offXRef.current
      const offY = offYRef.current
      const disp = dispRef.current
      if (!offX || !offY || !disp) return

      offX.setAttribute("dx", px.toFixed(2))
      offX.setAttribute("dy", py.toFixed(2))
      offY.setAttribute("dx", px.toFixed(2))
      offY.setAttribute("dy", py.toFixed(2))
      disp.setAttribute("scale", swell.toFixed(2))
    }
    raf = requestAnimationFrame(frame)

    return () => {
      cancelAnimationFrame(raf)
      io?.disconnect()
    }
  }, [active, size])

  // Movimento do wrapper: só uma deriva leve (flutuar/girar), bem devagar.
  // A deformação NÃO mora aqui (isso seria o objeto inteiro se mexendo, que lê
  // como "pulando"), mora no calombo que passeia pela superfície.
  const wrapperAnim = !icon
    ? { y: [-5, 5, -5], rotate: [-2, 2, -2] }
    : slime
      ? { y: [0, -1.5, 0.8, -1, 0], rotate: [0, 1, -0.6, 0.4, 0] }
      : undefined

  const wrapperTransition = !icon
    ? { duration: 9, repeat: Infinity, ease: "easeInOut" as const }
    : { duration: 6, repeat: Infinity, ease: "easeInOut" as const }

  return (
    <motion.div
      ref={hostRef}
      animate={wrapperAnim}
      transition={wrapperAnim ? wrapperTransition : undefined}
      style={{ width: size, height: size, willChange: "transform" }}
      className="relative"
    >
      {/* Halo: a luz que escapa da pedra */}
      {!icon && (
        <motion.div
          aria-hidden
          className="absolute left-1/2 top-1/2 -z-10 -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            width: size * 1.15,
            height: size * 1.15,
            background:
              "radial-gradient(circle, color-mix(in srgb, var(--glow-mint) 42%, transparent), transparent 70%)",
            filter: "blur(18px)",
          }}
          animate={{ opacity: [0.25 + stage * 0.16, 0.45 + stage * 0.16, 0.25 + stage * 0.16] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* Bolha de vidro: uma esfera transparente encapsulando a pedra, com aro
          fino, gradiente radial sutil e um brilho especular que desliza devagar
          (leitura de superfície curva de vidro, não um halo de luz). */}
      {bubble && (
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full"
          style={{
            width: size * 1.16,
            height: size * 1.16,
            background:
              "radial-gradient(circle at 32% 26%, rgba(255,255,255,0.16), rgba(255,255,255,0.02) 42%, rgba(255,255,255,0.05) 78%, rgba(255,255,255,0.12) 100%)",
            border: "1px solid rgba(255,255,255,0.22)",
            boxShadow:
              "inset 0 1px 6px rgba(255,255,255,0.18), inset 0 -8px 14px rgba(0,0,0,0.18), 0 0 0 1px rgba(255,255,255,0.04)",
          }}
        >
          <motion.div
            className="absolute rounded-full"
            style={{
              width: size * 0.42,
              height: size * 0.22,
              left: "14%",
              top: "12%",
              background: "radial-gradient(ellipse, rgba(255,255,255,0.55), transparent 72%)",
              filter: "blur(1.5px)",
            }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>
      )}

      {/* As 4 fases empilhadas; só a opacidade muda entre elas. A do stage 3
          leva o filtro do calombo quando o modo slime está ligado. */}
      {STAGES.map((s) =>
        s === 3 && active ? (
          // SEM Framer Motion de propósito: o Framer gerencia a prop `style` e
          // trata `filter` como valor animável, e um `url(#id)` pode acabar
          // descartado nesse caminho. Foi provavelmente por isso que o efeito
          // funcionava numa página de teste com <img> puro e não no app.
          // Aqui não há crossfade a fazer: quando `active`, stage é sempre 3.
          <div
            key={s}
            aria-hidden
            className="absolute inset-0"
            style={{ filter: `url(#${filterId})` }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/opal/stage-3.webp"
              alt=""
              draggable={false}
              className="h-full w-full select-none object-contain"
            />
          </div>
        ) : (
          <motion.img
            key={s}
            src={`/opal/stage-${s}.webp`}
            alt=""
            aria-hidden={s !== stage}
            draggable={false}
            className="absolute inset-0 h-full w-full select-none object-contain"
            initial={false}
            animate={{ opacity: s === stage ? 1 : 0 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        )
      )}

      {/* O filtro. Os dois mapas (um por eixo) entram inteiros e são deslocados
          juntos pelo feOffset: é o rAF acima que mexe no dx/dy deles e na
          força do feDisplacementMap. */}
      {active && (
        <svg width="0" height="0" className="pointer-events-none absolute" aria-hidden>
          <defs>
            <filter
              id={filterId}
              x="-30%"
              y="-30%"
              width="160%"
              height="160%"
              colorInterpolationFilters="sRGB"
            >
              {/* cinza neutro (= deslocamento zero) sob os mapas: é o que
                  preenche a área que o feOffset deixa pra trás ao passear com
                  eles. Sem isso a borda vira transparente e o
                  feDisplacementMap a lê como empurrão máximo, rasgando a
                  imagem nos cantos. */}
              <feFlood floodColor="#808080" floodOpacity="1" result="gray" />
              <feImage
                href={MAP_X}
                xlinkHref={MAP_X}
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
                preserveAspectRatio="none"
                result="mapXRaw"
              />
              <feImage
                href={MAP_Y}
                xlinkHref={MAP_Y}
                x="-100%"
                y="-100%"
                width="300%"
                height="300%"
                preserveAspectRatio="none"
                result="mapYRaw"
              />
              <feOffset ref={offXRef} in="mapXRaw" dx="0" dy="0" result="mapXMoved" />
              <feOffset ref={offYRef} in="mapYRaw" dx="0" dy="0" result="mapYMoved" />
              <feComposite in="mapXMoved" in2="gray" operator="over" result="mapX" />
              <feComposite in="mapYMoved" in2="gray" operator="over" result="mapY" />
              {/* isola o canal R do mapa X (deixa G/B em 0,5 = neutro) */}
              <feColorMatrix
                in="mapX"
                type="matrix"
                values="1 0 0 0 0  0 0 0 0 0.5  0 0 0 0 0.5  0 0 0 1 0"
                result="isoX"
              />
              {/* joga o R do mapa Y pro canal G (deixa R em 0,5) */}
              <feColorMatrix
                in="mapY"
                type="matrix"
                values="0 0 0 0 0.5  1 0 0 0 0  0 0 0 0 0.5  0 0 0 1 0"
                result="isoY"
              />
              {/* soma: R = deslocamento horizontal, G = vertical */}
              <feComposite
                in="isoX"
                in2="isoY"
                operator="arithmetic"
                k1="0"
                k2="1"
                k3="1"
                k4="-0.5"
                result="bump"
              />
              <feDisplacementMap
                ref={dispRef}
                in="SourceGraphic"
                in2="bump"
                scale={size * 0.24}
                xChannelSelector="R"
                yChannelSelector="G"
              />
            </filter>
          </defs>
        </svg>
      )}
    </motion.div>
  )
}
