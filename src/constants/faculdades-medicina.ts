// Base nacional de faculdades de Medicina (referência SISU/ENEM 2024, ampla concorrência).
// Cobertura: todas as UFs, federais, estaduais/municipais e particulares.
// As notas são de REFERÊNCIA (variam por ano, campus e modalidade de cota).

export type TipoIES = "federal" | "estadual" | "municipal" | "particular"

export interface FaculdadeMed {
  /** id estável (slug), usado para persistir a escolha */
  id: string
  nome: string
  sigla: string
  cidade: string
  estado: string // UF
  tipo: TipoIES
  /** nota de corte de referência (escala ENEM 0-1000, ampla concorrência) */
  notaCorte: number
}

function f(
  sigla: string,
  nome: string,
  cidade: string,
  estado: string,
  tipo: TipoIES,
  notaCorte: number,
): FaculdadeMed {
  const id = `${sigla}-${cidade}`
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return { id, sigla, nome, cidade, estado, tipo, notaCorte }
}

export const FACULDADES_MEDICINA: FaculdadeMed[] = [
  // ---------- SP ----------
  f("USP-SP", "USP - Faculdade de Medicina (FMUSP)", "São Paulo", "SP", "estadual", 848.9),
  f("USP-RP", "USP - Ribeirão Preto", "Ribeirão Preto", "SP", "estadual", 846.1),
  f("UNICAMP", "Universidade Estadual de Campinas", "Campinas", "SP", "estadual", 841.6),
  f("UNIFESP", "Universidade Federal de São Paulo (EPM)", "São Paulo", "SP", "federal", 826.3),
  f("UNESP-BOT", "UNESP - Botucatu", "Botucatu", "SP", "estadual", 824.4),
  f("FAMEMA", "Faculdade de Medicina de Marília", "Marília", "SP", "estadual", 812.0),
  f("FAMERP", "Fac. de Medicina de São José do Rio Preto", "São José do Rio Preto", "SP", "estadual", 810.2),
  f("UFSCar", "Universidade Federal de São Carlos", "São Carlos", "SP", "federal", 806.5),
  f("SANTA-CASA-SP", "Santa Casa de São Paulo", "São Paulo", "SP", "particular", 792.0),
  f("PUC-SP", "PUC de São Paulo (Sorocaba)", "Sorocaba", "SP", "particular", 786.4),
  f("EINSTEIN", "Faculdade Israelita Albert Einstein", "São Paulo", "SP", "particular", 795.0),

  // ---------- RJ ----------
  f("UFRJ", "Universidade Federal do Rio de Janeiro", "Rio de Janeiro", "RJ", "federal", 832.2),
  f("UERJ", "Universidade do Estado do Rio de Janeiro", "Rio de Janeiro", "RJ", "estadual", 818.0),
  f("UFF", "Universidade Federal Fluminense", "Niterói", "RJ", "federal", 812.5),
  f("UNIRIO", "Universidade Federal do Estado do RJ", "Rio de Janeiro", "RJ", "federal", 809.0),
  f("UFRRJ", "Universidade Federal Rural do RJ", "Seropédica", "RJ", "federal", 795.0),
  f("UFF-MACAE", "UFF - Macaé", "Macaé", "RJ", "federal", 792.0),

  // ---------- MG ----------
  f("UFMG", "Universidade Federal de Minas Gerais", "Belo Horizonte", "MG", "federal", 829.5),
  f("UFU", "Universidade Federal de Uberlândia", "Uberlândia", "MG", "federal", 810.0),
  f("UFJF", "Universidade Federal de Juiz de Fora", "Juiz de Fora", "MG", "federal", 803.4),
  f("UFTM", "Univ. Federal do Triângulo Mineiro", "Uberaba", "MG", "federal", 806.0),
  f("UFV", "Universidade Federal de Viçosa", "Viçosa", "MG", "federal", 800.0),
  f("UFSJ", "Univ. Federal de São João del-Rei", "São João del-Rei", "MG", "federal", 796.0),
  f("UFVJM", "Univ. Fed. dos Vales do Jequitinhonha", "Diamantina", "MG", "federal", 788.0),
  f("UNIMONTES", "Univ. Estadual de Montes Claros", "Montes Claros", "MG", "estadual", 790.0),
  f("UFOP", "Universidade Federal de Ouro Preto", "Ouro Preto", "MG", "federal", 794.0),
  f("UNIFAL", "Universidade Federal de Alfenas", "Alfenas", "MG", "federal", 795.0),

  // ---------- ES ----------
  f("UFES", "Universidade Federal do Espírito Santo", "Vitória", "ES", "federal", 795.4),

  // ---------- Sul: RS ----------
  f("UFRGS", "Univ. Federal do Rio Grande do Sul", "Porto Alegre", "RS", "federal", 823.6),
  f("UFCSPA", "Univ. Fed. de Ciências da Saúde de POA", "Porto Alegre", "RS", "federal", 815.0),
  f("UFPEL", "Universidade Federal de Pelotas", "Pelotas", "RS", "federal", 798.0),
  f("FURG", "Univ. Federal do Rio Grande", "Rio Grande", "RS", "federal", 796.0),
  f("UFSM", "Universidade Federal de Santa Maria", "Santa Maria", "RS", "federal", 802.0),
  f("PUCRS", "PUC do Rio Grande do Sul", "Porto Alegre", "RS", "particular", 788.0),

  // ---------- Sul: SC ----------
  f("UFSC", "Univ. Federal de Santa Catarina", "Florianópolis", "SC", "federal", 820.9),
  f("UFFS-SC", "Univ. Fed. da Fronteira Sul", "Chapecó", "SC", "federal", 790.0),

  // ---------- Sul: PR ----------
  f("UFPR", "Universidade Federal do Paraná", "Curitiba", "PR", "federal", 811.1),
  f("UEL", "Universidade Estadual de Londrina", "Londrina", "PR", "estadual", 808.0),
  f("UEM", "Universidade Estadual de Maringá", "Maringá", "PR", "estadual", 806.0),
  f("UEPG", "Univ. Estadual de Ponta Grossa", "Ponta Grossa", "PR", "estadual", 798.0),
  f("UNIOESTE", "Univ. Estadual do Oeste do Paraná", "Cascavel", "PR", "estadual", 796.0),

  // ---------- Centro-Oeste ----------
  f("UnB", "Universidade de Brasília", "Brasília", "DF", "federal", 813.8),
  f("ESCS", "Escola Superior de Ciências da Saúde", "Brasília", "DF", "estadual", 806.0),
  f("UFG", "Universidade Federal de Goiás", "Goiânia", "GO", "federal", 797.7),
  f("UFMS", "Univ. Federal de Mato Grosso do Sul", "Campo Grande", "MS", "federal", 794.0),
  f("UFMT", "Universidade Federal de Mato Grosso", "Cuiabá", "MT", "federal", 792.0),
  f("UFR", "Universidade Federal de Rondonópolis", "Rondonópolis", "MT", "federal", 785.0),
  f("UEMS", "Univ. Estadual de Mato Grosso do Sul", "Campo Grande", "MS", "estadual", 786.0),

  // ---------- Nordeste: BA ----------
  f("UFBA", "Universidade Federal da Bahia", "Salvador", "BA", "federal", 809.6),
  f("UESB", "Univ. Estadual do Sudoeste da Bahia", "Vitória da Conquista", "BA", "estadual", 792.0),
  f("UEFS", "Univ. Estadual de Feira de Santana", "Feira de Santana", "BA", "estadual", 794.0),
  f("UFRB", "Univ. Fed. do Recôncavo da Bahia", "Santo Antônio de Jesus", "BA", "federal", 788.0),
  f("UFOB", "Univ. Fed. do Oeste da Bahia", "Barreiras", "BA", "federal", 782.0),

  // ---------- Nordeste: PE ----------
  f("UFPE", "Universidade Federal de Pernambuco", "Recife", "PE", "federal", 815.4),
  f("UPE", "Universidade de Pernambuco", "Recife", "PE", "estadual", 806.0),
  f("UNIVASF", "Univ. Fed. do Vale do São Francisco", "Petrolina", "PE", "federal", 790.0),

  // ---------- Nordeste: CE ----------
  f("UFC", "Universidade Federal do Ceará", "Fortaleza", "CE", "federal", 818.2),
  f("UFC-SOBRAL", "UFC - Sobral", "Sobral", "CE", "federal", 800.0),
  f("UECE", "Universidade Estadual do Ceará", "Fortaleza", "CE", "estadual", 795.0),

  // ---------- Nordeste: PB ----------
  f("UFPB", "Universidade Federal da Paraíba", "João Pessoa", "PB", "federal", 805.1),
  f("UFCG", "Univ. Federal de Campina Grande", "Campina Grande", "PB", "federal", 796.0),

  // ---------- Nordeste: RN ----------
  f("UFRN", "Univ. Federal do Rio Grande do Norte", "Natal", "RN", "federal", 807.0),
  f("UERN", "Univ. do Estado do Rio Grande do Norte", "Mossoró", "RN", "estadual", 790.0),

  // ---------- Nordeste: AL / SE / PI / MA ----------
  f("UFAL", "Universidade Federal de Alagoas", "Maceió", "AL", "federal", 800.0),
  f("UFS", "Universidade Federal de Sergipe", "Aracaju", "SE", "federal", 799.0),
  f("UFPI", "Universidade Federal do Piauí", "Teresina", "PI", "federal", 796.0),
  f("UESPI", "Universidade Estadual do Piauí", "Teresina", "PI", "estadual", 786.0),
  f("UFMA", "Universidade Federal do Maranhão", "São Luís", "MA", "federal", 795.0),
  f("UEMA", "Universidade Estadual do Maranhão", "Caxias", "MA", "estadual", 782.0),

  // ---------- Norte ----------
  f("UFPA", "Universidade Federal do Pará", "Belém", "PA", "federal", 800.0),
  f("UEPA", "Universidade do Estado do Pará", "Belém", "PA", "estadual", 792.0),
  f("UFAM", "Universidade Federal do Amazonas", "Manaus", "AM", "federal", 799.2),
  f("UEA", "Universidade do Estado do Amazonas", "Manaus", "AM", "estadual", 794.0),
  f("UFT", "Universidade Federal do Tocantins", "Palmas", "TO", "federal", 790.0),
  f("UFAC", "Universidade Federal do Acre", "Rio Branco", "AC", "federal", 785.0),
  f("UNIR", "Universidade Federal de Rondônia", "Porto Velho", "RO", "federal", 786.0),
  f("UFRR", "Universidade Federal de Roraima", "Boa Vista", "RR", "federal", 784.0),
  f("UNIFAP", "Universidade Federal do Amapá", "Macapá", "AP", "federal", 785.0),

  // ---------- Particulares de destaque (ProUni/vestibular próprio) ----------
  f("PUC-PR", "PUC do Paraná", "Curitiba", "PR", "particular", 780.0),
  f("PUC-CAMP", "PUC de Campinas", "Campinas", "SP", "particular", 778.0),
  f("PUC-MG", "PUC de Minas Gerais", "Belo Horizonte", "MG", "particular", 776.0),
  f("PUC-RJ", "PUC do Rio de Janeiro", "Rio de Janeiro", "RJ", "particular", 782.0),
  f("PUC-GO", "PUC de Goiás", "Goiânia", "GO", "particular", 772.0),
  f("UNISINOS", "Universidade do Vale do Rio dos Sinos", "São Leopoldo", "RS", "particular", 770.0),
  f("MACKENZIE", "Universidade Presbiteriana Mackenzie", "São Paulo", "SP", "particular", 774.0),
  f("UNIFOR", "Universidade de Fortaleza", "Fortaleza", "CE", "particular", 770.0),
  f("BAHIANA", "Escola Bahiana de Medicina e Saúde Pública", "Salvador", "BA", "particular", 772.0),
  f("FCMSCSP", "Fac. Ciências Médicas Santa Casa SP", "São Paulo", "SP", "particular", 788.0),
  f("SUPREMA", "Faculdade de Ciências Médicas de JF", "Juiz de Fora", "MG", "particular", 760.0),
  f("UNIME", "UniFTC / grupos particulares", "Salvador", "BA", "particular", 758.0),
]

// Ordena por nota de corte (desc) para uso em rankings.
export const FACULDADES_MEDICINA_RANK = [...FACULDADES_MEDICINA].sort(
  (a, b) => b.notaCorte - a.notaCorte,
)

/** Rótulo exibido no seletor e persistido no perfil. */
export function faculdadeLabel(f: FaculdadeMed): string {
  return `${f.sigla} - ${f.nome} (${f.cidade}/${f.estado})`
}

/** Busca por id, sigla ou rótulo salvo (tolerante a formatos antigos). */
export function findFaculdade(value?: string | null): FaculdadeMed | undefined {
  if (!value) return undefined
  const v = value.trim()
  return (
    FACULDADES_MEDICINA.find((f) => f.id === v) ??
    FACULDADES_MEDICINA.find((f) => faculdadeLabel(f) === v) ??
    FACULDADES_MEDICINA.find((f) => f.sigla.toLowerCase() === v.toLowerCase()) ??
    FACULDADES_MEDICINA.find((f) => v.toLowerCase().startsWith(f.sigla.toLowerCase()))
  )
}

export const TIPO_LABEL: Record<TipoIES, string> = {
  federal: "Federal",
  estadual: "Estadual",
  municipal: "Municipal",
  particular: "Particular",
}
