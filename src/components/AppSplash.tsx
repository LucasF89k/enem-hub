"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
// LogoBuild.tsx (mask-reveal geométrico) deu lugar ao vídeo real do Kling.
// Fica no repo sem uso, é o fallback se algum dia precisar de novo.

/**
 * Sequência de abertura do app: roda no carregamento inicial do app
 * (fechou a aba/o navegador e abriu de novo, ou deu refresh), UMA VEZ por
 * sessão de aba (sessionStorage, dura enquanto a aba está aberta, reseta
 * ao fechar). Esse componente vive no root layout, que o Next.js não
 * desmonta/remonta em navegação client-side entre páginas do app (só o
 * conteúdo abaixo troca). Então em teoria ela já não reapareceria sozinha
 * navegando dentro do app sem precisar do gate. Ele existe mesmo assim como
 * cinto de segurança: se alguma navegação específica de aparelho/rede cair
 * num fallback de reload completo de documento no meio do uso, a splash não
 * volta a cobrir a tela, só reaparece se a aba/navegador for fechado de
 * verdade e reaberto.
 *
 *   logo se monta (vídeo) → a pedra flutua e a orb de luz surge ao redor
 *   dela (vídeo) → a câmera recua até a posição do hero → entra o app
 *
 * A fase da pedra é uma recompensa de quem já tem conta: só quem chega aqui
 * com sessão ativa (isLoggedIn) vê logo+pedra. Sem sessão, a splash mostra
 * só a logo montando e já segue pro login/cadastro: a pedra nunca aparece
 * pra quem ainda não tem cadastro.
 *
 * Automática por padrão (autoplay silencioso), mas alguns navegadores
 * mobile recusam autoplay por política do próprio SO (ex.: modo economia de
 * bateria/dados), e isso não tem contorno via código. Nesse caso a splash
 * mostra um overlay pedindo um toque; o clique nele é o gesto de usuário
 * que garante o play() em qualquer navegador, sem exceção.
 *
 * Esse "toque de autorização" (e só ele) FICA salvo pra sempre em
 * localStorage: uma vez que o usuário interage com o vídeo, o navegador
 * registra "media engagement" pro site e passa a liberar autoplay sozinho
 * dali em diante. Então da segunda vez em diante a splash tenta autoplay
 * direto de novo (sem mostrar o overlay), mesmo em modo economia. O que é
 * lembrado é a autorização, não "já vi a animação": a animação em si
 * continua rodando sempre.
 *
 * As duas fases são VÍDEO, não sequências de imagem: tanto a montagem da
 * logo (anel fechando, seta se formando) quanto a pedra flutuando com a orb
 * surgindo ao redor são movimento de verdade. Crossfade entre quadros
 * estáticos sempre dava aparência de slideshow. As imagens estáticas seguem
 * no projeto como poster/fallback de cada vídeo.
 *
 * Fica por cima do conteúdo real (que já está montando/buscando dados por
 * baixo em paralelo) e desaparece sozinha: não bloqueia nada, só cobre.
 */

type Step = "hidden" | "logo" | "reveal" | "pullback" | "done"

const LOGO_MS = 4200 // duração do vídeo da logo (4.04s) + respiro
const REVEAL_MS = 5000 // duração do vídeo da pedra
const PULLBACK_MS = 1000

