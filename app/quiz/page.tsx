'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { QuizDifficultyState } from '@/lib/adaptiveQuiz'

interface QuizQuestion {
  id: string
  prompt: string
  options: string[]
  difficulty: string
}

interface QuizSession {
  attemptId: string
  studentId: string
  conceptId: string
  conceptName: string
  masteryPercent: number
  startingDifficulty: string
  currentDifficulty: string
  question: QuizQuestion
  quizState: QuizDifficultyState & { questionIndex: number; totalQuestions: number }
}

interface AnswerResult {
  wasCorrect: boolean
  correctIndex: number
  nextState: QuizDifficultyState
  nextQuestion: QuizQuestion | null
}

interface QuizHistory {
  questionIndex: number
  difficulty: string
  wasCorrect: boolean
  question: string
}

const QUIZ_LENGTH = 10
const DIFFICULTY_COLORS = {
  EASY: 'text-success-400 bg-success-500/10 border-success-500/30',
  MEDIUM: 'text-warning-400 bg-warning-500/10 border-warning-500/30',
  HARD: 'text-danger-400 bg-danger-500/10 border-danger-500/30',
}

function QuizContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')
  const conceptId = searchParams.get('conceptId')
  const subjectId = searchParams.get('subjectId')

  const [session, setSession] = useState<QuizSession | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null)
  const [quizState, setQuizState] = useState<QuizDifficultyState & { questionIndex: number }>({
    currentDifficulty: 'MEDIUM',
    consecutiveCorrect: 0,
    consecutiveIncorrect: 0,
    questionIndex: 0,
  })
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [answerResult, setAnswerResult] = useState<AnswerResult | null>(null)
  const [history, setHistory] = useState<QuizHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [completed, setCompleted] = useState(false)
  const [completionData, setCompletionData] = useState<any>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId || !conceptId) { router.push('/'); return }
    initQuiz()
  }, [studentId, conceptId])

  async function initQuiz() {
    setLoading(true)
    try {
      const res = await fetch(`/api/quiz?studentId=${studentId}&conceptId=${conceptId}`)
      const data = await res.json()
      if (data.error) { setError(data.error); return }
      setSession(data)
      setCurrentQuestion(data.question)
      setQuizState({
        currentDifficulty: data.startingDifficulty,
        consecutiveCorrect: 0,
        consecutiveIncorrect: 0,
        questionIndex: 0,
      })
    } catch {
      setError('Failed to start quiz')
    } finally {
      setLoading(false)
    }
  }

  async function handleAnswer(selectedIndex: number) {
    if (!session || !currentQuestion || submitting || answerResult) return
    setSelectedAnswer(selectedIndex)
    setSubmitting(true)

    try {
      const res = await fetch('/api/quiz/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          conceptId,
          attemptId: session.attemptId,
          questionId: currentQuestion.id,
          selectedIndex,
          sequenceIndex: quizState.questionIndex,
          quizState: {
            currentDifficulty: quizState.currentDifficulty,
            consecutiveCorrect: quizState.consecutiveCorrect,
            consecutiveIncorrect: quizState.consecutiveIncorrect,
          },
        }),
      })
      const data: AnswerResult = await res.json()
      setAnswerResult(data)

      // Record history
      setHistory(prev => [...prev, {
        questionIndex: quizState.questionIndex,
        difficulty: quizState.currentDifficulty,
        wasCorrect: data.wasCorrect,
        question: currentQuestion.prompt.slice(0, 60) + (currentQuestion.prompt.length > 60 ? '...' : ''),
      }])
    } catch {
      setError('Failed to submit answer')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleNext() {
    if (!answerResult || !session) return

    const nextIndex = quizState.questionIndex + 1

    // Check if quiz is complete
    if (nextIndex >= QUIZ_LENGTH || !answerResult.nextQuestion) {
      await completeQuiz()
      return
    }

    // Advance to next question
    setQuizState({
      ...answerResult.nextState,
      questionIndex: nextIndex,
    })
    setCurrentQuestion(answerResult.nextQuestion)
    setSelectedAnswer(null)
    setAnswerResult(null)
  }

  async function completeQuiz() {
    if (!session) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/quiz/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId,
          conceptId,
          attemptId: session.attemptId,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setCompletionData(data)
        setCompleted(true)
      }
    } catch {
      setError('Failed to complete quiz')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse-soft text-5xl mb-4">🧩</div>
          <p className="text-[#8b95a8]">Preparing adaptive quiz...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-content flex items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-danger-400 mb-4">{error}</p>
          <button onClick={() => router.push(`/path?studentId=${studentId}${subjectId ? `&subjectId=${subjectId}` : ''}`)} className="btn-secondary">← Back to Path</button>
        </div>
      </div>
    )
  }

  // Completion screen
  if (completed && completionData) {
    const { quiz, mastery } = completionData
    const resolvedSubjectId = subjectId || completionData.subjectId
    const masteryChanged = mastery.newMastery > mastery.previousMastery ? 'improved' :
                           mastery.newMastery < mastery.previousMastery ? 'decreased' : 'unchanged'
    return (
      <div className="page-container">
        <div className="page-content animate-fade-in">
          <div className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="text-6xl mb-4">
                {quiz.scorePercent >= 70 ? '🏆' : quiz.scorePercent >= 40 ? '📈' : '💪'}
              </div>
              <h1 className="text-3xl font-bold text-gradient mb-2">Quiz Complete!</h1>
              <p className="text-[#8b95a8]">{session?.conceptName}</p>
            </div>

            {/* Score */}
            <div className="card mb-4 text-center">
              <div className="text-5xl font-extrabold text-[#e8eaf0] mb-2">
                {quiz.scorePercent.toFixed(0)}%
              </div>
              <div className="text-[#8b95a8] mb-1">
                {quiz.correctCount} / {quiz.totalQuestions} correct
              </div>
            </div>

            {/* Mastery update */}
            <div className="card mb-4">
              <h3 className="font-semibold text-[#e8eaf0] mb-3">Mastery Update</h3>
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#8b95a8]">{mastery.previousMastery.toFixed(1)}%</div>
                  <div className="text-xs text-[#5a6478]">Before</div>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <span className={`text-2xl ${masteryChanged === 'improved' ? 'text-success-400' : masteryChanged === 'decreased' ? 'text-danger-400' : 'text-[#5a6478]'}`}>
                    {masteryChanged === 'improved' ? '↑' : masteryChanged === 'decreased' ? '↓' : '→'}
                  </span>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[#e8eaf0]">{mastery.newMastery.toFixed(1)}%</div>
                  <div className="text-xs text-[#5a6478]">After</div>
                </div>
              </div>
              <div className="mt-2 text-xs text-[#5a6478] text-center">
                Formula: {mastery.previousMastery.toFixed(1)} × 0.7 + {quiz.scorePercent.toFixed(1)} × 0.3 = {mastery.newMastery.toFixed(1)}
              </div>
            </div>

            {/* Difficulty trajectory — proves adaptivity */}
            <div className="card mb-6">
              <h3 className="font-semibold text-[#e8eaf0] mb-3">
                Difficulty Trajectory <span className="text-xs text-brand-400">(proves adaptive quiz)</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {quiz.difficultyTrajectory.map((q: any, i: number) => (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs border ${
                      q.isCorrect ? 'bg-success-500/20 border-success-500/40' : 'bg-danger-500/20 border-danger-500/40'
                    }`}>
                      {q.isCorrect ? '✓' : '✗'}
                    </div>
                    <div className={`text-xs px-1.5 py-0.5 rounded border ${DIFFICULTY_COLORS[q.difficulty as keyof typeof DIFFICULTY_COLORS]}`}>
                      {q.difficulty[0]}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-2 text-xs text-[#5a6478]">
                <span>E = Easy · M = Medium · H = Hard</span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => router.push(`/path?studentId=${studentId}${resolvedSubjectId ? `&subjectId=${resolvedSubjectId}` : ''}`)} className="btn-secondary">
                ← Back to Path
              </button>
              <button
                id="view-recommendations-btn"
                onClick={() => router.push(`/recommendations?studentId=${studentId}${resolvedSubjectId ? `&subjectId=${resolvedSubjectId}` : ''}`)}
                className="btn-primary"
              >
                View Updated Recommendations →
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!currentQuestion || !session) return null

  const progress = (quizState.questionIndex / QUIZ_LENGTH) * 100

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-[#5a6478] mb-0.5 uppercase tracking-wider">Adaptive Quiz</div>
            <h1 className="font-bold text-[#e8eaf0]">{session.conceptName}</h1>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <div className="text-xs text-[#5a6478]">Question</div>
              <div className="text-sm font-bold text-[#e8eaf0]">{quizState.questionIndex + 1}/{QUIZ_LENGTH}</div>
            </div>
            <div className={`px-3 py-1.5 rounded-lg border text-sm font-bold ${DIFFICULTY_COLORS[quizState.currentDifficulty as keyof typeof DIFFICULTY_COLORS]}`}>
              {quizState.currentDifficulty}
            </div>
          </div>
        </div>
        <div className="max-w-4xl mx-auto mt-3">
          <div className="mastery-bar">
            <div className="mastery-bar-fill bg-brand-500" style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      <div className="page-content">
        <div className="animate-slide-up max-w-2xl mx-auto">
          {/* Difficulty indicator */}
          <div className="flex items-center gap-3 mb-6">
            <span className={`px-3 py-1.5 rounded-lg border text-sm font-semibold ${DIFFICULTY_COLORS[quizState.currentDifficulty as keyof typeof DIFFICULTY_COLORS]}`}>
              {quizState.currentDifficulty === 'EASY' ? '🟢' : quizState.currentDifficulty === 'MEDIUM' ? '🟡' : '🔴'} {quizState.currentDifficulty}
            </span>
            {quizState.consecutiveCorrect > 0 && (
              <span className="text-xs text-success-400 bg-success-500/10 px-2 py-1 rounded-full border border-success-500/20">
                🔥 {quizState.consecutiveCorrect} correct streak
              </span>
            )}
            {quizState.consecutiveIncorrect > 0 && (
              <span className="text-xs text-warning-400 bg-warning-500/10 px-2 py-1 rounded-full border border-warning-500/20">
                {quizState.consecutiveIncorrect} miss streak
              </span>
            )}
          </div>

          {/* Question card */}
          <div className="card mb-6">
            <p className="text-base font-medium text-[#e8eaf0] leading-relaxed">
              {currentQuestion.prompt}
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3 mb-6">
            {currentQuestion.options.map((option, idx) => {
              let style = 'bg-[#161b27] border-[#2a3347] text-[#e8eaf0] hover:border-brand-500/40 hover:bg-[#1c2333]'

              if (answerResult !== null) {
                if (idx === answerResult.correctIndex) {
                  style = 'bg-success-500/20 border-success-500 text-success-300'
                } else if (idx === selectedAnswer && !answerResult.wasCorrect) {
                  style = 'bg-danger-500/20 border-danger-500 text-danger-300'
                } else {
                  style = 'bg-[#161b27] border-[#2a3347] text-[#5a6478] opacity-60'
                }
              } else if (selectedAnswer === idx) {
                style = 'bg-brand-500/20 border-brand-500 text-brand-300'
              }

              return (
                <button
                  key={idx}
                  id={`quiz-option-${idx}`}
                  onClick={() => handleAnswer(idx)}
                  disabled={!!answerResult || submitting}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${style} disabled:cursor-not-allowed`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      answerResult && idx === answerResult.correctIndex ? 'border-success-400 bg-success-500 text-white' :
                      answerResult && idx === selectedAnswer ? 'border-danger-400 bg-danger-500 text-white' :
                      'border-[#3a4a63] text-[#5a6478]'
                    }`}>
                      {answerResult && idx === answerResult.correctIndex ? '✓' :
                       answerResult && idx === selectedAnswer && !answerResult.wasCorrect ? '✗' :
                       String.fromCharCode(65 + idx)}
                    </div>
                    <span className="text-sm leading-relaxed">{option}</span>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Feedback + Next */}
          {answerResult && (
            <div className="animate-slide-up">
              <div className={`card mb-4 ${answerResult.wasCorrect ? 'border-success-500/40 bg-success-500/5' : 'border-danger-500/40 bg-danger-500/5'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{answerResult.wasCorrect ? '✅' : '❌'}</span>
                    <div>
                      <div className={`font-semibold ${answerResult.wasCorrect ? 'text-success-400' : 'text-danger-400'}`}>
                        {answerResult.wasCorrect ? 'Correct!' : 'Incorrect'}
                      </div>
                      {!answerResult.wasCorrect && (
                        <div className="text-xs text-[#8b95a8]">
                          Correct answer: {String.fromCharCode(65 + answerResult.correctIndex)}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-[#5a6478]">Next difficulty</div>
                    <div className={`font-bold text-sm ${
                      answerResult.nextState.currentDifficulty === 'EASY' ? 'text-success-400' :
                      answerResult.nextState.currentDifficulty === 'MEDIUM' ? 'text-warning-400' : 'text-danger-400'
                    }`}>
                      {answerResult.nextState.currentDifficulty}
                    </div>
                  </div>
                </div>
              </div>

              <button
                id="next-question-btn"
                onClick={handleNext}
                disabled={submitting}
                className="btn-primary w-full"
              >
                {quizState.questionIndex + 1 >= QUIZ_LENGTH ? 'Complete Quiz →' : 'Next Question →'}
              </button>
            </div>
          )}

          {/* History dots */}
          {history.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {history.map((h, i) => (
                <div key={i} title={`Q${i + 1}: ${h.difficulty} — ${h.wasCorrect ? 'Correct' : 'Wrong'}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                    h.wasCorrect ? 'bg-success-500/30 text-success-400' : 'bg-danger-500/30 text-danger-400'
                  }`}
                >
                  {h.wasCorrect ? '✓' : '✗'}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#8b95a8]">Loading...</div>}>
      <QuizContent />
    </Suspense>
  )
}
