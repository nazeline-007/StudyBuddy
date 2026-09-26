import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { startingDifficultyFromMastery } from '@/lib/adaptiveQuiz'

export const dynamic = 'force-dynamic'

// GET /api/quiz?studentId=xxx&conceptId=xxx
// Returns: starting difficulty, first question
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get('studentId')
    const conceptId = searchParams.get('conceptId')

    if (!studentId || !conceptId) {
      return NextResponse.json({ error: 'studentId and conceptId required' }, { status: 400 })
    }

    // Get current mastery to determine starting difficulty
    const performance = await prisma.studentConceptPerformance.findUnique({
      where: { studentId_conceptId: { studentId, conceptId } },
    })

    const masteryPercent = performance?.masteryPercent ?? 0
    const startingDifficulty = startingDifficultyFromMastery(masteryPercent)

    // Get concept info
    const concept = await prisma.concept.findUnique({ where: { id: conceptId } })
    if (!concept) {
      return NextResponse.json({ error: 'Concept not found' }, { status: 404 })
    }

    // Get first question at starting difficulty
    const questions = await prisma.question.findMany({
      where: { conceptId, difficulty: startingDifficulty },
    })

    if (questions.length === 0) {
      return NextResponse.json({ error: 'No questions available at this difficulty' }, { status: 404 })
    }

    const firstQuestion = questions[Math.floor(Math.random() * questions.length)]

    // Create the AssessmentAttempt record for this quiz session
    const attempt = await prisma.assessmentAttempt.create({
      data: {
        studentId,
        type: 'QUIZ',
        startedAt: new Date(),
      },
    })

    return NextResponse.json({
      attemptId: attempt.id,
      studentId,
      conceptId,
      conceptName: concept.name,
      masteryPercent,
      startingDifficulty,
      currentDifficulty: startingDifficulty,
      question: {
        id: firstQuestion.id,
        prompt: firstQuestion.prompt,
        options: firstQuestion.options as string[],
        difficulty: firstQuestion.difficulty,
      },
      quizState: {
        currentDifficulty: startingDifficulty,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        questionIndex: 0,
        totalQuestions: 10, // target quiz length
      },
    })
  } catch (error: any) {
    console.error('[GET /api/quiz]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
