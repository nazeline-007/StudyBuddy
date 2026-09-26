import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getNextDifficulty, QuizDifficultyState } from '@/lib/adaptiveQuiz'
import { DifficultyLevel } from '@prisma/client'

// POST /api/quiz/answer
// Body: { studentId, conceptId, attemptId, questionId, selectedIndex, sequenceIndex, quizState }
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      studentId,
      conceptId,
      attemptId,
      questionId,
      selectedIndex,
      sequenceIndex,
      quizState,
    } = body as {
      studentId: string
      conceptId: string
      attemptId: string
      questionId: string
      selectedIndex: number
      sequenceIndex: number
      quizState: QuizDifficultyState
    }

    // 1. Look up correct answer server-side
    const question = await prisma.question.findUnique({ where: { id: questionId } })
    if (!question) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 })
    }

    const isCorrect = selectedIndex === question.correctIndex

    // 2. Persist QuizAttempt row (proof of adaptivity via difficultyServed)
    await prisma.quizAttempt.create({
      data: {
        studentId,
        assessmentAttemptId: attemptId,
        conceptId,
        questionId,
        difficultyServed: quizState.currentDifficulty,
        isCorrect,
        sequenceIndex,
      },
    })

    // 3. Compute next difficulty state using deterministic algorithm
    const nextState = getNextDifficulty(quizState, isCorrect)

    // 4. Get next question at new difficulty (avoid same question)
    const usedQuestionIds = await prisma.quizAttempt.findMany({
      where: { assessmentAttemptId: attemptId },
      select: { questionId: true },
    })
    const usedIds = new Set(usedQuestionIds.map(q => q.questionId))

    const availableQuestions = await prisma.question.findMany({
      where: {
        conceptId,
        difficulty: nextState.currentDifficulty,
        id: { notIn: [...usedIds] },
      },
    })

    // If no unused questions at this difficulty, allow repeats
    const questionPool = availableQuestions.length > 0
      ? availableQuestions
      : await prisma.question.findMany({
          where: { conceptId, difficulty: nextState.currentDifficulty },
        })

    const nextQuestion = questionPool.length > 0
      ? questionPool[Math.floor(Math.random() * questionPool.length)]
      : null

    return NextResponse.json({
      success: true,
      wasCorrect: isCorrect,
      correctIndex: question.correctIndex,
      nextState,
      nextQuestion: nextQuestion ? {
        id: nextQuestion.id,
        prompt: nextQuestion.prompt,
        options: nextQuestion.options as string[],
        difficulty: nextQuestion.difficulty,
      } : null,
    })
  } catch (error: any) {
    console.error('[POST /api/quiz/answer]', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
