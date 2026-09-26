import { MasteryStatus } from '@prisma/client'

// ============================================================
// Analysis Engine
// Per PROJECT_SPEC.md §6-7 and TECHNICAL_ARCHITECTURE.md §3
// ============================================================

/**
 * Fixed thresholds (PROJECT_SPEC.md §6). Never change these.
 * Strong  >= 70
 * Developing 40-69
 * Gap < 40
 */
export function computeMasteryStatus(percent: number): MasteryStatus {
  if (percent >= 70) return 'STRONG'
  if (percent >= 40) return 'DEVELOPING'
  return 'GAP'
}

/**
 * Mastery update formula (PROJECT_SPEC.md §7).
 * newMastery = previousMastery × 0.7 + currentPerformance × 0.3
 * For a new student, previousMastery = 0.
 */
export function applyMasteryFormula(previousMastery: number, currentPerformancePercent: number): number {
  const result = previousMastery * 0.7 + currentPerformancePercent * 0.3
  // Clamp to [0, 100]
  return Math.min(100, Math.max(0, result))
}

/**
 * Compute per-concept score from a list of {conceptId, isCorrect} answers.
 * Returns a map of conceptId → score percent (0–100).
 */
export function computeConceptScores(
  answers: Array<{ conceptId: string; isCorrect: boolean }>
): Map<string, number> {
  const counts = new Map<string, { correct: number; total: number }>()

  for (const answer of answers) {
    const entry = counts.get(answer.conceptId) ?? { correct: 0, total: 0 }
    entry.total += 1
    if (answer.isCorrect) entry.correct += 1
    counts.set(answer.conceptId, entry)
  }

  const scores = new Map<string, number>()
  for (const [conceptId, { correct, total }] of counts) {
    scores.set(conceptId, total > 0 ? (correct / total) * 100 : 0)
  }
  return scores
}

/**
 * Compute overall score from all answers.
 */
export function computeOverallScore(answers: Array<{ isCorrect: boolean }>): number {
  if (answers.length === 0) return 0
  const correct = answers.filter(a => a.isCorrect).length
  return (correct / answers.length) * 100
}
