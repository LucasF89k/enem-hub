import { describe, it, expect } from "vitest"
import { sm2 } from "./sm2"
import { ReviewState } from "@prisma/client"

describe("sm2", () => {
  it("rating 1 (Again) restarts learning with scheduled=1 and raises difficulty", () => {
    const result = sm2({ rating: 1, stability: 10, difficulty: 5, elapsed: 3 })
    expect(result.scheduled).toBe(1)
    expect(result.stability).toBe(1)
    expect(result.difficulty).toBeCloseTo(5.2)
    expect(result.state).toBe(ReviewState.LEARNING)
  })

  it("rating 2 (Hard) schedules stability * 1.2 and slightly raises difficulty", () => {
    const result = sm2({ rating: 2, stability: 10, difficulty: 5, elapsed: 3 })
    expect(result.scheduled).toBe(12) // floor(10 * 1.2)
    expect(result.difficulty).toBeCloseTo(5.1)
    expect(result.state).toBe(ReviewState.REVIEW)
  })

  it("rating 3 (Good) scales by a difficulty factor and leaves difficulty unchanged", () => {
    const result = sm2({ rating: 3, stability: 10, difficulty: 5, elapsed: 3 })
    // difficulty 5 => factor = clamp(1 + 0*0.1, 0.5, 1.5) = 1
    expect(result.scheduled).toBe(10)
    expect(result.difficulty).toBe(5)
    expect(result.state).toBe(ReviewState.REVIEW)
  })

  it("rating 3 (Good) scales down for harder cards (difficulty > 5)", () => {
    const result = sm2({ rating: 3, stability: 10, difficulty: 9, elapsed: 3 })
    // factor = clamp(1 + 4*0.1, 0.5, 1.5) = 1.4
    expect(result.scheduled).toBe(14)
  })

  it("rating 4 (Easy) schedules stability * 1.3 * 1.3 and lowers difficulty", () => {
    const result = sm2({ rating: 4, stability: 10, difficulty: 5, elapsed: 3 })
    expect(result.scheduled).toBe(16) // floor(10 * 1.69)
    expect(result.difficulty).toBeCloseTo(4.9)
    expect(result.state).toBe(ReviewState.REVIEW)
  })

  it("clamps difficulty to a maximum of 10", () => {
    const result = sm2({ rating: 1, stability: 10, difficulty: 9.9, elapsed: 3 })
    expect(result.difficulty).toBe(10)
  })

  it("clamps difficulty to a minimum of 1", () => {
    const result = sm2({ rating: 4, stability: 10, difficulty: 1, elapsed: 3 })
    expect(result.difficulty).toBe(1)
  })

  it("never schedules less than 1 day even with very low stability", () => {
    const hard = sm2({ rating: 2, stability: 0, difficulty: 5, elapsed: 1 })
    const good = sm2({ rating: 3, stability: 0, difficulty: 5, elapsed: 1 })
    const easy = sm2({ rating: 4, stability: 0, difficulty: 5, elapsed: 1 })
    expect(hard.scheduled).toBeGreaterThanOrEqual(1)
    expect(good.scheduled).toBeGreaterThanOrEqual(1)
    expect(easy.scheduled).toBeGreaterThanOrEqual(1)
  })

  it("computes nextReview as scheduled days from now", () => {
    const before = new Date()
    const result = sm2({ rating: 3, stability: 5, difficulty: 5, elapsed: 2 })
    const diffDays = Math.round(
      (result.nextReview.getTime() - before.getTime()) / (1000 * 60 * 60 * 24)
    )
    expect(diffDays).toBe(result.scheduled)
  })
})
