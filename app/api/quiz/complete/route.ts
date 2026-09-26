import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { updateConceptPerformance, generateLearningPath } from '@/lib/pathGenerator'

// POST /api/quiz/complete
// Body: { studentId, conceptId, attemptId }
// Finalizes quiz, updates mastery, regenerates learning path
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, conceptId, attemptId } = body as {
      studentId: string
      conceptId: string
      attemptId: string
    }

    if (!studentId || !conceptId || !attemptId) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    // 1. Get all quiz attempts for this session
    const quizAttempts = await prisma.quizAttempt.findMany({
      where: { assessmentAttemptId: attemptId },
      orderBy: { sequenceIndex: 'asc' },
    })

    if (quizAttempts.length === 0) {
      return NextResponse.json({ success: false, error: 'No quiz attempts found' }, { status: 404 })
    }

    // 2. Compute score for this quiz session
    const correctCount = quizAttempts.filter(a => a.isCorrect).length
    const scorePercent = (correctCount / quizAttempts.length) * 100

    // 3. Mark assessment attempt as complete
    await prisma.assessmentAttempt.update({
      where: { id: attemptId },
      data: {
        completedAt: new Date(),
        overallScore: scorePercent,
      },
    })

    // 4. Get previous mastery (before update)
    const prevPerf = await prisma.studentConceptPerformance.findUnique({
      where: { studentId_conceptId: { studentId, conceptId } },
    })
    const previousMastery = prevPerf?.masteryPercent ?? 0
    const previousStatus = prevPerf?.status ?? 'GAP'

    // 5. Update mastery using the formula
    const updated = await updateConceptPerformance(studentId, conceptId, scorePercent)

    // 6. Regenerate learning path
    const path = await generateLearningPath(studentId)

    // 7. Get difficulty trajectory for display (proves adaptivity)
    const difficultyTrajectory = quizAttempts.map(a => ({
      sequenceIndex: a.sequenceIndex,
      difficulty: a.difficultyServed,
      isCorrect: a.isCorrect,
    }))

    return NextResponse.json({
      success: true,
      quiz: {
        totalQuestions: quizAttempts.length,
        correctCount,
        scorePercent,
        difficultyTrajectory,
      },
      mastery: {
        previousMastery,
        previousStatus,
        newMastery: updated.masteryPercent,
        newStatus: updated.status,
        changed: Math.abs(updated.masteryPercent - previousMastery) > 0.01,
      },
      pathId: path.pathId,
      pathItems: path.items,
    })
  } catch (error: any) {
    console.error('[POST /api/quiz/complete]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
