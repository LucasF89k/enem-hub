import { describe, it, expect } from "vitest"
import { addDays } from "date-fns"
import { detectTrail, getTrailConfig, TRAIL_CONFIGS } from "./trail"

describe("detectTrail", () => {
  it("returns EXTENSIVA when no exam date is set", () => {
    expect(detectTrail(null)).toBe("EXTENSIVA")
    expect(detectTrail(undefined)).toBe("EXTENSIVA")
  })

  it("returns EXTENSIVA when 270+ days remain", () => {
    expect(detectTrail(addDays(new Date(), 300))).toBe("EXTENSIVA")
  })

  it("returns SEMI_EXTENSIVA when 180-269 days remain", () => {
    expect(detectTrail(addDays(new Date(), 200))).toBe("SEMI_EXTENSIVA")
  })

  it("returns INTENSIVA when 90-179 days remain", () => {
    expect(detectTrail(addDays(new Date(), 100))).toBe("INTENSIVA")
  })

  it("returns SPRINT when fewer than 90 days remain", () => {
    expect(detectTrail(addDays(new Date(), 30))).toBe("SPRINT")
  })

  it("returns SPRINT when the exam date has already passed", () => {
    expect(detectTrail(addDays(new Date(), -10))).toBe("SPRINT")
  })
})

describe("getTrailConfig", () => {
  it("returns the matching config for each trail type", () => {
    for (const type of Object.keys(TRAIL_CONFIGS) as (keyof typeof TRAIL_CONFIGS)[]) {
      expect(getTrailConfig(type).type).toBe(type)
    }
  })

  it("has ratios that sum to 1 for every trail", () => {
    for (const config of Object.values(TRAIL_CONFIGS)) {
      const sum =
        config.ratios.content +
        config.ratios.questions +
        config.ratios.flashcards +
        config.ratios.simulados
      expect(sum).toBeCloseTo(1)
    }
  })
})
