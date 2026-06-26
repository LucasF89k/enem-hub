import { addDays } from "date-fns"
import { ReviewState } from "@prisma/client"

export interface SM2Input {
  rating: 1 | 2 | 3 | 4
  stability: number   // previous interval in days (= previous scheduled)
  difficulty: number  // 1–10
  elapsed: number     // days since last review
}

export interface SM2Output {
  stability: number
  difficulty: number
  scheduled: number   // days until next review
  nextReview: Date
  state: ReviewState
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function sm2({ rating, stability, difficulty }: SM2Input): SM2Output {
  let scheduled: number
  let newDifficulty = difficulty
  let state: ReviewState

  switch (rating) {
    case 1: // Again — forgotten, restart
      scheduled = 1
      newDifficulty = difficulty + 0.2
      state = ReviewState.LEARNING
      break

    case 2: // Hard — remembered with difficulty
      scheduled = Math.max(1, Math.floor(stability * 1.2))
      newDifficulty = difficulty + 0.1
      state = ReviewState.REVIEW
      break

    case 3: { // Good — recalled correctly
      const difficultyFactor = clamp(1 + (difficulty - 5) * 0.1, 0.5, 1.5)
      scheduled = Math.max(1, Math.floor(stability * difficultyFactor))
      state = ReviewState.REVIEW
      break
    }

    case 4: // Easy — recalled effortlessly
      scheduled = Math.max(1, Math.floor(stability * 1.3 * 1.3))
      newDifficulty = difficulty - 0.1
      state = ReviewState.REVIEW
      break
  }

  newDifficulty = clamp(newDifficulty, 1, 10)

  return {
    stability: scheduled,
    difficulty: newDifficulty,
    scheduled,
    nextReview: addDays(new Date(), scheduled),
    state,
  }
}
