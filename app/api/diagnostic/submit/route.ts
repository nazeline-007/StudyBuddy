import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { computeConceptScores, computeOverallScore } from '@/lib/analysisEngine'
import { updateConceptPerformance } from '@/lib/pathGenerator'
import { generateLearningPath } from '@/lib/pathGenerator'

// POST /api/diagnostic/submit
// Body: { studentId: string, answers: [{ questionId: string, selectedIndex: number }] }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { studentId, answers } = body as {
      studentId: string
      answers: Array<{ questionId: string; selectedIndex: number }>
    }

    if (!studentId || !answers?.length) {
      return NextResponse.json({ success: false, error: 'studentId and answers required' }, { status: 400 })
    }

    // 1. Load all question correct answers (server-side only)
    const questionIds = answers.map(a => a.questionId)
    const questions = await prisma.question.findMany({
      where: { id: { in: questionIds } },
      include: { concept: { select: { id: true, name: true } } },
    })

    const questionMap = new Map(questions.map(q => [q.id, q]))

    // 2. Compute correctness
    const scoredAnswers = answers.map(a => {
      const q = questionMap.get(a.questionId)
      if (!q) throw new Error(`Question ${a.questionId} not found`)
      return {
        questionId: a.questionId,
        conceptId: q.conceptId,
        conceptName: q.concept.name,
        selectedIndex: a.selectedIndex,
        isCorrect: a.selectedIndex === q.correctIndex,
        correctIndex: q.correctIndex,
      }
    })

    // 3. Compute scores
    const overallScore = computeOverallScore(scoredAnswers)
    const conceptScores = computeConceptScores(scoredAnswers)

    // 4. Persist AssessmentAttempt + Answer rows
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId,
        type: 'DIAGNOSTIC',
        completedAt: new Date(),
        overallScore,
        answers: {
          create: scoredAnswers.map(a => ({
            questionId: a.questionId,
            selectedIndex: a.selectedIndex,
            isCorrect: a.isCorrect,
          })),
        },
      },
    })

    // 5. Update StudentConceptPerformance using mastery formula
    const performanceUpdates: Record<string, { masteryPercent: number; previousMastery: number; status: string }> = {}

    for (const [conceptId, score] of conceptScores) {
      const result = await updateConceptPerformance(studentId, conceptId, score)
      performanceUpdates[conceptId] = result
    }

    // 6. Generate learning path
    const path = await generateLearningPath(studentId)

    return NextResponse.json({
      success: true,
      attemptId: attempt.id,
      overallScore,
      conceptScores: Object.fromEntries(conceptScores),
      performanceUpdates,
      pathId: path.pathId,
      // Return scored answers so client can show results
      scoredAnswers: scoredAnswers.map(a => ({
        questionId: a.questionId,
        conceptName: a.conceptName,
        isCorrect: a.isCorrect,
        selectedIndex: a.selectedIndex,
        correctIndex: a.correctIndex,
      })),
    })
  } catch (error: any) {
    console.error('[POST /api/diagnostic/submit]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
