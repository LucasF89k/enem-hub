import { db } from "@/lib/db"
import { awardXP } from "@/lib/xp"
import { AchievementCategory } from "@prisma/client"

export interface AchievementDef {
  key: string
  name: string
  description: string
  icon: string
  xpReward: number
  category: AchievementCategory
  isHidden?: boolean
  check: (stats: UserStats) => boolean
}

export interface UserStats {
  streak: number
  totalStudyMinutes: number
  totalQuestions: number
  correctQuestions: number
  totalFlashcards: number
  totalSimulados: number
  totalEssays: number
  bestSimuladoScore: number
  totalXP: number
  currentLevel: number
}

export const ACHIEVEMENT_DEFS: AchievementDef[] = [
  // STREAK
  {
    key: "streak_3",
    name: "Consistente",
    description: "3 dias seguidos de estudo",
    icon: "🔥",
    xpReward: 50,
    category: "STREAK",
    check: (s) => s.streak >= 3,
  },
  {
    key: "streak_7",
    name: "Semana Completa",
    description: "7 dias seguidos de estudo",
    icon: "📅",
    xpReward: 150,
    category: "STREAK",
    check: (s) => s.streak >= 7,
  },
  {
    key: "streak_30",
    name: "Mês Dedicado",
    description: "30 dias seguidos de estudo",
    icon: "🏆",
    xpReward: 500,
    category: "STREAK",
    check: (s) => s.streak >= 30,
  },
  {
    key: "streak_100",
    name: "Centenário",
    description: "100 dias seguidos de estudo",
    icon: "💯",
    xpReward: 2000,
    category: "STREAK",
    isHidden: true,
    check: (s) => s.streak >= 100,
  },

  // STUDY
  {
    key: "study_60",
    name: "Primeira Hora",
    description: "1 hora total de estudo",
    icon: "⏱️",
    xpReward: 30,
    category: "STUDY",
    check: (s) => s.totalStudyMinutes >= 60,
  },
  {
    key: "study_600",
    name: "Estudante Dedicado",
    description: "10 horas totais de estudo",
    icon: "📚",
    xpReward: 100,
    category: "STUDY",
    check: (s) => s.totalStudyMinutes >= 600,
  },
  {
    key: "study_3000",
    name: "Maratonista",
    description: "50 horas totais de estudo",
    icon: "🎓",
    xpReward: 400,
    category: "STUDY",
    check: (s) => s.totalStudyMinutes >= 3000,
  },

  // QUESTIONS
  {
    key: "questions_10",
    name: "Primeiros Passos",
    description: "10 questões respondidas",
    icon: "❓",
    xpReward: 20,
    category: "QUESTIONS",
    check: (s) => s.totalQuestions >= 10,
  },
  {
    key: "questions_100",
    name: "Centena",
    description: "100 questões respondidas",
    icon: "💡",
    xpReward: 100,
    category: "QUESTIONS",
    check: (s) => s.totalQuestions >= 100,
  },
  {
    key: "questions_500",
    name: "Banco de Questões",
    description: "500 questões respondidas",
    icon: "🗂️",
    xpReward: 300,
    category: "QUESTIONS",
    check: (s) => s.totalQuestions >= 500,
  },
  {
    key: "questions_1000",
    name: "Milhar",
    description: "1000 questões respondidas",
    icon: "🌟",
    xpReward: 800,
    category: "QUESTIONS",
    isHidden: true,
    check: (s) => s.totalQuestions >= 1000,
  },
  {
    key: "accuracy_80",
    name: "Preciso",
    description: "80% de acerto em 50+ questões",
    icon: "🎯",
    xpReward: 200,
    category: "QUESTIONS",
    check: (s) =>
      s.totalQuestions >= 50 &&
      s.totalQuestions > 0 &&
      s.correctQuestions / s.totalQuestions >= 0.8,
  },

  // FLASHCARDS
  {
    key: "flashcards_50",
    name: "Memorização",
    description: "50 flashcards revisados",
    icon: "🃏",
    xpReward: 40,
    category: "FLASHCARDS",
    check: (s) => s.totalFlashcards >= 50,
  },
  {
    key: "flashcards_500",
    name: "Mestre dos Cards",
    description: "500 flashcards revisados",
    icon: "🧠",
    xpReward: 200,
    category: "FLASHCARDS",
    check: (s) => s.totalFlashcards >= 500,
  },

  // SIMULADO
  {
    key: "simulado_first",
    name: "Primeiro Simulado",
    description: "Completou o primeiro simulado",
    icon: "📝",
    xpReward: 100,
    category: "SIMULADO",
    check: (s) => s.totalSimulados >= 1,
  },
  {
    key: "simulado_5",
    name: "Simulante",
    description: "5 simulados completados",
    icon: "📊",
    xpReward: 300,
    category: "SIMULADO",
    check: (s) => s.totalSimulados >= 5,
  },
  {
    key: "simulado_score_700",
    name: "Nota Alta",
    description: "Atingiu 700+ em um simulado",
    icon: "🥇",
    xpReward: 400,
    category: "SIMULADO",
    check: (s) => s.bestSimuladoScore >= 700,
  },
  {
    key: "simulado_score_800",
    name: "Elite",
    description: "Atingiu 800+ em um simulado",
    icon: "👑",
    xpReward: 1000,
    category: "SIMULADO",
    isHidden: true,
    check: (s) => s.bestSimuladoScore >= 800,
  },

  // REDACAO
  {
    key: "essay_first",
    name: "Redatora",
    description: "Escreveu a primeira redação",
    icon: "✍️",
    xpReward: 50,
    category: "REDACAO",
    check: (s) => s.totalEssays >= 1,
  },
  {
    key: "essay_10",
    name: "Escritora",
    description: "10 redações escritas",
    icon: "📖",
    xpReward: 250,
    category: "REDACAO",
    check: (s) => s.totalEssays >= 10,
  },

  // SCORE / XP
  {
    key: "level_5",
    name: "Em Ritmo",
    description: "Atingiu o nível 5",
    icon: "⚡",
    xpReward: 100,
    category: "SCORE",
    check: (s) => s.currentLevel >= 5,
  },
  {
    key: "level_10",
    name: "Veterano",
    description: "Atingiu o nível 10",
    icon: "🔰",
    xpReward: 250,
    category: "SCORE",
    check: (s) => s.currentLevel >= 10,
  },
  {
    key: "level_20",
    name: "Lenda",
    description: "Atingiu o nível 20",
    icon: "🌠",
    xpReward: 500,
    category: "SCORE",
    isHidden: true,
    check: (s) => s.currentLevel >= 20,
  },

  // SPECIAL
  {
    key: "special_allAreas",
    name: "Generalista",
    description: "Respondeu questões em todas as 5 áreas do ENEM",
    icon: "🗺️",
    xpReward: 200,
    category: "SPECIAL",
    check: () => false, // checked separately in checkAchievements
  },
]

