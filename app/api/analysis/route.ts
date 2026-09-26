import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// GET /api/analysis?studentId=xxx
// Returns: student, all concept performances, strengths/weaknesses/gaps
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

    // Compute overall
    const overallMastery = performances.reduce((s, p) => s + p.masteryPercent, 0) / performances.length

    // Categorize
    const strengths = performances.filter(p => p.status === 'STRONG')
    const developing = performances.filter(p => p.status === 'DEVELOPING')
    const gaps = performances.filter(p => p.status === 'GAP')

    // Get most recent assessment attempt
    const latestAttempt = await prisma.assessmentAttempt.findFirst({
      where: { studentId, type: 'DIAGNOSTIC' },
      orderBy: { startedAt: 'desc' },
      select: { overallScore: true, startedAt: true },
    })

    return NextResponse.json({
      student: { id: student.id, name: student.name },
      overallMastery,
      lastDiagnosticScore: latestAttempt?.overallScore ?? null,
      performances: performances.map(p => ({
        conceptId: p.conceptId,
        conceptName: p.concept.name,
        topicName: p.concept.topic.name,
        masteryPercent: p.masteryPercent,
        status: p.status,
        lastScorePercent: p.lastScorePercent,
        attemptsCount: p.attemptsCount,
      })),
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
