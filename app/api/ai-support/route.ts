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
      prisma.concept.findUnique({ where: { id: conceptId } }),
      prisma.studentConceptPerformance.findMany({
        where: { studentId },
        include: { concept: true },
      }),
    ])

    if (!concept) {
      return NextResponse.json({ success: false, error: 'Concept not found' }, { status: 404 })
    }

    // Identify weak areas (other concepts that are Developing or Gap)
    const weakAreas = allPerformances
      .filter(p => p.conceptId !== conceptId && (p.status === 'DEVELOPING' || p.status === 'GAP'))
      .map(p => p.concept.name)

    // Determine current difficulty for this student
    const masteryPercent = performance?.masteryPercent ?? 0
    const currentDifficulty: 'Easy' | 'Medium' | 'Hard' =
      masteryPercent >= 70 ? 'Hard' :
      masteryPercent >= 40 ? 'Medium' :
      'Easy'

    const ctx: AIContext = {
      concept: concept.name,
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
