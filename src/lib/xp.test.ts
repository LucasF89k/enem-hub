import { describe, it, expect, vi, beforeEach } from "vitest"
import { calcLevel, awardXP } from "./xp"

const { updateMock } = vi.hoisted(() => ({ updateMock: vi.fn() }))

vi.mock("@/lib/db", () => ({
  db: {
    userProfile: {
      update: (...args: unknown[]) => updateMock(...args),
    },
  },
}))

describe("calcLevel", () => {
  it("starts at level 1 with 0 XP", () => {
    expect(calcLevel(0)).toBe(1)
  })

  it("levels up every 500 XP", () => {
    expect(calcLevel(499)).toBe(1)
    expect(calcLevel(500)).toBe(2)
    expect(calcLevel(999)).toBe(2)
    expect(calcLevel(1000)).toBe(3)
  })

  it("caps at level 99 regardless of how much XP is earned", () => {
    expect(calcLevel(999_999)).toBe(99)
  })
})

describe("awardXP", () => {
  beforeEach(() => {
    updateMock.mockReset()
  })

  it("increments totalXP and returns the awarded amount", async () => {
    updateMock.mockResolvedValueOnce({ totalXP: 120, currentLevel: 1 })

    const awarded = await awardXP("user-1", 20)

    expect(awarded).toBe(20)
    expect(updateMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: "user-1" },
        data: { totalXP: { increment: 20 } },
      })
    )
  })

  it("bumps currentLevel with a second update when XP crosses a level threshold", async () => {
    updateMock
      .mockResolvedValueOnce({ totalXP: 500, currentLevel: 1 }) // increment result
      .mockResolvedValueOnce({}) // level bump update

    await awardXP("user-1", 500)

    expect(updateMock).toHaveBeenCalledTimes(2)
    expect(updateMock).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { userId: "user-1" },
        data: { currentLevel: 2 },
      })
    )
  })

  it("does not update currentLevel again when the level did not change", async () => {
    updateMock.mockResolvedValueOnce({ totalXP: 250, currentLevel: 1 })

    await awardXP("user-1", 10)

    expect(updateMock).toHaveBeenCalledTimes(1)
  })
})
