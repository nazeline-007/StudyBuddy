'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface Student {
  id: string
  name: string
  hasPerformance: boolean
  overallMastery: number | null
}

export default function StartPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [newStudentName, setNewStudentName] = useState('')
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchStudents()
  }, [])

  async function fetchStudents() {
    setLoading(true)
    try {
      const res = await fetch('/api/students')
      const data = await res.json()
      setStudents(data.students ?? [])
    } catch {
      setError('Failed to load students')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateStudent(e: React.FormEvent) {
    e.preventDefault()
    if (!newStudentName.trim()) return
    setCreating(true)
    setError('')
    try {
      const res = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStudentName.trim() }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error ?? 'Failed to create student')
      router.push(`/diagnostic?studentId=${data.student.id}`)
    } catch (err: any) {
      setError(err.message)
      setCreating(false)
    }
  }

  function handleSelectStudent(student: Student) {
    if (student.hasPerformance) {
      router.push(`/analysis?studentId=${student.id}`)
    } else {
      router.push(`/diagnostic?studentId=${student.id}`)
    }
  }

  return (
    <div className="page-container">
      {/* Hero Header */}
      <div className="relative overflow-hidden bg-[#0f1117] border-b border-[#2a3347]">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-indigo-500/5" />
        <div className="relative max-w-4xl mx-auto px-6 py-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-sm font-medium mb-6">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            AI-Powered Adaptive Learning
          </div>
          <h1 className="text-5xl font-extrabold text-gradient mb-4">
            StudyBuddy
          </h1>
          <p className="text-xl text-[#8b95a8] max-w-2xl mx-auto mb-2">
            Master <span className="text-[#e8eaf0] font-semibold">Data Structures</span> at your own pace.
          </p>
          <p className="text-[#5a6478] text-base max-w-xl mx-auto">
            Intelligent diagnostics · Personalized learning paths · Adaptive quizzes · AI-powered explanations
          </p>
        </div>
      </div>

      <div className="page-content">
        {/* How it works */}
        <div className="mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '1', icon: '🎯', label: 'Diagnostic', desc: 'Assess your knowledge' },
              { step: '2', icon: '🔍', label: 'Analyze', desc: 'Identify your gaps' },
              { step: '3', icon: '🗺️', label: 'Learn', desc: 'Personalized path' },
              { step: '4', icon: '🧩', label: 'Adapt', desc: 'Adaptive quiz' },
            ].map(item => (
              <div key={item.step} className="card text-center">
                <div className="text-3xl mb-2">{item.icon}</div>
                <div className="text-xs font-bold text-brand-400 mb-1">Step {item.step}</div>
                <div className="text-sm font-semibold text-[#e8eaf0]">{item.label}</div>
                <div className="text-xs text-[#5a6478] mt-1">{item.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* New Student */}
          <div className="card">
            <h2 className="text-lg font-bold text-[#e8eaf0] mb-1">Start Fresh</h2>
            <p className="text-sm text-[#8b95a8] mb-5">Enter your name to begin the diagnostic assessment.</p>
            <form onSubmit={handleCreateStudent} className="space-y-4">
              <input
                id="student-name-input"
                type="text"
                className="input"
                placeholder="Your name..."
                value={newStudentName}
                onChange={e => setNewStudentName(e.target.value)}
                maxLength={50}
              />
              {error && (
                <p className="text-danger-400 text-sm">{error}</p>
              )}
              <button
                id="start-diagnostic-btn"
                type="submit"
                disabled={creating || !newStudentName.trim()}
                className="btn-primary w-full"
              >
                {creating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Creating...
                  </span>
                ) : 'Start Diagnostic Assessment →'}
              </button>
            </form>
          </div>

          {/* Existing Students */}
          <div className="card">
            <h2 className="text-lg font-bold text-[#e8eaf0] mb-1">Continue Learning</h2>
            <p className="text-sm text-[#8b95a8] mb-5">Select a student to resume where you left off.</p>
            {loading ? (
              <div className="text-center py-8 text-[#5a6478]">
                <div className="animate-spin text-3xl mb-2">⏳</div>
                Loading students...
              </div>
            ) : students.length === 0 ? (
              <div className="text-center py-8 text-[#5a6478] text-sm">
                No students yet. Start fresh on the left!
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {students.map(student => (
                  <button
                    key={student.id}
                    id={`select-student-${student.id}`}
                    onClick={() => handleSelectStudent(student)}
                    className="w-full text-left card-hover flex items-center justify-between p-4 rounded-xl"
                  >
                    <div>
                      <div className="font-semibold text-[#e8eaf0] text-sm">{student.name}</div>
                      <div className="text-xs text-[#5a6478] mt-0.5">
                        {student.hasPerformance
                          ? `Mastery: ${student.overallMastery?.toFixed(0) ?? 0}%`
                          : 'Not started yet'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {student.hasPerformance ? (
                        <span className={`badge-${
                          (student.overallMastery ?? 0) >= 70 ? 'strong' :
                          (student.overallMastery ?? 0) >= 40 ? 'developing' : 'gap'
                        }`}>
                          {(student.overallMastery ?? 0) >= 70 ? 'Strong' :
                           (student.overallMastery ?? 0) >= 40 ? 'Developing' : 'Gap'}
                        </span>
                      ) : (
                        <span className="text-[#5a6478] text-xs">New</span>
                      )}
                      <svg className="w-4 h-4 text-[#5a6478]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Concepts covered */}
        <div className="mt-12 card">
          <h3 className="text-sm font-bold text-[#8b95a8] uppercase tracking-wider mb-4">
            7 Concepts Covered
          </h3>
          <div className="flex flex-wrap gap-2">
            {['Arrays', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Binary Trees', 'Tree Traversal'].map(c => (
              <span key={c} className="px-3 py-1.5 rounded-lg bg-[#161b27] border border-[#2a3347] text-sm text-[#8b95a8] font-medium">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
