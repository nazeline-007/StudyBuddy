'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

interface AIContent {
  content: string
  isAIGenerated: boolean
  error?: string
  context: {
    conceptName: string
    masteryPercent: number
    currentDifficulty: string
    weakAreas: string[]
  }
}

// Simple markdown renderer (handles bold, code blocks, headers, lists)
function MarkdownContent({ text }: { text: string }) {
  if (!text) return null

  // Replace markdown with HTML-safe JSX
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []
  let inCodeBlock = false
  let codeLines: string[] = []
  let key = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={key++} className="bg-[#0f1117] border border-[#2a3347] rounded-lg p-4 my-3 overflow-x-auto text-xs font-mono text-[#e8eaf0] leading-relaxed">
            <code>{codeLines.join('\n')}</code>
          </pre>
        )
        codeLines = []
        inCodeBlock = false
      } else {
        inCodeBlock = true
      }
      continue
    }

    if (inCodeBlock) {
      codeLines.push(line)
      continue
    }

    if (line.startsWith('## ')) {
      elements.push(<h3 key={key++} className="text-lg font-bold text-[#e8eaf0] mt-5 mb-2">{line.slice(3)}</h3>)
    } else if (line.startsWith('# ')) {
      elements.push(<h2 key={key++} className="text-xl font-bold text-gradient mt-4 mb-3">{line.slice(2)}</h2>)
    } else if (line.startsWith('**') && line.endsWith('**')) {
      elements.push(<p key={key++} className="font-semibold text-[#e8eaf0] my-1">{line.slice(2, -2)}</p>)
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(
        <li key={key++} className="text-sm text-[#8b95a8] ml-4 my-0.5">
          {renderInlineMarkdown(line.slice(2))}
        </li>
      )
    } else if (line.trim() === '') {
      elements.push(<div key={key++} className="my-2" />)
    } else if (line.startsWith('|')) {
      // Table row — simple rendering
      elements.push(
        <div key={key++} className="text-xs text-[#8b95a8] font-mono border-b border-[#2a3347] py-1">
          {line}
        </div>
      )
    } else {
      elements.push(
        <p key={key++} className="text-sm text-[#8b95a8] leading-relaxed">
          {renderInlineMarkdown(line)}
        </p>
      )
    }
  }

  return <div className="space-y-1">{elements}</div>
}

function renderInlineMarkdown(text: string): React.ReactNode {
  // Handle **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-semibold text-[#e8eaf0]">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={i} className="px-1.5 py-0.5 bg-[#0f1117] border border-[#2a3347] rounded text-brand-300 text-xs font-mono">{part.slice(1, -1)}</code>
    }
    return part
  })
}

function LearnContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const studentId = searchParams.get('studentId')
  const conceptId = searchParams.get('conceptId')
  const subjectId = searchParams.get('subjectId')

  const [activeTab, setActiveTab] = useState<'explanation' | 'example' | 'practice_question'>('explanation')
  const [contents, setContents] = useState<Record<string, AIContent | null>>({})
  const [loading, setLoading] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!studentId || !conceptId) { router.push('/'); return }
    loadContent('explanation')
  }, [studentId, conceptId])

  async function loadContent(type: 'explanation' | 'example' | 'practice_question') {
    if (contents[type]) return // already loaded
    setLoading(prev => ({ ...prev, [type]: true }))
    try {
      const res = await fetch('/api/ai-support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, conceptId, requestType: type }),
      })
      const json = await res.json()
      if (json.success) {
        setContents(prev => ({ ...prev, [type]: json }))
      }
    } catch (err) {
      console.error('AI support error:', err)
    } finally {
      setLoading(prev => ({ ...prev, [type]: false }))
    }
  }

  async function handleTabChange(tab: 'explanation' | 'example' | 'practice_question') {
    setActiveTab(tab)
    await loadContent(tab)
  }

  async function handleRetry() {
    // Force reload current tab
    setContents(prev => ({ ...prev, [activeTab]: null }))
    await loadContent(activeTab)
  }

  const currentContent = contents[activeTab]
  const isLoading = loading[activeTab]
  const ctx = currentContent?.context

  const TABS = [
    { key: 'explanation' as const, label: '📖 Explanation', desc: 'Core concepts' },
    { key: 'example' as const, label: '💻 Example', desc: 'Code walkthrough' },
    { key: 'practice_question' as const, label: '🧩 Practice', desc: 'Try it yourself' },
  ]

  return (
    <div className="page-container">
      {/* Header */}
      <div className="page-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <div className="text-xs text-[#5a6478] mb-0.5 uppercase tracking-wider">Learning Support</div>
            <h1 className="font-bold text-[#e8eaf0]">{ctx?.conceptName ?? 'Loading...'}</h1>
          </div>
          <div className="flex gap-3">
            <button onClick={() => router.push(`/path?studentId=${studentId}${subjectId ? `&subjectId=${subjectId}` : ''}`)} className="btn-ghost text-sm">
              ← Path
            </button>
            <button
              id="go-to-quiz-btn"
              onClick={() => router.push(`/quiz?studentId=${studentId}&conceptId=${conceptId}${subjectId ? `&subjectId=${subjectId}` : ''}`)}
              className="btn-primary text-sm"
            >
              Take Quiz →
            </button>
          </div>
        </div>
      </div>

      <div className="page-content animate-fade-in">
        {/* Context bar */}
        {ctx && (
          <div className="card mb-6 flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5a6478]">Mastery</span>
              <span className="font-bold text-[#e8eaf0]">{ctx.masteryPercent.toFixed(0)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#5a6478]">Difficulty</span>
              <span className={`badge-${ctx.currentDifficulty.toLowerCase() as 'easy' | 'medium' | 'hard'}`}>
                {ctx.currentDifficulty}
              </span>
            </div>
            {ctx.weakAreas.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs text-[#5a6478]">Weak areas:</span>
                {ctx.weakAreas.slice(0, 3).map(a => (
                  <span key={a} className="text-xs px-2 py-0.5 rounded bg-danger-500/10 text-danger-400 border border-danger-500/20">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-[#2a3347] pb-4">
          {TABS.map(tab => (
            <button
              key={tab.key}
              id={`tab-${tab.key}`}
              onClick={() => handleTabChange(tab.key)}
              className={`flex-1 text-center py-3 px-4 rounded-xl transition-all duration-200 ${
                activeTab === tab.key
                  ? 'bg-brand-500/20 border border-brand-500/40 text-brand-300'
                  : 'text-[#5a6478] hover:text-[#8b95a8] hover:bg-[#161b27]'
              }`}
            >
              <div className="text-sm font-semibold">{tab.label}</div>
              <div className="text-xs opacity-70">{tab.desc}</div>
            </button>
          ))}
        </div>

        {/* Content area */}
        <div className="card min-h-64">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="animate-spin text-3xl mb-3">🤖</div>
                <p className="text-[#8b95a8] text-sm">Generating personalized content...</p>
              </div>
            </div>
          ) : currentContent ? (
            <div className="animate-fade-in">
              {/* AI/Fallback indicator */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {currentContent.isAIGenerated ? (
                    <span className="flex items-center gap-1.5 text-xs text-brand-400 bg-brand-500/10 px-2 py-1 rounded-full border border-brand-500/20">
                      🤖 AI-generated for your context
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-[#5a6478] bg-[#161b27] px-2 py-1 rounded-full border border-[#2a3347]">
                      📚 Curated content
                      {currentContent.error && ` (${currentContent.error})`}
                    </span>
                  )}
                </div>
                <button
                  id="retry-ai-btn"
                  onClick={handleRetry}
                  className="btn-ghost text-xs"
                >
                  🔄 Retry
                </button>
              </div>

              <MarkdownContent text={currentContent.content} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-[#5a6478]">
              Select a tab to load content
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 text-center">
          <button
            id="quiz-from-learn-btn"
            onClick={() => router.push(`/quiz?studentId=${studentId}&conceptId=${conceptId}${subjectId ? `&subjectId=${subjectId}` : ''}`)}
            className="btn-primary"
          >
            Ready to Practice? Take the Quiz →
          </button>
        </div>
      </div>
    </div>
  )
}

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-[#8b95a8]">Loading...</div>}>
      <LearnContent />
    </Suspense>
  )
}