async function getUserStats(userId: string): Promise<UserStats> {
  const [profile, studySessions, userQuestions, flashcardReviews, simulados, essays] =
    await Promise.all([
      db.userProfile.findUnique({
        where: { userId },
        select: { streak: true, totalXP: true, currentLevel: true },
      }),
      db.studySession.aggregate({
        where: { userId },
        _sum: { duration: true },
      }),
      db.userQuestion.findMany({
        where: { userId },
        select: { isCorrect: true },
      }),
      db.flashcardReview.count({ where: { userId } }),
      db.userSimulado.findMany({
        where: { userId, status: "COMPLETED" },
        select: { scoreTotal: true },
      }),
      db.essay.count({ where: { userId } }),
    ])

  const correct = userQuestions.filter((q) => q.isCorrect).length

  return {
    streak: profile?.streak ?? 0,
    totalStudyMinutes: studySessions._sum.duration ?? 0,
    totalQuestions: userQuestions.length,
    correctQuestions: correct,
    totalFlashcards: flashcardReviews,
    totalSimulados: simulados.length,
    totalEssays: essays,
    bestSimuladoScore: simulados.reduce((best, a) => Math.max(best, a.scoreTotal ?? 0), 0),
    totalXP: profile?.totalXP ?? 0,
    currentLevel: profile?.currentLevel ?? 1,
  }
}

async function checkAllAreasAchievement(userId: string): Promise<boolean> {
  const areas = await db.userQuestion.findMany({
    where: { userId },
    select: { question: { select: { areaSlug: true } } },
    distinct: ["questionId"],
  })
  const uniqueAreas = new Set(areas.map((a) => a.question.areaSlug).filter(Boolean))
  return uniqueAreas.size >= 5
}

export interface NewAchievement {
  key: string
  name: string
  description: string
  icon: string
  xpReward: number
}

export async function checkAchievements(userId: string): Promise<NewAchievement[]> {
  const [stats, earned] = await Promise.all([
    getUserStats(userId),
    db.userAchievement.findMany({
      where: { userId },
      select: { achievement: { select: { condition: true } } },
    }),
  ])

  const earnedKeys = new Set(earned.map((e) => JSON.parse(e.achievement.condition).key as string))

  const allAreasUnlocked = await checkAllAreasAchievement(userId)

  const newlyUnlocked: NewAchievement[] = []

  for (const def of ACHIEVEMENT_DEFS) {
    if (earnedKeys.has(def.key)) continue

    const unlocked =
      def.key === "special_allAreas" ? allAreasUnlocked : def.check(stats)

    if (!unlocked) continue

    // Find or create the Achievement record
    const achievement = await db.achievement.upsert({
      where: { id: def.key },
      create: {
        id: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        xpReward: def.xpReward,
        category: def.category,
        isHidden: def.isHidden ?? false,
        condition: JSON.stringify({ key: def.key }),
      },
      update: {},
    })

    await db.userAchievement.create({
      data: { userId, achievementId: achievement.id },
    })

    await awardXP(userId, def.xpReward)

    newlyUnlocked.push({
      key: def.key,
      name: def.name,
      description: def.description,
      icon: def.icon,
      xpReward: def.xpReward,
    })
  }

  return newlyUnlocked
}
