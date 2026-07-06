import { describe, it, expect, vi, beforeEach } from "vitest"
import { ACHIEVEMENT_DEFS, checkAchievements, type UserStats } from "./achievements"

const baseStats: UserStats = {
  streak: 0,
  totalStudyMinutes: 0,
  totalQuestions: 0,
  correctQuestions: 0,
  totalFlashcards: 0,
  totalSimulados: 0,
  totalEssays: 0,
  bestSimuladoScore: 0,
  totalXP: 0,
  currentLevel: 1,
}

function def(key: string) {
  const found = ACHIEVEMENT_DEFS.find((d) => d.key === key)
  if (!found) throw new Error(`achievement def not found: ${key}`)
  return found
}

describe("ACHIEVEMENT_DEFS conditions", () => {
  it("streak_7 unlocks at 7+ day streak", () => {
    expect(def("streak_7").check({ ...baseStats, streak: 6 })).toBe(false)
    expect(def("streak_7").check({ ...baseStats, streak: 7 })).toBe(true)
  })

  it("study_600 unlocks at 600+ total study minutes", () => {
    expect(def("study_600").check({ ...baseStats, totalStudyMinutes: 599 })).toBe(false)
    expect(def("study_600").check({ ...baseStats, totalStudyMinutes: 600 })).toBe(true)
  })

  it("questions_100 unlocks at 100+ answered questions", () => {
    expect(def("questions_100").check({ ...baseStats, totalQuestions: 99 })).toBe(false)
    expect(def("questions_100").check({ ...baseStats, totalQuestions: 100 })).toBe(true)
  })

  it("accuracy_80 requires both 50+ questions and >=80% accuracy", () => {
    expect(
      def("accuracy_80").check({ ...baseStats, totalQuestions: 40, correctQuestions: 40 })
    ).toBe(false) // not enough volume despite 100% accuracy
    expect(
      def("accuracy_80").check({ ...baseStats, totalQuestions: 50, correctQuestions: 39 })
    ).toBe(false) // 78% accuracy
    expect(
      def("accuracy_80").check({ ...baseStats, totalQuestions: 50, correctQuestions: 40 })
    ).toBe(true) // 80% accuracy
  })

  it("flashcards_500 unlocks at 500+ flashcards reviewed", () => {
    expect(def("flashcards_500").check({ ...baseStats, totalFlashcards: 499 })).toBe(false)
    expect(def("flashcards_500").check({ ...baseStats, totalFlashcards: 500 })).toBe(true)
  })

  it("simulado_score_700 unlocks with a best score of 700+", () => {
    expect(def("simulado_score_700").check({ ...baseStats, bestSimuladoScore: 699 })).toBe(false)
    expect(def("simulado_score_700").check({ ...baseStats, bestSimuladoScore: 700 })).toBe(true)
  })

  it("level_10 unlocks at level 10+", () => {
    expect(def("level_10").check({ ...baseStats, currentLevel: 9 })).toBe(false)
    expect(def("level_10").check({ ...baseStats, currentLevel: 10 })).toBe(true)
  })

  it("special_allAreas always reports false from its own check (resolved separately)", () => {
    expect(def("special_allAreas").check(baseStats)).toBe(false)
  })
})

// ── checkAchievements() integration (mocked Prisma) ──────────────────
const { dbMock, awardXPMock } = vi.hoisted(() => ({
  dbMock: {
    userProfile: { findUnique: vi.fn() },
    studySession: { aggregate: vi.fn() },
    userQuestion: { findMany: vi.fn() },
    flashcardReview: { count: vi.fn() },
    userSimulado: { findMany: vi.fn() },
    essay: { count: vi.fn() },
    userAchievement: { findMany: vi.fn(), create: vi.fn() },
    achievement: { upsert: vi.fn() },
  },
  awardXPMock: vi.fn(),
}))

vi.mock("@/lib/db", () => ({ db: dbMock }))
vi.mock("@/lib/xp", () => ({ awardXP: (...args: unknown[]) => awardXPMock(...args) }))

describe("checkAchievements", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dbMock.userProfile.findUnique.mockResolvedValue({
      streak: 7,
      totalXP: 0,
      currentLevel: 1,
    })
    dbMock.studySession.aggregate.mockResolvedValue({ _sum: { duration: 0 } })
    dbMock.userQuestion.findMany.mockResolvedValue([])
    dbMock.flashcardReview.count.mockResolvedValue(0)
    dbMock.userSimulado.findMany.mockResolvedValue([])
    dbMock.essay.count.mockResolvedValue(0)
    dbMock.userAchievement.findMany.mockResolvedValue([])
    dbMock.achievement.upsert.mockImplementation(({ where }: { where: { id: string } }) =>
      Promise.resolve({ id: where.id })
    )
  })

  it("unlocks streak_3 and streak_7 for a fresh user with a 7-day streak, awarding XP for each", async () => {
    const unlocked = await checkAchievements("user-1")

    const keys = unlocked.map((a) => a.key)
    expect(keys).toContain("streak_3")
    expect(keys).toContain("streak_7")
    expect(dbMock.userAchievement.create).toHaveBeenCalledTimes(unlocked.length)
    expect(awardXPMock).toHaveBeenCalledWith("user-1", 50) // streak_3 reward
    expect(awardXPMock).toHaveBeenCalledWith("user-1", 150) // streak_7 reward
  })

  it("skips achievements the user has already earned", async () => {
    dbMock.userAchievement.findMany.mockResolvedValue([
      { achievement: { condition: JSON.stringify({ key: "streak_3" }) } },
      { achievement: { condition: JSON.stringify({ key: "streak_7" }) } },
    ])

    const unlocked = await checkAchievements("user-1")

    expect(unlocked.map((a) => a.key)).not.toContain("streak_3")
    expect(unlocked.map((a) => a.key)).not.toContain("streak_7")
  })

  it("returns an empty list when no condition is met", async () => {
    dbMock.userProfile.findUnique.mockResolvedValue({
      streak: 0,
      totalXP: 0,
      currentLevel: 1,
    })

    const unlocked = await checkAchievements("user-1")

    expect(unlocked).toEqual([])
    expect(awardXPMock).not.toHaveBeenCalled()
  })
})
