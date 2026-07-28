// Base de cursos de graduação com faixa de nota de corte (ampla concorrência, referência 2024).
// A nota por universidade é estimada: min + (max-min) * prestigio/100 (ver universidades.ts).

import type { Universidade } from "./universidades"

export type AreaCurso =
  | "saude"
  | "engenharias"
  | "exatas"
  | "tecnologia"
  | "biologicas"
  | "agrarias"
  | "humanas"
  | "sociais"
  | "direito"
  | "negocios"
  | "comunicacao"
  | "artes"

export interface Curso {
  slug: string
  nome: string
  area: AreaCurso
  /** faixa de nota de corte (ampla concorrência): [menos seletiva, mais seletiva] */
  min: number
  max: number
}

export const AREA_LABEL: Record<AreaCurso, string> = {
  saude: "Saúde",
  engenharias: "Engenharias",
  exatas: "Ciências Exatas",
  tecnologia: "Tecnologia",
  biologicas: "Ciências Biológicas",
  agrarias: "Ciências Agrárias",
  humanas: "Humanas",
  sociais: "Ciências Sociais",
  direito: "Direito",
  negocios: "Negócios",
  comunicacao: "Comunicação",
  artes: "Artes",
}

export const CURSOS: Curso[] = [
  // Saúde
  { slug: "medicina", nome: "Medicina", area: "saude", min: 760, max: 850 },
  { slug: "odontologia", nome: "Odontologia", area: "saude", min: 680, max: 780 },
  { slug: "medicina-veterinaria", nome: "Medicina Veterinária", area: "saude", min: 650, max: 760 },
  { slug: "enfermagem", nome: "Enfermagem", area: "saude", min: 600, max: 720 },
  { slug: "farmacia", nome: "Farmácia", area: "saude", min: 620, max: 730 },
  { slug: "fisioterapia", nome: "Fisioterapia", area: "saude", min: 630, max: 740 },
  { slug: "nutricao", nome: "Nutrição", area: "saude", min: 600, max: 710 },
  { slug: "psicologia", nome: "Psicologia", area: "saude", min: 640, max: 760 },
  { slug: "biomedicina", nome: "Biomedicina", area: "saude", min: 630, max: 740 },
  { slug: "fonoaudiologia", nome: "Fonoaudiologia", area: "saude", min: 580, max: 690 },
  { slug: "terapia-ocupacional", nome: "Terapia Ocupacional", area: "saude", min: 580, max: 690 },
  { slug: "educacao-fisica", nome: "Educação Física", area: "saude", min: 560, max: 700 },

  // Direito & Negócios
  { slug: "direito", nome: "Direito", area: "direito", min: 660, max: 800 },
  { slug: "administracao", nome: "Administração", area: "negocios", min: 600, max: 740 },
  { slug: "ciencias-economicas", nome: "Ciências Econômicas", area: "negocios", min: 620, max: 780 },
  { slug: "ciencias-contabeis", nome: "Ciências Contábeis", area: "negocios", min: 580, max: 700 },
  { slug: "relacoes-internacionais", nome: "Relações Internacionais", area: "sociais", min: 640, max: 790 },
  { slug: "ciencias-atuariais", nome: "Ciências Atuariais", area: "negocios", min: 620, max: 760 },

  // Engenharias
  { slug: "engenharia-civil", nome: "Engenharia Civil", area: "engenharias", min: 640, max: 780 },
  { slug: "engenharia-mecanica", nome: "Engenharia Mecânica", area: "engenharias", min: 640, max: 780 },
  { slug: "engenharia-eletrica", nome: "Engenharia Elétrica", area: "engenharias", min: 650, max: 790 },
  { slug: "engenharia-de-producao", nome: "Engenharia de Produção", area: "engenharias", min: 640, max: 770 },
  { slug: "engenharia-quimica", nome: "Engenharia Química", area: "engenharias", min: 640, max: 770 },
  { slug: "engenharia-de-computacao", nome: "Engenharia de Computação", area: "engenharias", min: 670, max: 810 },
  { slug: "engenharia-aeroespacial", nome: "Engenharia Aeroespacial", area: "engenharias", min: 720, max: 850 },
  { slug: "engenharia-ambiental", nome: "Engenharia Ambiental", area: "engenharias", min: 600, max: 720 },
  { slug: "engenharia-de-materiais", nome: "Engenharia de Materiais", area: "engenharias", min: 620, max: 750 },
  { slug: "engenharia-de-petroleo", nome: "Engenharia de Petróleo", area: "engenharias", min: 660, max: 790 },
  { slug: "engenharia-naval", nome: "Engenharia Naval", area: "engenharias", min: 650, max: 780 },

  // Tecnologia / Exatas
  { slug: "ciencia-da-computacao", nome: "Ciência da Computação", area: "tecnologia", min: 670, max: 820 },
  { slug: "engenharia-de-software", nome: "Engenharia de Software", area: "tecnologia", min: 650, max: 800 },
  { slug: "sistemas-de-informacao", nome: "Sistemas de Informação", area: "tecnologia", min: 620, max: 760 },
  { slug: "matematica", nome: "Matemática", area: "exatas", min: 580, max: 730 },
  { slug: "fisica", nome: "Física", area: "exatas", min: 590, max: 740 },
  { slug: "quimica", nome: "Química", area: "exatas", min: 580, max: 720 },
  { slug: "estatistica", nome: "Estatística", area: "exatas", min: 600, max: 750 },

  // Biológicas / Agrárias
  { slug: "ciencias-biologicas", nome: "Ciências Biológicas", area: "biologicas", min: 600, max: 740 },
  { slug: "biotecnologia", nome: "Biotecnologia", area: "biologicas", min: 630, max: 760 },
  { slug: "agronomia", nome: "Agronomia", area: "agrarias", min: 600, max: 730 },
  { slug: "zootecnia", nome: "Zootecnia", area: "agrarias", min: 560, max: 690 },

  // Arquitetura / Artes / Comunicação
  { slug: "arquitetura-e-urbanismo", nome: "Arquitetura e Urbanismo", area: "artes", min: 640, max: 760 },
  { slug: "design", nome: "Design", area: "artes", min: 590, max: 710 },
  { slug: "publicidade-e-propaganda", nome: "Publicidade e Propaganda", area: "comunicacao", min: 600, max: 720 },
  { slug: "jornalismo", nome: "Jornalismo", area: "comunicacao", min: 610, max: 730 },
  { slug: "cinema-e-audiovisual", nome: "Cinema e Audiovisual", area: "comunicacao", min: 600, max: 720 },
  { slug: "artes-visuais", nome: "Artes Visuais", area: "artes", min: 560, max: 690 },
  { slug: "musica", nome: "Música", area: "artes", min: 560, max: 700 },
  { slug: "artes-cenicas", nome: "Artes Cênicas / Teatro", area: "artes", min: 560, max: 690 },

  // Humanas / Sociais
  { slug: "pedagogia", nome: "Pedagogia", area: "humanas", min: 500, max: 660 },
  { slug: "letras", nome: "Letras", area: "humanas", min: 520, max: 680 },
  { slug: "historia", nome: "História", area: "humanas", min: 560, max: 700 },
  { slug: "geografia", nome: "Geografia", area: "humanas", min: 540, max: 680 },
  { slug: "filosofia", nome: "Filosofia", area: "humanas", min: 560, max: 700 },
  { slug: "ciencias-sociais", nome: "Ciências Sociais", area: "sociais", min: 560, max: 710 },
  { slug: "servico-social", nome: "Serviço Social", area: "sociais", min: 540, max: 660 },
]

export const CURSOS_ORDENADOS = [...CURSOS].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"))

export function findCurso(value?: string | null): Curso | undefined {
  if (!value) return undefined
  const v = value.trim().toLowerCase()
  return (
    CURSOS.find((c) => c.slug === v) ??
    CURSOS.find((c) => c.nome.toLowerCase() === v) ??
    CURSOS.find((c) => c.nome.toLowerCase().includes(v) || v.includes(c.nome.toLowerCase()))
  )
}

/** Nota de corte estimada do curso na universidade (escala ENEM). */
export function estimateCutoff(curso: Curso, uni: Universidade): number {
  return Math.round(curso.min + ((curso.max - curso.min) * uni.prestigio) / 100)
}

/** Nota de corte média/faixa do curso (referência nacional). */
export function cursoMedia(curso: Curso): number {
  return Math.round((curso.min + curso.max) / 2)
}
