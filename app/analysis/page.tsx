'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface ConceptPerformance {
  conceptId: string
  conceptName: string
  topicName: string
  masteryPercent: number
  status: 'STRONG' | 'DEVELOPING' | 'GAP'
  lastScorePercent: number | null
  attemptsCount: number
}

interface AnalysisData {
  student: { id: string; name: string }
  overallMastery: number
  lastDiagnosticScore: number | null
  performances: ConceptPerformance[]
  summary: {
    strongCount: number
    developingCount: number
    gapCount: number
    strengths: string[]
    developing: string[]
    gaps: string[]
  }
}

const STATUS_CONFIG = {
  STRONG: { label: 'Strong', color: 'success', bgColor: 'bg-success-500', emoji: '✅' },
  DEVELOPING: { label: 'Developing', color: 'warning', bgColor: 'bg-warning-500', emoji: '📈' },
  GAP: { label: 'Knowledge Gap', color: 'danger', bgColor: 'bg-danger-500', emoji: '⚠️' },
}

function MasteryBar({ percent, status }: { percent: number; status: string }) {
  const colors: Record<string, string> = {
    STRONG: 'bg-gradient-to-r from-success-600 to-success-400',
    DEVELOPING: 'bg-gradient-to-r from-warning-600 to-warning-400',
    GAP: 'bg-gradient-to-r from-danger-600 to-danger-400',
  }
  return (
    <div className="mastery-bar mt-2">
      <div
        className={`mastery-bar-fill ${colors[status] ?? 'bg-brand-500'}`}
        style={{ width: `${Math.max(2, percent)}%` }}
      />
    </div>
  )
}

function AnalysisContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')

  const [data, setData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId) { router.push('/'); return }
    fetchAnalysis()
  }, [studentId])

  async function fetchAnalysis() {
    try {
      const res = await fetch(`/api/analysis?studentId=${studentId}`)
      const json = await res.json()
      if (json.error) {
        if (json.redirectTo) {
          router.push(json.redirectTo)
          return
        }
        setError(json.error)
        return
      }
      setData(json)
    } catch {
      setError('Failed to load analysis')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse-soft text-5xl mb-4">🔍</div>
          <p className="text-[#8b95a8]">Analyzing your knowledge...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-content flex items-center justify-center">
        <div className="card max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <p className="text-danger-400 mb-4">{error || 'No data found'}</p>
          <button onClick={() => router.push('/')} className="btn-secondary">← Back to Start</button>
        </div>
      </div>
    )
  }

  const overallStatus = data.overallMastery >= 70 ? 'STRONG' : data.overallMastery >= 40 ? 'DEVELOPING' : 'GAP'

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-[#5a6478] mb-0.5 uppercase tracking-wider">Knowledge Analysis</div>
            <h1 className="font-bold text-[#e8eaf0]">{data.student.name}</h1>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => router.push(`/diagnostic?studentId=${studentId}`)}
              className="btn-ghost text-sm"
            >
              Retake Diagnostic
            </button>
            <button
              id="go-to-path-btn"
              onClick={() => router.push(`/path?studentId=${studentId}`)}
              className="btn-primary text-sm"
            >
              View Learning Path →
            </button>
          </div>
        </div>
      </div>

      <div className="page-content animate-fade-in">
        {/* Overall score card */}
        <div className="card mb-8 bg-gradient-card">
          <div className="flex items-center gap-6">
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#2a3347" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={overallStatus === 'STRONG' ? '#22c55e' : overallStatus === 'DEVELOPING' ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${2 * Math.PI * 40 * data.overallMastery / 100} ${2 * Math.PI * 40 * (1 - data.overallMastery / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-[#e8eaf0]">{data.overallMastery.toFixed(0)}%</span>
              </div>
            </div>
            <div>
              <div className="text-sm text-[#5a6478] mb-1">Overall Mastery</div>
              <div className="text-2xl font-bold text-[#e8eaf0] mb-2">
                {STATUS_CONFIG[overallStatus as keyof typeof STATUS_CONFIG].emoji}{' '}
                {STATUS_CONFIG[overallStatus as keyof typeof STATUS_CONFIG].label}
              </div>
              <div className="flex gap-4 text-sm">
                <span className="text-success-400">✓ {data.summary.strongCount} Strong</span>
                <span className="text-warning-400">~ {data.summary.developingCount} Developing</span>
                <span className="text-danger-400">✗ {data.summary.gapCount} Gaps</span>
              </div>
              {data.lastDiagnosticScore !== null && (
                <div className="text-xs text-[#5a6478] mt-1">
                  Last diagnostic score: {data.lastDiagnosticScore.toFixed(0)}%
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Summary sections */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {data.summary.gaps.length > 0 && (
            <div className="card border-danger-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">⚠️</span>
                <span className="font-semibold text-danger-400">Knowledge Gaps</span>
                <span className="badge-gap ml-auto">{data.summary.gaps.length}</span>
              </div>
              <div className="space-y-1">
                {data.summary.gaps.map(name => (
                  <div key={name} className="text-sm text-[#8b95a8] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger-500 flex-shrink-0" />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.summary.developing.length > 0 && (
            <div className="card border-warning-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">📈</span>
                <span className="font-semibold text-warning-400">Developing</span>
                <span className="badge-developing ml-auto">{data.summary.developing.length}</span>
              </div>
              <div className="space-y-1">
                {data.summary.developing.map(name => (
                  <div key={name} className="text-sm text-[#8b95a8] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-warning-500 flex-shrink-0" />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
          {data.summary.strengths.length > 0 && (
            <div className="card border-success-500/30">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xl">✅</span>
                <span className="font-semibold text-success-400">Strengths</span>
                <span className="badge-strong ml-auto">{data.summary.strengths.length}</span>
              </div>
              <div className="space-y-1">
                {data.summary.strengths.map(name => (
                  <div key={name} className="text-sm text-[#8b95a8] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-success-500 flex-shrink-0" />
                    {name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Per-concept breakdown */}
        <div className="mb-6">
          <h2 className="section-title">Concept Breakdown</h2>
          <p className="section-subtitle mb-4">Mastery computed using: newMastery = previousMastery × 0.7 + score × 0.3</p>
        </div>

        <div className="space-y-3">
          {data.performances.map(perf => {
            const cfg = STATUS_CONFIG[perf.status]
            return (
              <div key={perf.conceptId} className="card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-[#e8eaf0]">{perf.conceptName}</span>
                    <span className="text-xs text-[#5a6478]">{perf.topicName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#e8eaf0]">
                      {perf.masteryPercent.toFixed(1)}%
                    </span>
                    <span className={`badge-${perf.status.toLowerCase() === 'strong' ? 'strong' : perf.status.toLowerCase() === 'developing' ? 'developing' : 'gap'}`}>
                      {cfg.emoji} {cfg.label}
                    </span>
                  </div>
                </div>
                <MasteryBar percent={perf.masteryPercent} status={perf.status} />
                <div className="flex gap-4 mt-2 text-xs text-[#5a6478]">
                  {perf.lastScorePercent !== null && (
                    <span>Last score: {perf.lastScorePercent.toFixed(0)}%</span>
                  )}
                  <span>{perf.attemptsCount} attempt{perf.attemptsCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <button
            id="view-learning-path-btn"
            onClick={() => router.push(`/path?studentId=${studentId}`)}
            className="btn-primary"
          >
            View Personalized Learning Path →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AnalysisPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#8b95a8]">Loading...</div>}>
      <AnalysisContent />
    </Suspense>
  )
}
