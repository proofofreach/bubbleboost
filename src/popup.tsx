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

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

function getScoreTextColor(score: number): string {
  if (score >= 80) return "text-green-600"
  if (score >= 50) return "text-yellow-600"
  return "text-red-600"
}

function getDeltaDisplay(current: number, previous: number | null): { text: string; colorClass: string } | null {
  if (previous === null) return null
  const delta = current - previous
  if (delta === 0) return null

  if (delta > 0) {
    return { text: `+${delta} pts`, colorClass: "text-green-500" }
  } else {
    return { text: `${delta} pts`, colorClass: "text-red-500" }
  }
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
      <div className="w-80 p-4 bg-white">
        <p className="text-sm text-gray-500">Loading...</p>
      </div>
    )
  }

  const isActive = state?.isActive ?? false
  const score = state?.score ?? 100
  const previousScore = state?.previousScore ?? null
  const issues = state?.issues ?? []

  const criticalCount = issues.filter(i => i.severity === 'critical').length
  const warningCount = issues.filter(i => i.severity === 'warning').length

  const delta = getDeltaDisplay(score, previousScore)

  return (
    <div className="w-80 p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-xl font-bold text-gray-900">BubbleBoost</h1>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
          isActive
            ? "bg-green-100 text-green-700"
            : "bg-gray-100 text-gray-500"
        }`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {isActive ? (
        <>
          <div className="flex items-center gap-4 mb-4">
            <div className={`${getScoreColor(score)} rounded-full w-16 h-16 flex flex-col items-center justify-center text-white shadow-md`}>
              <span className="text-2xl font-bold leading-none">{score}</span>
              {delta && (
                <span className={`text-xs font-medium leading-none mt-0.5 ${delta.colorClass === 'text-green-500' ? 'text-green-200' : 'text-red-200'}`}>
                  {delta.text}
                </span>
              )}
            </div>
            <div className="flex-1">
              <p className={`text-lg font-semibold ${getScoreTextColor(score)}`}>
                {score >= 80 ? "Great" : score >= 50 ? "Needs Work" : "Critical"}
              </p>
              <p className="text-sm text-gray-500">
                Performance Score
              </p>
            </div>
          </div>

          {(criticalCount > 0 || warningCount > 0) ? (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-xs font-medium text-gray-500 uppercase mb-2">Issues Found</p>
              <div className="flex gap-4">
                {criticalCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                    <span className="text-sm text-gray-700">{criticalCount} Critical</span>
                  </div>
                )}
                {warningCount > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                    <span className="text-sm text-gray-700">{warningCount} Warning{warningCount !== 1 ? 's' : ''}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700">No issues found!</p>
            </div>
          )}

          <button
            onClick={openPanel}
            className="w-full py-2 px-4 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors mb-3"
          >
            Open Panel
          </button>
        </>
      ) : (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">
            Open a Bubble.io editor page to start analyzing.
          </p>
        </div>
      )}

      <a
        href="https://github.com/anthropics/bubbleboost"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.09-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0012 2z" />
        </svg>
        View on GitHub
      </a>
    </div>
  )
}

export default Popup
