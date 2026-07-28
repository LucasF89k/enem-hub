// Base de universidades brasileiras com índice de seletividade (prestigio 0–100).
// A nota de corte por curso é ESTIMADA combinando este índice com a faixa do curso
// (ver cursos.ts) — modelo transparente, sem inventar número por célula.

export type TipoIES = "federal" | "estadual" | "municipal" | "particular"

export interface Universidade {
  id: string
  sigla: string
  nome: string
  cidade: string
  uf: string
  tipo: TipoIES
  /** seletividade geral (0–100) */
  prestigio: number
  /** se presente, a IES só oferece estes cursos (slug) — ex.: escolas de Medicina */
  cursos?: string[]
  /** se presente, restringe às áreas (ver cursos.ts) — ex.: ITA/IME (engenharias) */
  areas?: string[]
}

function u(
  sigla: string,
  nome: string,
  cidade: string,
  uf: string,
  tipo: TipoIES,
  prestigio: number,
  extra?: { cursos?: string[]; areas?: string[] },
): Universidade {
  const id = `${sigla}-${cidade}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return { id, sigla, nome, cidade, uf, tipo, prestigio, ...extra }
}

export const UNIVERSIDADES: Universidade[] = [
  // Federais e estaduais de amplo espectro
  u("USP", "Universidade de São Paulo", "São Paulo", "SP", "estadual", 100),
  u("UNICAMP", "Univ. Estadual de Campinas", "Campinas", "SP", "estadual", 97),
  u("UNIFESP", "Univ. Federal de São Paulo", "São Paulo", "SP", "federal", 90),
  u("UNESP", "Univ. Estadual Paulista", "São Paulo", "SP", "estadual", 88),
  u("UFMG", "Univ. Federal de Minas Gerais", "Belo Horizonte", "MG", "federal", 92),
  u("UFRJ", "Univ. Federal do Rio de Janeiro", "Rio de Janeiro", "RJ", "federal", 92),
  u("UFRGS", "Univ. Federal do Rio Grande do Sul", "Porto Alegre", "RS", "federal", 90),
  u("UnB", "Universidade de Brasília", "Brasília", "DF", "federal", 85),
  u("UFSC", "Univ. Federal de Santa Catarina", "Florianópolis", "SC", "federal", 85),
  u("UFPR", "Univ. Federal do Paraná", "Curitiba", "PR", "federal", 83),
  u("UFPE", "Univ. Federal de Pernambuco", "Recife", "PE", "federal", 82),
  u("UFC", "Univ. Federal do Ceará", "Fortaleza", "CE", "federal", 80),
  u("UFBA", "Univ. Federal da Bahia", "Salvador", "BA", "federal", 78),
  u("UFF", "Univ. Federal Fluminense", "Niterói", "RJ", "federal", 78),
  u("UERJ", "Univ. do Estado do Rio de Janeiro", "Rio de Janeiro", "RJ", "estadual", 80),
  u("UFSCar", "Univ. Federal de São Carlos", "São Carlos", "SP", "federal", 82),
  u("UFABC", "Univ. Federal do ABC", "Santo André", "SP", "federal", 80),
  u("UFU", "Univ. Federal de Uberlândia", "Uberlândia", "MG", "federal", 74),
  u("UFJF", "Univ. Federal de Juiz de Fora", "Juiz de Fora", "MG", "federal", 70),
  u("UFV", "Univ. Federal de Viçosa", "Viçosa", "MG", "federal", 76),
  u("UFOP", "Univ. Federal de Ouro Preto", "Ouro Preto", "MG", "federal", 68),
  u("UFG", "Univ. Federal de Goiás", "Goiânia", "GO", "federal", 75),
  u("UFES", "Univ. Federal do Espírito Santo", "Vitória", "ES", "federal", 72),
  u("UFRN", "Univ. Fed. do Rio Grande do Norte", "Natal", "RN", "federal", 72),
  u("UFPB", "Univ. Federal da Paraíba", "João Pessoa", "PB", "federal", 70),
  u("UFCG", "Univ. Federal de Campina Grande", "Campina Grande", "PB", "federal", 66),
  u("UFPA", "Univ. Federal do Pará", "Belém", "PA", "federal", 68),
  u("UFAM", "Univ. Federal do Amazonas", "Manaus", "AM", "federal", 66),
  u("UFMA", "Univ. Federal do Maranhão", "São Luís", "MA", "federal", 62),
  u("UFPI", "Univ. Federal do Piauí", "Teresina", "PI", "federal", 62),
  u("UFAL", "Univ. Federal de Alagoas", "Maceió", "AL", "federal", 63),
  u("UFS", "Univ. Federal de Sergipe", "Aracaju", "SE", "federal", 63),
  u("UFMT", "Univ. Federal de Mato Grosso", "Cuiabá", "MT", "federal", 62),
  u("UFMS", "Univ. Fed. de Mato Grosso do Sul", "Campo Grande", "MS", "federal", 63),
  u("UFSM", "Univ. Federal de Santa Maria", "Santa Maria", "RS", "federal", 72),
  u("UFPEL", "Univ. Federal de Pelotas", "Pelotas", "RS", "federal", 66),
  u("FURG", "Univ. Federal do Rio Grande", "Rio Grande", "RS", "federal", 62),
  u("UTFPR", "Univ. Tecnológica Federal do PR", "Curitiba", "PR", "federal", 74, { areas: ["exatas", "engenharias", "tecnologia"] }),
  u("UEL", "Univ. Estadual de Londrina", "Londrina", "PR", "estadual", 74),
  u("UEM", "Univ. Estadual de Maringá", "Maringá", "PR", "estadual", 73),
  u("UEPG", "Univ. Estadual de Ponta Grossa", "Ponta Grossa", "PR", "estadual", 66),
  u("UEFS", "Univ. Estadual de Feira de Santana", "Feira de Santana", "BA", "estadual", 60),
  u("UEA", "Univ. do Estado do Amazonas", "Manaus", "AM", "estadual", 64),
  u("UEPA", "Univ. do Estado do Pará", "Belém", "PA", "estadual", 60),
  u("UFT", "Univ. Federal do Tocantins", "Palmas", "TO", "federal", 60),
  u("UNIFAP", "Univ. Federal do Amapá", "Macapá", "AP", "federal", 58),
  u("UFRR", "Univ. Federal de Roraima", "Boa Vista", "RR", "federal", 58),
  u("UNIR", "Univ. Federal de Rondônia", "Porto Velho", "RO", "federal", 58),
  u("UFAC", "Univ. Federal do Acre", "Rio Branco", "AC", "federal", 58),

  // Especializadas (área restrita)
  u("ITA", "Instituto Tecnológico de Aeronáutica", "São José dos Campos", "SP", "federal", 100, { areas: ["engenharias", "exatas", "tecnologia"] }),
  u("IME", "Instituto Militar de Engenharia", "Rio de Janeiro", "RJ", "federal", 98, { areas: ["engenharias", "exatas", "tecnologia"] }),
  u("FGV", "Fundação Getulio Vargas", "São Paulo", "SP", "particular", 90, { areas: ["negocios", "direito", "sociais"] }),
  u("INSPER", "Insper", "São Paulo", "SP", "particular", 84, { areas: ["negocios", "engenharias", "direito"] }),

  // Escolas de Medicina (somente Medicina)
  u("ESCS", "Escola Superior de Ciências da Saúde", "Brasília", "DF", "estadual", 84, { cursos: ["medicina"] }),
  u("FAMEMA", "Fac. de Medicina de Marília", "Marília", "SP", "estadual", 82, { cursos: ["medicina"] }),
  u("FAMERP", "Fac. de Medicina de São José do Rio Preto", "São José do Rio Preto", "SP", "estadual", 82, { cursos: ["medicina"] }),
  u("UFCSPA", "Univ. Fed. Ciências da Saúde de POA", "Porto Alegre", "RS", "federal", 82, { cursos: ["medicina", "enfermagem", "farmacia", "biomedicina", "fisioterapia", "nutricao"] }),
  u("EINSTEIN", "Fac. Israelita Albert Einstein", "São Paulo", "SP", "particular", 85, { cursos: ["medicina", "enfermagem"] }),
  u("SANTACASA-SP", "Santa Casa de São Paulo", "São Paulo", "SP", "particular", 78, { cursos: ["medicina"] }),

  // Particulares de amplo espectro (referência ProUni/vestibular próprio)
  u("PUC-SP", "PUC de São Paulo", "São Paulo", "SP", "particular", 74),
  u("PUC-RJ", "PUC do Rio de Janeiro", "Rio de Janeiro", "RJ", "particular", 76),
  u("PUC-RS", "PUC do Rio Grande do Sul", "Porto Alegre", "RS", "particular", 66),
  u("PUC-MG", "PUC de Minas Gerais", "Belo Horizonte", "MG", "particular", 66),
  u("PUC-PR", "PUC do Paraná", "Curitiba", "PR", "particular", 64),
  u("MACKENZIE", "Univ. Presbiteriana Mackenzie", "São Paulo", "SP", "particular", 68),
  u("UNISINOS", "Univ. do Vale do Rio dos Sinos", "São Leopoldo", "RS", "particular", 62),
]

export const TIPO_LABEL: Record<TipoIES, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  particular: "Particular",
}

export function findUniversidade(idOrSigla?: string | null): Universidade | undefined {
  if (!idOrSigla) return undefined
  const v = idOrSigla.trim()
  return (
    UNIVERSIDADES.find((x) => x.id === v) ??
    UNIVERSIDADES.find((x) => x.sigla.toLowerCase() === v.toLowerCase())
  )
}

/** Universidades que oferecem o curso (respeita whitelists de curso/área). */
export function universidadesDoCurso(cursoSlug: string, area: string): Universidade[] {
  return UNIVERSIDADES.filter((x) => {
    if (x.cursos && !x.cursos.includes(cursoSlug)) return false
    if (x.areas && !x.areas.includes(area)) return false
    return true
  })
}
