import { DifficultyLevel } from '@prisma/client'

// ============================================================
// Adaptive Quiz Engine
// Per TECHNICAL_ARCHITECTURE.md §6
// ============================================================

export interface QuizDifficultyState {
  currentDifficulty: DifficultyLevel
  consecutiveCorrect: number
  consecutiveIncorrect: number
}

/**
 * Pure function: given current state and whether the last answer was correct,
 * return the next difficulty state.
 *
 * Rules (TECHNICAL_ARCHITECTURE.md §6):
 * - Correct → consecutiveCorrect++, consecutiveIncorrect=0
 *   If consecutiveCorrect >= 2 AND not already Hard → increase one step, reset counter
 * - Incorrect → consecutiveIncorrect++, consecutiveCorrect=0
 *   Immediately decrease one step (Medium→Easy, Hard→Medium)
 * - Difficulty never goes below Easy or above Hard
 */
export function getNextDifficulty(
  state: QuizDifficultyState,
  wasCorrect: boolean
): QuizDifficultyState {
  const order: DifficultyLevel[] = ['EASY', 'MEDIUM', 'HARD']
  const currentIndex = order.indexOf(state.currentDifficulty)

  if (wasCorrect) {
    const newConsecCorrect = state.consecutiveCorrect + 1
    const newConsecIncorrect = 0

    if (newConsecCorrect >= 2 && currentIndex < order.length - 1) {
      // Increase difficulty
      return {
        currentDifficulty: order[currentIndex + 1],
        consecutiveCorrect: 0,
        consecutiveIncorrect: newConsecIncorrect,
      }
    }

    return {
      currentDifficulty: state.currentDifficulty,
      consecutiveCorrect: newConsecCorrect,
      consecutiveIncorrect: newConsecIncorrect,
    }
  } else {
    // Incorrect: immediately drop one step
    const newIndex = Math.max(0, currentIndex - 1)
    return {
      currentDifficulty: order[newIndex],
      consecutiveCorrect: 0,
      consecutiveIncorrect: state.consecutiveIncorrect + 1,
    }
  }
}

/**
 * Determine starting difficulty based on current stored mastery.
 * Per TECHNICAL_ARCHITECTURE.md §5:
 * < 40% → Easy, 40–69% → Medium, >= 70% → Hard
 */
export function startingDifficultyFromMastery(masteryPercent: number): DifficultyLevel {
  if (masteryPercent >= 70) return 'HARD'
  if (masteryPercent >= 40) return 'MEDIUM'
  return 'EASY'
}

/**
 * Initialize quiz state from mastery percent.
 */
export function initQuizState(masteryPercent: number): QuizDifficultyState {
  return {
    currentDifficulty: startingDifficultyFromMastery(masteryPercent),
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
  }
}