export function AppSplash({ isLoggedIn }: { isLoggedIn: boolean }) {
  // Começa direto em "logo" (cobre a tela já no primeiro paint, sem o
  // frame de "pisca" que existiria se começasse em "hidden" e só virasse
  // "logo" dentro de um useEffect), EXCETO se essa aba já rodou a splash
  // nessa sessão de navegador, caso em que começa direto em "done".
  //
  // Isso é cinto de segurança contra qualquer navegação que acabe
  // remontando o root layout dentro do app (idealmente nunca acontece,
  // Next.js não desmonta o layout em navegação client-side normal, mas se
  // algo específico de aparelho/rede cair num fallback de reload completo
  // no meio do uso, a splash não deve voltar a cobrir a tela: sessionStorage
  // dura enquanto a aba está aberta, então cobre exatamente essa situação
  // sem contradizer "roda de novo se fechar e abrir aba/navegador").
  const [step, setStep] = useState<Step>(() => {
    try {
      return sessionStorage.getItem("splash-ran") === "1" ? "done" : "logo"
    } catch {
      return "logo"
    }
  })
  const [logoFailed, setLogoFailed] = useState(false)
  const [stoneFailed, setStoneFailed] = useState(false)
  // Autoplay silencioso pode ser recusado por política do navegador (ex.:
  // modo economia de bateria/dados no mobile), e não tem contorno via código
  // pra isso. O único play() que NUNCA é bloqueado é o que roda dentro de um
  // gesto do usuário (tap/click), então esse estado liga um overlay que pede
  // esse toque só quando o autoplay de fato falhou.
  const [needsTap, setNeedsTap] = useState(false)
  const logoVideoRef = useRef<HTMLVideoElement | null>(null)
  const stoneVideoRef = useRef<HTMLVideoElement | null>(null)
  const logoTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  // A timeline (reveal → pullback → done) é disparada pelo evento onPlay do
  // vídeo da logo (abaixo), não por um setTimeout fixo no mount. Se o
  // autoplay for recusado e o usuário precisar tocar pra continuar, a
  // contagem de LOGO_MS só pode começar quando o vídeo realmente começa a
  // rodar.

  // A splash é "fixed inset-0" e cobre a tela toda visualmente, mas o
  // documento por baixo continua crescendo (o dashboard real já está
  // montando/renderizando em paralelo). Sem travar o scroll do body, o
  // navegador mostra a barra de rolagem do body por trás da splash mesmo
  // sem dar pra rolar nada visível. Trava enquanto ela está em cena, libera
  // assim que sai (é aí que a barra deve voltar a existir, se a página
  // precisar dela).
  useEffect(() => {
    if (step === "hidden" || step === "done") return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = prevOverflow
    }
  }, [step])

  // Dispara o resto da timeline (reveal → pullback → done) a partir do
  // instante em que o vídeo da logo de fato começa a tocar: cobre tanto o
  // caminho feliz (autoplay silencioso funcionou) quanto o caminho do toque
  // manual (needsTap), sem duplicar a lógica de agendamento. onPlay pode
  // disparar mais de uma vez (buffering, retomar após seek); só a primeira
  // conta, daí o guard pelo array já ter timers agendados.
  function handleLogoPlaying() {
    if (logoTimersRef.current.length > 0) return
    setNeedsTap(false)

    const finish = () => {
      setStep("done")
      // Marca "já rodou nessa aba" só agora que a sequência de fato
      // terminou: é o que impede a splash de voltar a cobrir a tela se
      // alguma navegação dentro do app remontar o root layout.
      try {
        sessionStorage.setItem("splash-ran", "1")
      } catch {
        /* ignore */
      }
    }

    // Sem sessão: só a logo, direto pro login/cadastro. A pedra é
    // reservada pra quem já tem conta.
    logoTimersRef.current = isLoggedIn
      ? [
          setTimeout(() => setStep("reveal"), LOGO_MS),
          setTimeout(() => setStep("pullback"), LOGO_MS + REVEAL_MS),
          setTimeout(finish, LOGO_MS + REVEAL_MS + PULLBACK_MS),
        ]
      : [setTimeout(finish, LOGO_MS)]
  }

  useEffect(() => {
    return () => logoTimersRef.current.forEach(clearTimeout)
  }, [])

  // Rede de segurança: se por qualquer motivo o vídeo nunca disparar onPlay
  // (trava em buffering, autoplay falha sem cair no catch, decodificação
  // trava) a timeline inteira ficaria presa em "logo" pra sempre, e como a
  // splash é fixed inset-0 com z-999, ela bloqueia o app inteiro atrás dela
  // indefinidamente. Um travamento de vídeo nunca pode travar o app. Se a
  // timeline não avançou sozinha depois de um tempo bem generoso (~1.5x a
  // duração real do vídeo), força a passagem de fase mesmo assim.
  useEffect(() => {
    if (step !== "logo") return
    const timeout = setTimeout(() => {
      handleLogoPlaying()
    }, LOGO_MS + 1800)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step])

  // autoPlay via atributo HTML é o que o Chrome/Safari mobile mais recusa
  // quando o <video> monta um instante depois da navegação (aqui ele só
  // entra no DOM quando step vira "logo", dentro de AnimatePresence). Sem
  // o play() imperativo, o navegador cai pro estado pausado e mostra o
  // controle de play nativo por cima.
  //
  // Se ainda assim rejeitar (ex.: modo economia de bateria/dados, que
  // bloqueia autoplay por política do SO independente de muted+playsInline),
  // não tem contorno silencioso: liga o overlay de toque, cujo próprio
  // clique é o gesto de usuário que garante o play() em qualquer navegador.
  useEffect(() => {
    if (step !== "logo") return
    const el = logoVideoRef.current
    if (!el) return
    el.muted = true
    el.playsInline = true
    el.play().catch(() => setNeedsTap(true))
  }, [step])

  function handleTapToPlay() {
    // O toque em si é o que garante o play(). O registro em localStorage é
    // só pra saber, na próxima abertura, que esse navegador já tem "media
    // engagement" com o site e não precisa mostrar o overlay de novo (o
    // autoplay silencioso tende a já vir liberado sozinho a partir daqui).
    try {
      localStorage.setItem("splash-media-consent", "1")
    } catch {
      /* ignore */
    }
    logoVideoRef.current?.play().catch(() => setLogoFailed(true))
  }

  // O vídeo da pedra é pré-carregado durante a fase da logo (mesma lógica
  // de antes): assim que a logo sai de cena ele já está pronto pra tocar,
  // sem os ~2s de tela preta que apareciam quando ele só começava a baixar
  // na hora da troca de fase. Mesmo tratamento do vídeo da logo: força
  // muted/playsInline no elemento DOM (não só via prop JSX) antes do
  // play(), evitando a mesma corrida de autoplay que afetava a logo.
  //
  // Junto vai uma rede de segurança: esse vídeo não tem overlay de toque
  // como a logo, então se ele nunca tocar de verdade (autoplay falha sem
  // cair no catch, buffering trava) a tela ficaria congelada parada em
  // "reveal" pra sempre. Confere de novo em ~2s se ainda está pausado;
  // se sim, cai no fallback estático em vez de deixar a tela congelada.
  useEffect(() => {
    if (step !== "reveal") return
    const el = stoneVideoRef.current
    if (!el) return
    el.muted = true
    el.playsInline = true
    el.play().catch(() => setStoneFailed(true))
    const timeout = setTimeout(() => {
      if (el.paused) setStoneFailed(true)
    }, 2000)
    return () => clearTimeout(timeout)
  }, [step])

  const showingStone = step === "reveal" || step === "pullback"
  const pulling = step === "pullback"

  return (
    <AnimatePresence>
      {step !== "hidden" && step !== "done" && (
        <motion.div
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black"
        >
          {/* Logo se montando: vídeo, não mais o mask-reveal geométrico do
              LogoBuild.tsx. object-cover: o app é 100% mobile e o vídeo já
              nasceu em 9:16, mas nenhum aparelho bate essa proporção exata
              (iPhone é mais alongado, ~19.5:9), então object-contain deixaria
              tarjas. cover evita tarja recortando só a margem preta de cima/
              baixo, que já sobra generosa em volta da logo. */}
          <AnimatePresence>
            {step === "logo" && (
              <motion.div
                key="logo"
                exit={{ opacity: 0, transition: { duration: 0.35 } }}
                className="absolute inset-0 z-10"
              >
                <video
                  ref={logoVideoRef}
                  src="/opal/logo-reveal.mp4"
                  autoPlay
                  muted
                  playsInline
                  controls={false}
                  preload="auto"
                  onPlay={handleLogoPlaying}
                  onError={() => setLogoFailed(true)}
                  className="h-full w-full object-cover"
                />
                {logoFailed && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src="/logo-app.png"
                    alt="Vion"
                    className="absolute inset-0 m-auto h-40 w-40 object-contain"
                  />
                )}
                {/* Autoplay recusado (ex.: modo economia): o próprio toque
                    aqui é o gesto de usuário que garante o play() em
                    qualquer navegador, sem exceção. */}
                {needsTap && (
                  <button
                    type="button"
                    onClick={handleTapToPlay}
                    aria-label="Tocar para continuar"
                    className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/40"
                  >
                    <span className="flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
                      <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-white">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/80">Toque para continuar</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Só monta pra quem já tem conta: a pedra é a recompensa de quem
              chega logado. Sem sessão nem baixa o vídeo (preload="auto"
              puxaria o arquivo inteiro à toa pra quem nunca vai vê-lo). Uma
              vez montado, fica sempre no DOM (só invisível fora do reveal)
              pra carregar cedo. No "pullback" a câmera recua: a gema encolhe
              e sobe até onde ela fica no hero da Home, e o overlay some por
              cima disso, dando sensação de continuidade, não de troca de tela. */}
          {isLoggedIn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 0 }}
              animate={
                pulling
                  ? { opacity: 1, scale: 0.42, y: -190 }
                  : { opacity: showingStone ? 1 : 0, scale: 1, y: 0 }
              }
              transition={{ duration: pulling ? 1 : 0.5, ease: [0.16, 1, 0.3, 1] }}
              // Vídeo em formato celular (9:16, igual ao da logo): container
              // vertical em vez de quadrado, pra não sobrar letterbox lateral.
              className="relative z-10 aspect-[9/16] w-[min(80vw,320px)]"
            >
              <video
                ref={stoneVideoRef}
                src="/opal/reveal.mp4"
                // O poster é a rocha fechada: é o primeiro quadro do vídeo, então
                // a espera pelo carregamento não mostra nada fora de lugar.
                poster="/opal/stage-0.webp"
                muted
                playsInline
                controls={false}
                preload="auto"
                onError={() => setStoneFailed(true)}
                className="h-full w-full object-contain"
                // mix-blend-mode: screen soma a luz do vídeo com o preto do fundo
                // da splash (bg-black): preto vira transparente na prática (screen
                // com preto = identidade), sobra só o brilho da pedra/orb. Diferente
                // da máscara radial anterior, isso não depende de "acertar" um raio
                // de corte contra o conteúdo do vídeo: qualquer região preta do
                // vídeo simplesmente some, sem aresta nenhuma. Exige fundo do vídeo
                // preto/bem escuro (é o caso); sobre fundo colorido isso não some.
                style={{ mixBlendMode: "screen" }}
              />
              {/* Fallback SÓ em caso de falha real (codec indisponível, autoplay
                  bloqueado). Antes ele entrava enquanto o vídeo carregava, e como
                  era a gema pronta, a abertura mostrava a gema, apagava, e só
                  então começava pela rocha: parecia um bug de renderização. */}
              {stoneFailed && (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src="/opal/stage-3.webp"
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full object-contain"
                />
              )}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
