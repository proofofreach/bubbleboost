import logoUrl from "data-base64:../assets/logo.png"
import { useEffect, useState } from "react"
import "./style.css"

interface Issue {
  id: string
  checkNumber: number
  title: string
  severity: 'critical' | 'warning' | 'info'
  count: number
  message: string
  benchmark: string
}

interface StoredState {
  score: number
  previousScore: number | null
  issues: Issue[]
  isActive: boolean
  panelOpen: boolean
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return "#22c55e" // green-500
  if (score >= 50) return "#f59e0b" // amber-500
  return "#ef4444" // red-500
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent"
  if (score >= 80) return "Great"
  if (score >= 60) return "Good"
  if (score >= 40) return "Fair"
  return "Needs Work"
}

function getDeltaDisplay(current: number, previous: number | null): { text: string; isPositive: boolean } | null {
  if (previous === null) return null
  const delta = current - previous
  if (delta === 0) return null

  return {
    text: delta > 0 ? `+${delta}` : `${delta}`,
    isPositive: delta > 0
  }
}

// Circular progress ring component
function ScoreRing({ score, size = 88 }: { score: number; size?: number }) {
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const progress = (score / 100) * circumference
  const color = getScoreRingColor(score)

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Progress ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          style={{
            filter: `drop-shadow(0 0 6px ${color}40)`,
            transition: 'stroke-dashoffset 0.5s ease-out'
          }}
        />
      </svg>
      {/* Score text in center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white leading-none">{score}</span>
      </div>
    </div>
  )
}

function Popup() {
  const [state, setState] = useState<StoredState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadState = async () => {
      try {
        const result = await chrome.storage.local.get('bubbleboost-storage')
        const stored = result['bubbleboost-storage']
        if (typeof stored === 'string') {
          const parsed = JSON.parse(stored)
          setState(parsed.state)
        }
      } catch (e) {
        console.error('Failed to load state:', e)
      } finally {
        setLoading(false)
      }
    }

    loadState()

    const handleChange = (changes: { [key: string]: chrome.storage.StorageChange }) => {
      if (changes['bubbleboost-storage']) {
        try {
          const newValue = changes['bubbleboost-storage'].newValue
          if (typeof newValue === 'string') {
            const parsed = JSON.parse(newValue)
            setState(parsed.state)
          }
        } catch (e) {
          console.error('Failed to parse state change:', e)
        }
      }
    }

    chrome.storage.local.onChanged.addListener(handleChange)
    return () => chrome.storage.local.onChanged.removeListener(handleChange)
  }, [])

  const openPanel = async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (tab?.id) {
      await chrome.storage.local.set({
        'bubbleboost-storage': JSON.stringify({
          state: { ...state, panelOpen: true }
        })
      })
      window.close()
    }
  }

  if (loading) {
    return (
      <div className="w-80 p-5 bg-slate-900">
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  const isActive = state?.isActive ?? false
  const score = state?.score ?? 100
  const previousScore = state?.previousScore ?? null
  const issues = state?.issues ?? []

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const warningCount = issues.filter(i => i.severity === 'warning').length
  const totalIssues = criticalCount + warningCount

  const delta = getDeltaDisplay(score, previousScore)

  return (
    <div className="w-80 bg-slate-900 text-white">
      {/* Header */}
      <div className="px-5 pt-4 pb-3 flex items-center justify-between border-b border-white/10">
        <img src={logoUrl} alt="BubbleBoost" className="h-6" />
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isActive
            ? "bg-emerald-500/20 text-emerald-400"
            : "bg-slate-700 text-slate-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
          {isActive ? "Active" : "Inactive"}
        </div>
      </div>

      {isActive ? (
        <div className="p-5">
          {/* Score Section */}
          <div className="flex items-center gap-5 mb-5">
            <ScoreRing score={score} />
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-semibold text-white">{getScoreLabel(score)}</span>
                {delta && (
                  <span className={`text-sm font-medium ${delta.isPositive ? "text-emerald-400" : "text-red-400"}`}>
                    {delta.text}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">Performance Score</p>
            </div>
          </div>

          {/* Issues Section */}
          <div className="mb-4 p-3.5 bg-slate-800/50 rounded-xl border border-white/5">
            <div className="flex items-center justify-between mb-2.5">
              <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Issues Found</span>
              <span className="text-xs font-medium text-slate-500">{totalIssues} total</span>
            </div>
            {totalIssues > 0 ? (
              <div className="flex gap-3">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 rounded-lg">
                    <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="text-sm font-medium text-red-400">{criticalCount}</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 rounded-lg">
                    <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-amber-400">{warningCount}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-emerald-400">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-medium">All checks passed</span>
              </div>
            )}
          </div>

          {/* Open Panel Button */}
          <button
            onClick={openPanel}
            className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-all duration-200 hover:shadow-lg hover:shadow-blue-500/25 cursor-pointer"
          >
            Open Panel
          </button>
        </div>
      ) : (
        <div className="p-5">
          <div className="p-4 bg-slate-800/50 rounded-xl border border-white/5 text-center">
            <svg className="w-10 h-10 text-slate-600 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9.563C9 9.252 9.252 9 9.563 9h4.874c.311 0 .563.252.563.563v4.874c0 .311-.252.563-.563.563H9.564A.562.562 0 019 14.437V9.564z" />
            </svg>
            <p className="text-sm text-slate-400">
              Open a Bubble.io editor page to start analyzing performance.
            </p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="px-5 pb-4 pt-1 border-t border-white/5">
        <button
          onClick={() => chrome.tabs.create({ url: "https://github.com/ProofOfReach/bubbleboost" })}
          className="flex items-center justify-center gap-2 text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer w-full"
        >
          <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
            <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
          </svg>
          View on GitHub
        </button>
      </div>
    </div>
  )
}

export default Popup
