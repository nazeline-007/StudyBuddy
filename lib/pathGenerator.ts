import { prisma } from './prisma'
import { computeMasteryStatus, applyMasteryFormula } from './analysisEngine'
import { MasteryStatus } from '@prisma/client'

// ============================================================
// Prerequisite Engine + Path Generator
// Per TECHNICAL_ARCHITECTURE.md §3, §4
// ============================================================

interface ConceptWithPerformance {
  conceptId: string
  name: string
  masteryPercent: number
  status: MasteryStatus
  prerequisiteBlocked: boolean
  blockedByNames: string[]
}

/**
 * Generate an ordered learning path for a student.
 * Reads current StudentConceptPerformance + ConceptPrerequisite edges from DB.
 * Returns ordered list of concepts with reasons.
 *
 * Sort order (TECHNICAL_ARCHITECTURE.md §4 step 4):
 *   (a) GAP concepts whose prerequisites are already Strong
 *   (b) Prerequisite gaps before their dependents (GAP + blocked)
 *   (c) Developing concepts without blocks
 *   (d) Developing concepts with blocks
 *   (e) Strong concepts last (review)
 */
export async function generateLearningPath(studentId: string): Promise<{
  pathId: string
  items: Array<{
    conceptId: string
    name: string
    orderIndex: number
    reason: string
    masteryPercent: number
    status: MasteryStatus
    prerequisiteBlocked: boolean
  }>
}> {
  // 1. Mark old paths as not current
  await prisma.learningPath.updateMany({
    where: { studentId, isCurrent: true },
    data: { isCurrent: false },
  })

  // 2. Read performances
  const performances = await prisma.studentConceptPerformance.findMany({
    where: { studentId },
    include: { concept: true },
  })

  // 3. Read all prerequisite edges
  const prereqEdges = await prisma.conceptPrerequisite.findMany()

  // 4. Build concept map
  const perfMap = new Map(performances.map(p => [p.conceptId, p]))

  // 5. Compute prerequisiteBlocked for each concept
  const enriched: ConceptWithPerformance[] = performances.map(perf => {
    const prereqsForConcept = prereqEdges.filter(e => e.conceptId === perf.conceptId)
    const blockedByNames: string[] = []

    const prerequisiteBlocked = prereqsForConcept.some(e => {
      const prereqPerf = perfMap.get(e.prerequisiteId)
      if (!prereqPerf || prereqPerf.status !== 'STRONG') {
        const prereqPerfData = performances.find(p => p.conceptId === e.prerequisiteId)
        blockedByNames.push(prereqPerfData?.concept?.name ?? e.prerequisiteId)
        return true
      }
      return false
    })

    return {
      conceptId: perf.conceptId,
      name: perf.concept.name,
      masteryPercent: perf.masteryPercent,
      status: perf.status,
      prerequisiteBlocked,
      blockedByNames,
    }
  })

  // 6. Sort
  const sorted = [...enriched].sort((a, b) => {
    const priority = (item: ConceptWithPerformance): number => {
      if (item.status === 'GAP' && !item.prerequisiteBlocked) return 0    // (a) unblocked gaps first
      if (item.status === 'GAP' && item.prerequisiteBlocked) return 1     // (b) blocked gaps
      if (item.status === 'DEVELOPING' && !item.prerequisiteBlocked) return 2 // (c) unblocked developing
      if (item.status === 'DEVELOPING' && item.prerequisiteBlocked) return 3  // (d) blocked developing
      return 4 // STRONG — review last
    }
    const pa = priority(a)
    const pb = priority(b)
    if (pa !== pb) return pa - pb
    return a.masteryPercent - b.masteryPercent // lower mastery first within same tier
  })

  // 7. Build reason strings
  const itemsWithReasons = sorted.map((item, idx) => {
    let reason: string
    if (item.status === 'GAP' && !item.prerequisiteBlocked) {
      reason = 'Knowledge gap — needs immediate attention'
    } else if (item.status === 'GAP' && item.prerequisiteBlocked) {
      reason = `Knowledge gap (blocked by: ${item.blockedByNames.join(', ')})`
    } else if (item.status === 'DEVELOPING' && !item.prerequisiteBlocked) {
      reason = 'Developing — needs more practice'
    } else if (item.status === 'DEVELOPING' && item.prerequisiteBlocked) {
      reason = `Developing (blocked by: ${item.blockedByNames.join(', ')})`
    } else {
      reason = 'Strong — optional review'
    }

    return {
      conceptId: item.conceptId,
      name: item.name,
      orderIndex: idx,
      reason,
      masteryPercent: item.masteryPercent,
      status: item.status,
      prerequisiteBlocked: item.prerequisiteBlocked,
    }
  })

  // 8. Persist the new path
  const path = await prisma.learningPath.create({
    data: {
      studentId,
      isCurrent: true,
      items: {
        create: itemsWithReasons.map(item => ({
          conceptId: item.conceptId,
          orderIndex: item.orderIndex,
          reason: item.reason,
        })),
      },
    },
  })

  return { pathId: path.id, items: itemsWithReasons }
}

/**
 * Get the current learning path for a student (does not regenerate).
 */
export async function getCurrentLearningPath(studentId: string) {
  return prisma.learningPath.findFirst({
    where: { studentId, isCurrent: true },
    include: {
      items: {
        orderBy: { orderIndex: 'asc' },
        include: { concept: true },
      },
    },
    orderBy: { generatedAt: 'desc' },
  })
}

/**
 * Update StudentConceptPerformance for one concept after an attempt.
 * Applies the mastery formula and updates status.
 */
export async function updateConceptPerformance(
  studentId: string,
  conceptId: string,
  currentScorePercent: number
): Promise<{ masteryPercent: number; status: MasteryStatus; previousMastery: number }> {
  const existing = await prisma.studentConceptPerformance.findUnique({
    where: { studentId_conceptId: { studentId, conceptId } },
  })

  const previousMastery = existing?.masteryPercent ?? 0
  const newMastery = applyMasteryFormula(previousMastery, currentScorePercent)
  const newStatus = computeMasteryStatus(newMastery)

  await prisma.studentConceptPerformance.upsert({
    where: { studentId_conceptId: { studentId, conceptId } },
    update: {
      masteryPercent: newMastery,
      status: newStatus,
      lastScorePercent: currentScorePercent,
      attemptsCount: { increment: 1 },
    },
    create: {
      studentId,
      conceptId,
      masteryPercent: newMastery,
      status: newStatus,
      lastScorePercent: currentScorePercent,
      attemptsCount: 1,
    },
  })

  return { masteryPercent: newMastery, status: newStatus, previousMastery }
}
