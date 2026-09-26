import { NextResponse } from 'next/server'
import { getAISupport, AIContext } from '@/lib/aiSupport'
import { prisma } from '@/lib/prisma'

// POST /api/ai-support
// Body: { studentId, conceptId, requestType }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, conceptId, requestType } = body as {
      studentId: string
      conceptId: string
      requestType: 'explanation' | 'example' | 'practice_question'
    }

    if (!studentId || !conceptId || !requestType) {
      return NextResponse.json({ success: false, error: 'studentId, conceptId, requestType required' }, { status: 400 })
    }

    // Build context from DB (server-side only — never invented client-side)
    const [performance, concept, allPerformances] = await Promise.all([
      prisma.studentConceptPerformance.findUnique({
        where: { studentId_conceptId: { studentId, conceptId } },
      }),
      prisma.concept.findUnique({
        where: { id: conceptId },
        include: { topic: { include: { subject: true } } },
      }),
      prisma.studentConceptPerformance.findMany({
        where: { studentId },
        include: { concept: { include: { topic: { include: { subject: true } } } } },
      }),
    ])

    if (!concept) {
      return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 })
    }

    // Determine subject for context
    const subjectName = concept.topic?.subject?.name ?? 'the subject'

    // Identify weak areas (other concepts in same subject that are Developing or Gap)
    const subjectId = concept.topic?.subject?.id
    const weakAreas = allPerformances
      .filter(p =>
        p.conceptId !== conceptId &&
        (p.status === 'DEVELOPING' || p.status === 'GAP') &&
        (subjectId ? p.concept?.topic?.subject?.id === subjectId : true)
      )
      .map(p => p.concept.name)

    // Determine current difficulty for this student
    const masteryPercent = performance?.masteryPercent ?? 0
    const currentDifficulty: 'Easy' | 'Medium' | 'Hard' =
      masteryPercent >= 70 ? 'Hard' :
      masteryPercent >= 40 ? 'Medium' :
      'Easy'

    const ctx: AIContext = {
      concept: concept.name,
      subject: subjectName,
      masteryPercent,
      weakAreas,
      recentScorePercent: performance?.lastScorePercent ?? 0,
      currentDifficulty,
      requestType,
    }

    const result = await getAISupport(ctx)

    return NextResponse.json({
      success: true,
      content: result.content,
      isAIGenerated: result.isAIGenerated,
      error: result.error,
      context: {
        conceptName: concept.name,
        subjectName,
        masteryPercent,
        currentDifficulty,
        weakAreas,
      },
    })
  } catch (error: any) {
    console.error('[POST /api/ai-support]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
