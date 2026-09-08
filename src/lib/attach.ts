// Helpers de anexo (client-side) para o Mentor: imagem (redimensionada) ou PDF.

export const ATTACH_ACCEPT = "image/*,application/pdf"

function readDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Converte um arquivo (foto ou PDF) num data URL pronto pro Mentor.
 * Imagens são redimensionadas (máx 1024px, JPEG) para caber na requisição;
 * PDFs vão como estão. Retorna null se o tipo não for suportado.
 */
export async function fileToAttachment(file: File | undefined | null): Promise<string | null> {
  if (!file) return null

  if (file.type === "application/pdf") {
    return readDataURL(file)
  }

  if (!file.type.startsWith("image/")) return null

  const dataUrl = await readDataURL(file)
  const img = new window.Image()
  await new Promise<void>((resolve, reject) => {
    img.onload = () => resolve()
    img.onerror = reject
    img.src = dataUrl
  })

  const max = 1024
  let { width, height } = img
  if (width > max || height > max) {
    const scale = Math.min(max / width, max / height)
    width = Math.round(width * scale)
    height = Math.round(height * scale)
  }

  const canvas = document.createElement("canvas")
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext("2d")
  if (!ctx) return dataUrl
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL("image/jpeg", 0.82)
}

export function isImageDataUrl(url: string | undefined | null): boolean {
  return !!url && url.startsWith("data:image/")
}

/** Prompt de correção de redação no padrão ENEM (corretor profissional). */
export const REDACAO_CORRECTION_PROMPT = `Corrija esta redação do ENEM (está na imagem/arquivo em anexo) como um corretor profissional.

1. Primeiro, transcreva o texto manuscrito exatamente como está.
2. Depois avalie as 5 competências do ENEM, dando uma nota de 0 a 200 em cada uma:
   - C1: Domínio da norma culta da língua escrita (gramática, ortografia, pontuação).
   - C2: Compreensão do tema e aplicação da estrutura dissertativo-argumentativa (não fugir do tema, não copiar os textos motivadores).
   - C3: Seleção, relação e organização de argumentos e informações (repertório sociocultural produtivo).
   - C4: Conhecimento dos mecanismos linguísticos de coesão (conectivos, coesão referencial).
   - C5: Proposta de intervenção que respeite os direitos humanos (com agente, ação, meio, finalidade e detalhamento).
3. Some as competências e dê a NOTA FINAL (0 a 1000).
4. Liste os erros específicos encontrados (com trechos) e como corrigir cada um.
5. Termine com 2-3 dicas objetivas para subir a nota.

Seja rigoroso e use os critérios reais do ENEM.`

/** Prompt para o Mentor transcrever uma foto de um plano de estudos em papel. */
export const PLANO_FOLHA_PROMPT = `Tenho um plano/cronograma de estudos pronto nesta foto. Transcreva ele fielmente, dia a dia, mantendo as mesmas matérias e atividades, e depois gere o plano estruturado (bloco vion-plano-folha) para eu aplicar no meu Planner. Não precisa me fazer perguntas, é só copiar o que está na folha.`
