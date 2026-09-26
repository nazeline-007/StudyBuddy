'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface Question {
  id: string
  conceptId: string
  conceptName: string
  difficulty: string
  prompt: string
  options: string[]
}

interface Student {
  id: string
  name: string
}

function DiagnosticContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')

  const [student, setStudent] = useState<Student | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [currentQuestion, setCurrentQuestion] = useState(0)

  useEffect(() => {
    if (!studentId) {
      router.push('/')
      return
    }
    fetchDiagnostic()
  }, [studentId])

  async function fetchDiagnostic() {
    try {
      const res = await fetch(`/api/diagnostic?studentId=${studentId}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setStudent(data.student)
      setQuestions(data.questions)
    } catch {
      setError('Failed to load diagnostic questions')
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(questionId: string, index: number) {
    setAnswers(prev => ({ ...prev, [questionId]: index }))
    // Auto-advance to next question
    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(prev => prev + 1)
      }
    }, 400)
  }

  async function handleSubmit() {
    const unanswered = questions.filter(q => answers[q.id] === undefined)
    if (unanswered.length > 0) {
      setError(`Please answer all questions. ${unanswered.length} question(s) remaining.`)
      // Jump to first unanswered
      const firstUnansweredIdx = questions.findIndex(q => answers[q.id] === undefined)
      setCurrentQuestion(firstUnansweredIdx)
      return
    }

    setSubmitting(true)
    setError('')

    try {
      const payload = {
        studentId,
        answers: questions.map(q => ({
          questionId: q.id,
          selectedIndex: answers[q.id],
        })),
      }

      const res = await fetch('/api/diagnostic/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!data.success) throw new Error(data.error ?? 'Submit failed')

      router.push(`/analysis?studentId=${studentId}`)
    } catch (err: any) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  const progress = questions.length > 0 ? ((currentQuestion + 1) / questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length
  const q = questions[currentQuestion]

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin text-5xl mb-4">🎯</div>
            <p className="text-[#8b95a8]">Loading assessment...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && questions.length === 0) {
    return (
      <div className="page-container">
        <div className="page-content flex items-center justify-center">
          <div className="card max-w-md text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-danger-400 mb-4">{error}</p>
            <button onClick={() => router.push('/')} className="btn-secondary">
              ← Back to Start
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-sm text-[#5a6478] mb-0.5">Diagnostic Assessment</div>
            <div className="font-semibold text-[#e8eaf0]">{student?.name}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-[#5a6478]">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            <div className="text-sm font-semibold text-brand-400">
              {answeredCount}/{questions.length} answered
            </div>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-4xl mx-auto mt-3">
          <div className="mastery-bar">
            <div
              className="mastery-bar-fill bg-brand-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="page-content">
        {/* Concept badge */}
        {q && (
          <div className="animate-slide-up">
            <div className="flex items-center gap-3 mb-6">
              <span className="px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-semibold">
                {q.conceptName}
              </span>
              <span className={`badge-${q.difficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}`}>
                {q.difficulty}
              </span>
            </div>

            {/* Question */}
            <div className="card mb-6">
              <p className="text-lg font-medium text-[#e8eaf0] leading-relaxed">
                {q.prompt}
              </p>
            </div>

            {/* Options */}
            <div className="space-y-3 mb-8">
              {(q.options as string[]).map((option, idx) => {
                const isSelected = answers[q.id] === idx
                return (
                  <button
                    key={idx}
                    id={`option-${idx}`}
                    onClick={() => handleAnswer(q.id, idx)}
                    className={`w-full text-left p-4 rounded-xl border transition-all duration-200 ${
                      isSelected
                        ? 'bg-brand-500/20 border-brand-500 text-brand-300'
                        : 'bg-[#161b27] border-[#2a3347] text-[#e8eaf0] hover:border-brand-500/40 hover:bg-[#1c2333]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold flex-shrink-0 transition-colors ${
                        isSelected
                          ? 'border-brand-400 bg-brand-500 text-white'
                          : 'border-[#3a4a63] text-[#5a6478]'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </div>
                      <span className="text-sm leading-relaxed">{option}</span>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setCurrentQuestion(prev => Math.max(0, prev - 1))}
                disabled={currentQuestion === 0}
                className="btn-ghost"
              >
                ← Previous
              </button>

              {currentQuestion < questions.length - 1 ? (
                <button
                  onClick={() => setCurrentQuestion(prev => Math.min(questions.length - 1, prev + 1))}
                  className="btn-primary"
                >
                  Next →
                </button>
              ) : (
                <button
                  id="submit-diagnostic-btn"
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Submitting...
                    </span>
                  ) : `Submit Assessment (${answeredCount}/${questions.length})`}
                </button>
              )}
            </div>

            {error && (
              <p className="text-danger-400 text-sm mt-4 text-center">{error}</p>
            )}
          </div>
        )}

        {/* Question navigator dots */}
        <div className="mt-8 flex flex-wrap gap-2 justify-center">
          {questions.map((q, idx) => (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              title={`Q${idx + 1}: ${q.conceptName}`}
              className={`w-8 h-8 rounded-full text-xs font-semibold transition-all duration-200 ${
                idx === currentQuestion
                  ? 'bg-brand-500 text-white scale-110'
                  : answers[q.id] !== undefined
                    ? 'bg-success-500/30 text-success-400 border border-success-500/40'
                    : 'bg-[#2a3347] text-[#5a6478] hover:bg-[#3a4a63]'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function DiagnosticPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#8b95a8]">Loading...</div>}>
      <DiagnosticContent />
    </Suspense>
  )
}
