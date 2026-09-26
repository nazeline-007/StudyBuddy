import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { generateLearningPath } from '@/lib/pathGenerator'

export const dynamic = 'force-dynamic'

// GET /api/path?studentId=xxx&subjectId=xxx
// Returns current learning path (scoped to subject), or generates one if missing
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const subjectId = searchParams.get('subjectId') ?? undefined
    const regenerate = searchParams.get('regenerate') === 'true'

    if (!studentId) {
      return NextResponse.json({ error: 'studentId required' }, { status: 400 })
    }

    const student = await prisma.student.findUnique({ where: { id: studentId } })
    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 })
    }

    // Check if performance data exists (scoped to subject if given)
    const hasPerformance = await prisma.studentConceptPerformance.count({
      where: {
        studentId,
        ...(subjectId ? { concept: { topic: { subjectId } } } : {}),
      },
    })
    if (!hasPerformance) {
      const redirectQuery = subjectId
        ? `/diagnostic?studentId=${studentId}&subjectId=${subjectId}`
        : `/diagnostic?studentId=${studentId}`
      return NextResponse.json({
        error: 'No assessment data. Complete the diagnostic first.',
        redirectTo: redirectQuery,
      }, { status: 404 })
    }

    if (regenerate) {
      const path = await generateLearningPath(studentId, subjectId)
      return NextResponse.json({
        student: { id: student.id, name: student.name },
        pathId: path.pathId,
        items: path.items,
        subjectId: subjectId ?? null,
      })
    }

    // Get current path (scoped to subject if given)
    const currentPath = await prisma.learningPath.findFirst({
      where: {
        studentId,
        isCurrent: true,
        ...(subjectId ? { subjectId } : {}),
      },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            concept: {
              include: { topic: true },
            },
          },
        },
      },
      orderBy: { generatedAt: 'desc' },
    })

    if (!currentPath) {
      // Generate if missing
      const path = await generateLearningPath(studentId, subjectId)
      return NextResponse.json({
        student: { id: student.id, name: student.name },
        pathId: path.pathId,
        items: path.items,
        subjectId: subjectId ?? null,
      })
    }

    // Also fetch performances for additional context
    const performances = await prisma.studentConceptPerformance.findMany({
      where: {
        studentId,
        ...(subjectId ? { concept: { topic: { subjectId } } } : {}),
      },
    })
    const perfMap = new Map(performances.map(p => [p.conceptId, p]))

    return NextResponse.json({
      student: { id: student.id, name: student.name },
      pathId: currentPath.id,
      generatedAt: currentPath.generatedAt,
      subjectId: currentPath.subjectId ?? null,
      items: currentPath.items.map(item => ({
        id: item.id,
        conceptId: item.conceptId,
        conceptName: item.concept.name,
        topicName: item.concept.topic.name,
        orderIndex: item.orderIndex,
        reason: item.reason,
        masteryPercent: perfMap.get(item.conceptId)?.masteryPercent ?? 0,
        status: perfMap.get(item.conceptId)?.status ?? 'GAP',
        lastScorePercent: perfMap.get(item.conceptId)?.lastScorePercent ?? null,
      })),
    })
  } catch (error: any) {
    console.error('[GET /api/path]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
