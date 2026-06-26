import { type PrismaClient, AchievementCategory } from "@prisma/client"

interface AchievementSeed {
  name: string
  description: string
  icon: string
  xpReward: number
  category: AchievementCategory
  condition: object
  isHidden?: boolean
}

const achievements: AchievementSeed[] = [
  // ── STREAK (7) ────────────────────────────────────────────
  {
    name: "Consistente",
    description: "Estude por 3 dias consecutivos",
    icon: "🔥",
    xpReward: 50,
    category: AchievementCategory.STREAK,
    condition: { type: "streak", value: 3 },
  },
  {
    name: "Uma Semana Forte",
    description: "Mantenha um streak de 7 dias",
    icon: "⚡",
    xpReward: 100,
    category: AchievementCategory.STREAK,
    condition: { type: "streak", value: 7 },
  },
  {
    name: "Duas Semanas",
    description: "Mantenha um streak de 14 dias",
    icon: "💪",
    xpReward: 200,
    category: AchievementCategory.STREAK,
    condition: { type: "streak", value: 14 },
  },
  {
    name: "Mês Dedicado",
    description: "Mantenha um streak de 30 dias",
    icon: "🏆",
    xpReward: 500,
    category: AchievementCategory.STREAK,
    condition: { type: "streak", value: 30 },
  },
  {
    name: "Dois Meses",
    description: "Mantenha um streak de 60 dias",
    icon: "🌟",
    xpReward: 1000,
    category: AchievementCategory.STREAK,
    condition: { type: "streak", value: 60 },
  },
  {
    name: "Cem Dias",
    description: "Mantenha um streak de 100 dias consecutivos",
    icon: "💯",
    xpReward: 2000,
    category: AchievementCategory.STREAK,
    condition: { type: "streak", value: 100 },
  },
  {
    name: "Um Ano de Estudos",
    description: "Mantenha um streak incrível de 365 dias",
    icon: "👑",
    xpReward: 10000,
    category: AchievementCategory.STREAK,
    condition: { type: "streak", value: 365 },
    isHidden: true,
  },

  // ── STUDY (6) ────────────────────────────────────────────
  {
    name: "Primeira Hora",
    description: "Complete 1 hora total de estudos",
    icon: "📚",
    xpReward: 30,
    category: AchievementCategory.STUDY,
    condition: { type: "studyMinutes", value: 60 },
  },
  {
    name: "Dez Horas",
    description: "Complete 10 horas totais de estudos",
    icon: "📖",
    xpReward: 100,
    category: AchievementCategory.STUDY,
    condition: { type: "studyMinutes", value: 600 },
  },
  {
    name: "Cinquenta Horas",
    description: "Complete 50 horas totais de estudos",
    icon: "🎯",
    xpReward: 300,
    category: AchievementCategory.STUDY,
    condition: { type: "studyMinutes", value: 3000 },
  },
  {
    name: "Cem Horas",
    description: "Complete 100 horas totais de estudos",
    icon: "🧠",
    xpReward: 600,
    category: AchievementCategory.STUDY,
    condition: { type: "studyMinutes", value: 6000 },
  },
  {
    name: "Quinhentas Horas",
    description: "Complete 500 horas totais de estudos",
    icon: "🎓",
    xpReward: 2000,
    category: AchievementCategory.STUDY,
    condition: { type: "studyMinutes", value: 30000 },
  },
  {
    name: "Mil Horas",
    description: "Complete 1000 horas totais de estudos — nível elite",
    icon: "⭐",
    xpReward: 5000,
    category: AchievementCategory.STUDY,
    condition: { type: "studyMinutes", value: 60000 },
    isHidden: true,
  },

  // ── QUESTIONS (6) ────────────────────────────────────────
  {
    name: "Primeira Questão",
    description: "Responda sua primeira questão",
    icon: "❓",
    xpReward: 20,
    category: AchievementCategory.QUESTIONS,
    condition: { type: "questionsAnswered", value: 1 },
  },
  {
    name: "Dez Questões",
    description: "Responda 10 questões",
    icon: "🔟",
    xpReward: 50,
    category: AchievementCategory.QUESTIONS,
    condition: { type: "questionsAnswered", value: 10 },
  },
  {
    name: "Cinquenta Questões",
    description: "Responda 50 questões",
    icon: "📝",
    xpReward: 150,
    category: AchievementCategory.QUESTIONS,
    condition: { type: "questionsAnswered", value: 50 },
  },
  {
    name: "Cem Questões",
    description: "Responda 100 questões",
    icon: "💡",
    xpReward: 300,
    category: AchievementCategory.QUESTIONS,
    condition: { type: "questionsAnswered", value: 100 },
  },
  {
    name: "Quinhentas Questões",
    description: "Responda 500 questões",
    icon: "🎯",
    xpReward: 1000,
    category: AchievementCategory.QUESTIONS,
    condition: { type: "questionsAnswered", value: 500 },
  },
  {
    name: "Mil Questões",
    description: "Responda 1000 questões — verdadeiro maratonista",
    icon: "🏅",
    xpReward: 3000,
    category: AchievementCategory.QUESTIONS,
    condition: { type: "questionsAnswered", value: 1000 },
    isHidden: true,
  },

  // ── FLASHCARDS (4) ───────────────────────────────────────
  {
    name: "Primeiro Card",
    description: "Revise seu primeiro flashcard",
    icon: "🃏",
    xpReward: 20,
    category: AchievementCategory.FLASHCARDS,
    condition: { type: "flashcardsReviewed", value: 1 },
  },
  {
    name: "Cinquenta Reviews",
    description: "Revise 50 flashcards",
    icon: "🔄",
    xpReward: 100,
    category: AchievementCategory.FLASHCARDS,
    condition: { type: "flashcardsReviewed", value: 50 },
  },
  {
    name: "Duzentos Reviews",
    description: "Revise 200 flashcards",
    icon: "🧩",
    xpReward: 400,
    category: AchievementCategory.FLASHCARDS,
    condition: { type: "flashcardsReviewed", value: 200 },
  },
  {
    name: "Quinhentos Reviews",
    description: "Revise 500 flashcards — memória de ferro",
    icon: "🔮",
    xpReward: 1000,
    category: AchievementCategory.FLASHCARDS,
    condition: { type: "flashcardsReviewed", value: 500 },
    isHidden: true,
  },

  // ── SIMULADO (3) ─────────────────────────────────────────
  {
    name: "Primeiro Simulado",
    description: "Complete seu primeiro simulado",
    icon: "📋",
    xpReward: 100,
    category: AchievementCategory.SIMULADO,
    condition: { type: "simuladosCompleted", value: 1 },
  },
  {
    name: "Cinco Simulados",
    description: "Complete 5 simulados",
    icon: "📊",
    xpReward: 300,
    category: AchievementCategory.SIMULADO,
    condition: { type: "simuladosCompleted", value: 5 },
  },
  {
    name: "Nota 900+",
    description: "Tire 900 ou mais num simulado completo",
    icon: "🏥",
    xpReward: 2000,
    category: AchievementCategory.SIMULADO,
    condition: { type: "simuladoScore", value: 900 },
    isHidden: true,
  },

  // ── SCORE (2) ────────────────────────────────────────────
  {
    name: "Meta 800",
    description: "Sua nota estimada atingiu 800 pontos",
    icon: "📈",
    xpReward: 500,
    category: AchievementCategory.SCORE,
    condition: { type: "estimatedScore", value: 800 },
  },
  {
    name: "Meta Medicina",
    description: "Sua nota estimada atingiu 900+ pontos",
    icon: "⚕️",
    xpReward: 1000,
    category: AchievementCategory.SCORE,
    condition: { type: "estimatedScore", value: 900 },
    isHidden: true,
  },

  // ── SPECIAL (2) ──────────────────────────────────────────
  {
    name: "Coruja Noturna",
    description: "Estudou após as 23h",
    icon: "🦉",
    xpReward: 50,
    category: AchievementCategory.SPECIAL,
    condition: { type: "studyHour", afterHour: 23 },
    isHidden: true,
  },
  {
    name: "Madrugador",
    description: "Estudou antes das 6h",
    icon: "🌅",
    xpReward: 50,
    category: AchievementCategory.SPECIAL,
    condition: { type: "studyHour", beforeHour: 6 },
    isHidden: true,
  },
]

export async function seedAchievements(prisma: PrismaClient) {
  console.log("  Seeding achievements...")

  // Remove achievements existentes e recria
  await prisma.userAchievement.deleteMany({})
  await prisma.achievement.deleteMany({})

  for (const a of achievements) {
    await prisma.achievement.create({
      data: {
        name: a.name,
        description: a.description,
        icon: a.icon,
        xpReward: a.xpReward,
        category: a.category,
        condition: JSON.stringify(a.condition),
        isHidden: a.isHidden ?? false,
      },
    })
  }

  console.log(`  ✓ ${achievements.length} achievements criados`)
}
