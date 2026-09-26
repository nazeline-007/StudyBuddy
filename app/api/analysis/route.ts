import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/analysis?studentId=xxx
// Returns: student, all concept performances with prerequisite info, strengths/weaknesses/gaps
// Mastery thresholds (deterministic, no AI): STRONG>=70, DEVELOPING 40-69, GAP<40
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    const performances = await prisma.studentConceptPerformance.findMany({
      where: { studentId },
      include: { concept: { include: { topic: true } } },
      orderBy: { masteryPercent: 'asc' },
    })

    if (performances.length === 0) {
      return NextResponse.json({
        error: 'No assessment data found. Please complete the diagnostic first.',
        redirectTo: `/diagnostic?studentId=${studentId}`,
      }, { status: 404 })
    }

    // Compute overall mastery (mean of all concept masteries)
    const overallMastery = performances.reduce((s, p) => s + p.masteryPercent, 0) / performances.length

    // Categorize by stored status (written by mastery formula, never by AI)
    const strengths = performances.filter(p => p.status === 'STRONG')
    const developing = performances.filter(p => p.status === 'DEVELOPING')
    const gaps = performances.filter(p => p.status === 'GAP')

    // Get most recent diagnostic attempt score
    const latestAttempt = await prisma.assessmentAttempt.findFirst({
      where: { studentId, type: 'DIAGNOSTIC' },
      orderBy: { startedAt: 'desc' },
      select: { overallScore: true, startedAt: true },
    })

    // --- Prerequisite logic: read from DB, never hardcoded ---
    // Load all prerequisite edges, including prerequisite concept name
    const prereqEdges = await prisma.conceptPrerequisite.findMany({
      include: {
        prerequisite: { select: { id: true, name: true } },
      },
    })

    // Build performance lookup: conceptId → performance row
    const perfMap = new Map(performances.map(p => [p.conceptId, p]))

    // For each concept: compute prerequisiteBlocked from actual DB data
    // A concept is blocked if ANY of its prerequisites does not have STRONG mastery
    const prereqInfoMap = new Map(
      performances.map(perf => {
        const prereqsForThisConcept = prereqEdges.filter(e => e.conceptId === perf.conceptId)
        const blockedByNames: string[] = []

        const prerequisiteBlocked = prereqsForThisConcept.some(edge => {
          const prereqPerf = perfMap.get(edge.prerequisiteId)
          const isBlocked = !prereqPerf || prereqPerf.status !== 'STRONG'
          if (isBlocked) blockedByNames.push(edge.prerequisite.name)
          return isBlocked
        })

        return [perf.conceptId, { prerequisiteBlocked, blockedByNames }]
      })
    )

    return NextResponse.json({
      student: { id: student.id, name: student.name },
      overallMastery,
      lastDiagnosticScore: latestAttempt?.overallScore ?? null,
      performances: performances.map(p => {
        const prereq = prereqInfoMap.get(p.conceptId) ?? { prerequisiteBlocked: false, blockedByNames: [] }
        return {
          conceptId: p.conceptId,
          conceptName: p.concept.name,
          topicName: p.concept.topic.name,
          masteryPercent: p.masteryPercent,
          status: p.status,
          lastScorePercent: p.lastScorePercent,
          attemptsCount: p.attemptsCount,
          prerequisiteBlocked: prereq.prerequisiteBlocked,
          blockedByNames: prereq.blockedByNames,
        }
      }),
      summary: {
        strongCount: strengths.length,
        developingCount: developing.length,
        gapCount: gaps.length,
        strengths: strengths.map(p => p.concept.name),
        developing: developing.map(p => p.concept.name),
        gaps: gaps.map(p => p.concept.name),
      },
    })
  } catch (error: any) {
    console.error('[GET /api/analysis]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
