'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface PathItem {
  id?: string
  conceptId: string
  conceptName: string
  topicName?: string
  orderIndex: number
  reason: string
  masteryPercent: number
  status: 'STRONG' | 'DEVELOPING' | 'GAP'
  lastScorePercent: number | null
}

interface PathData {
  student: { id: string; name: string }
  pathId: string
  generatedAt?: string
  items: PathItem[]
}

const STATUS_CONFIG = {
  STRONG:     { label: 'Strong',         badge: 'badge-strong',     color: 'border-l-success-500',  icon: '✅', priority: 'Review' },
  DEVELOPING: { label: 'Developing',     badge: 'badge-developing', color: 'border-l-warning-500',  icon: '📈', priority: 'Practice' },
  GAP:        { label: 'Knowledge Gap',  badge: 'badge-gap',        color: 'border-l-danger-500',   icon: '⚠️', priority: 'Priority' },
}

function PathContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')
  const subjectId = searchParams.get('subjectId')

  const [data, setData] = useState<PathData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!studentId) { router.push('/'); return }
    fetchPath()
  }, [studentId, subjectId])

  async function fetchPath() {
    try {
      const url = subjectId
        ? `/api/path?studentId=${studentId}&subjectId=${subjectId}`
        : `/api/path?studentId=${studentId}`
      const res = await fetch(url)
      const json = await res.json()
      if (json.error) {
        if (json.redirectTo) { router.push(json.redirectTo); return }
        setError(json.error)
        return
      }
      setData(json)
    } catch {
      setError('Failed to load learning path')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-pulse-soft text-5xl mb-4">🗺️</div>
          <p className="text-[#8b95a8]">Building your personalized path...</p>
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="page-content flex items-center justify-center">
        <div className="card max-w-md text-center">
          <p className="text-danger-400 mb-4">{error || 'No path data'}</p>
          <button onClick={() => router.push('/')} className="btn-secondary">← Back</button>
        </div>
      </div>
    )
  }

  const gapCount = data.items.filter(i => i.status === 'GAP').length
  const devCount = data.items.filter(i => i.status === 'DEVELOPING').length
  const strongCount = data.items.filter(i => i.status === 'STRONG').length

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-[#5a6478] mb-0.5 uppercase tracking-wider">Personalized Learning Path</div>
            <h1 className="font-bold text-[#e8eaf0]">{data.student.name}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push(`/analysis?studentId=${studentId}${subjectId ? `&subjectId=${subjectId}` : ''}`)} className="btn-ghost text-sm">
              ← Analysis
            </button>
            <button
              id="regenerate-path-btn"
              onClick={async () => {
                setLoading(true)
                const regenUrl = subjectId
                  ? `/api/path?studentId=${studentId}&subjectId=${subjectId}&regenerate=true`
                  : `/api/path?studentId=${studentId}&regenerate=true`
                const res = await fetch(regenUrl)
                const json = await res.json()
                setData(json)
                setLoading(false)
              }}
              className="btn-secondary text-sm"
            >
              🔄 Regenerate
            </button>
          </div>
        </div>
      </div>

      <div className="page-content animate-fade-in">
        {/* Path summary */}
        <div className="card mb-8 bg-gradient-card">
          <h2 className="text-lg font-bold text-[#e8eaf0] mb-3">Your Learning Plan</h2>
          <p className="text-sm text-[#8b95a8] mb-4">
            Concepts are ordered based on your knowledge gaps, prerequisite relationships, and current mastery levels.
            Tackle them in this order for the most effective learning experience.
          </p>
          <div className="flex flex-wrap gap-3">
            {gapCount > 0 && (
              <span className="badge-gap">{gapCount} gap{gapCount > 1 ? 's' : ''} to close</span>
            )}
            {devCount > 0 && (
              <span className="badge-developing">{devCount} to develop</span>
            )}
            {strongCount > 0 && (
              <span className="badge-strong">{strongCount} strong concept{strongCount > 1 ? 's' : ''}</span>
            )}
          </div>
        </div>

        {/* Learning path list */}
        <div className="space-y-3">
          {data.items.map((item, idx) => {
            const cfg = STATUS_CONFIG[item.status]
            const isBlocked = item.reason.toLowerCase().includes('blocked')
            return (
              <div
                key={item.conceptId}
                className={`card border-l-4 ${
                  item.status === 'GAP' ? 'border-l-danger-500' :
                  item.status === 'DEVELOPING' ? 'border-l-warning-500' :
                  'border-l-success-500'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    {/* Order badge */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-full bg-[#161b27] border border-[#3a4a63] flex items-center justify-center">
                      <span className="text-sm font-bold text-[#e8eaf0]">{idx + 1}</span>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[#e8eaf0]">{item.conceptName}</h3>
                        {item.topicName && (
                          <span className="text-xs text-[#5a6478]">· {item.topicName}</span>
                        )}
                        <span className={cfg.badge}>{cfg.icon} {cfg.label}</span>
                        {isBlocked && (
                          <span className="text-xs text-[#5a6478] bg-[#161b27] px-2 py-0.5 rounded">🔒 Blocked</span>
                        )}
                      </div>
                      <p className="text-sm text-[#8b95a8] mb-2">{item.reason}</p>
                      <div className="mastery-bar w-48">
                        <div
                          className={`mastery-bar-fill ${
                            item.status === 'STRONG' ? 'bg-gradient-to-r from-success-600 to-success-400' :
                            item.status === 'DEVELOPING' ? 'bg-gradient-to-r from-warning-600 to-warning-400' :
                            'bg-gradient-to-r from-danger-600 to-danger-400'
                          }`}
                          style={{ width: `${Math.max(2, item.masteryPercent)}%` }}
                        />
                      </div>
                      <span className="text-xs text-[#5a6478] mt-1 inline-block">
                        {item.masteryPercent.toFixed(1)}% mastery
                      </span>
                    </div>
                  </div>

                  <div className="flex-shrink-0 flex flex-col gap-2">
                    <button
                      id={`learn-${item.conceptId}`}
                      onClick={() => router.push(`/learn?studentId=${studentId}&conceptId=${item.conceptId}${subjectId ? `&subjectId=${subjectId}` : ''}`)}
                      className="btn-primary text-sm px-4 py-2 whitespace-nowrap"
                    >
                      Learn →
                    </button>
                    <button
                      id={`quiz-${item.conceptId}`}
                      onClick={() => router.push(`/quiz?studentId=${studentId}&conceptId=${item.conceptId}${subjectId ? `&subjectId=${subjectId}` : ''}`)}
                      className="btn-secondary text-sm px-4 py-2 whitespace-nowrap"
                    >
                      Quiz
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {data.generatedAt && (
          <p className="text-center text-xs text-[#5a6478] mt-6">
            Path generated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        )}
      </div>
    </div>
  )
}

export default function PathPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#8b95a8]">Loading...</div>}>
      <PathContent />
    </Suspense>
  )
}
