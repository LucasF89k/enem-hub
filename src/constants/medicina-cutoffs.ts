export interface FaculdadeMedicina {
  nome: string
  sigla: string
  estado: string
  tipo: "federal" | "estadual" | "particular"
  notaCorte2024: number
  vagas: number
}

export const TOP_FACULDADES_MEDICINA: FaculdadeMedicina[] = [
  { nome: "USP - Ribeirão Preto", sigla: "USP-RP", estado: "SP", tipo: "estadual", notaCorte2024: 848.92, vagas: 80 },
  { nome: "UNICAMP", sigla: "UNICAMP", estado: "SP", tipo: "estadual", notaCorte2024: 841.56, vagas: 80 },
  { nome: "USP - São Paulo", sigla: "USP-SP", estado: "SP", tipo: "estadual", notaCorte2024: 838.74, vagas: 90 },
  { nome: "UFRJ", sigla: "UFRJ", estado: "RJ", tipo: "federal", notaCorte2024: 832.18, vagas: 80 },
  { nome: "UFMG", sigla: "UFMG", estado: "MG", tipo: "federal", notaCorte2024: 829.45, vagas: 120 },
  { nome: "UNIFESP", sigla: "UNIFESP", estado: "SP", tipo: "federal", notaCorte2024: 826.33, vagas: 90 },
  { nome: "UFRGS", sigla: "UFRGS", estado: "RS", tipo: "federal", notaCorte2024: 823.61, vagas: 120 },
  { nome: "UFSC", sigla: "UFSC", estado: "SC", tipo: "federal", notaCorte2024: 820.87, vagas: 100 },
  { nome: "UFC", sigla: "UFC", estado: "CE", tipo: "federal", notaCorte2024: 818.22, vagas: 100 },
  { nome: "UFPE", sigla: "UFPE", estado: "PE", tipo: "federal", notaCorte2024: 815.44, vagas: 100 },
  { nome: "UnB", sigla: "UnB", estado: "DF", tipo: "federal", notaCorte2024: 813.77, vagas: 90 },
  { nome: "UFPR", sigla: "UFPR", estado: "PR", tipo: "federal", notaCorte2024: 811.09, vagas: 100 },
  { nome: "UFBA", sigla: "UFBA", estado: "BA", tipo: "federal", notaCorte2024: 809.58, vagas: 90 },
  { nome: "UNESP - Botucatu", sigla: "UNESP", estado: "SP", tipo: "estadual", notaCorte2024: 807.33, vagas: 80 },
  { nome: "UFPB", sigla: "UFPB", estado: "PB", tipo: "federal", notaCorte2024: 805.11, vagas: 90 },
  { nome: "UFJF", sigla: "UFJF", estado: "MG", tipo: "federal", notaCorte2024: 803.44, vagas: 80 },
  { nome: "UFF", sigla: "UFF", estado: "RJ", tipo: "federal", notaCorte2024: 801.87, vagas: 80 },
  { nome: "UFAM", sigla: "UFAM", estado: "AM", tipo: "federal", notaCorte2024: 799.22, vagas: 70 },
  { nome: "UFG", sigla: "UFG", estado: "GO", tipo: "federal", notaCorte2024: 797.65, vagas: 80 },
  { nome: "UFES", sigla: "UFES", estado: "ES", tipo: "federal", notaCorte2024: 795.44, vagas: 80 },
]
