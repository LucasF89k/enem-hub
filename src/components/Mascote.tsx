/**
 * Mascote da Vion — menino 3D de moletom preto com o "V" da Vion.
 *
 * Usa a sheet de poses (public/mascote/sheet.png) e recorta a área certa
 * via CSS background-position, enquanto os PNGs individuais cortados não
 * chegam do designer.
 *
 * Coordenadas mapeadas visualmente sobre a sheet (1024×779 px):
 *   Row "Poses Principais" começa em y≈310, altura ≈200px
 *   Cada coluna tem ~165px de largura, com ~10px de gutter
 *
 * Quando receber os PNGs individuais, substituir o background pelo <img>
 * correspondente e remover o recorte.
 */

// Dimensões naturais da sheet
const SW = 1024
const SH = 779

type Pose =
  | "confiante"    // apontando pro futuro
  | "aprovando"    // joinha / thumbs up
  | "estudando"    // com notebook
  | "ideia"        // lâmpada / planejamento
  | "conquista"    // punho levantado
  | "relaxado"     // mãos atrás da cabeça
  | "normal"       // rosto / expressão neutra
  | "sorriso"      // rosto sorrindo

/** [x, y, w, h] em pixels dentro da sheet 1024×779 */
const CROPS: Record<Pose, [number, number, number, number]> = {
  confiante: [20,  308, 155, 195],
  aprovando: [185, 308, 155, 195],
  estudando: [350, 308, 165, 195],
  ideia:     [520, 308, 165, 195],
  conquista: [688, 308, 165, 195],
  relaxado:  [855, 308, 165, 195],
  normal:    [15,  518, 100, 125],
  sorriso:   [120, 518, 100, 125],
}

interface Props {
  pose?: Pose
  size?: number        // tamanho final quadrado em px
  className?: string
}

export function Mascote({ pose = "confiante", size = 80, className = "" }: Props) {
  const [cx, cy, cw, ch] = CROPS[pose]

  // Escala: queremos que o recorte (cw × ch) ocupe `size` px
  const scaleX = size / cw
  const scaleY = size / ch
  // Usamos a maior escala pra não deixar borda vazia
  const scale = Math.max(scaleX, scaleY)

  const bgW = Math.round(SW * scale)
  const bgH = Math.round(SH * scale)
  const bgX = -Math.round(cx * scale)
  const bgY = -Math.round(cy * scale)

  return (
    <span
      className={`inline-block shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        backgroundImage: "url(/mascote/sheet.png)",
        backgroundSize: `${bgW}px ${bgH}px`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundRepeat: "no-repeat",
        imageRendering: "auto",
      }}
      role="img"
      aria-label={`Mascote Vion — pose ${pose}`}
    />
  )
}
