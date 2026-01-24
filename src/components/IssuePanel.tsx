import { useState } from "react"
import { useStore, type Issue } from "~lib/store"
import { highlightElement, isHighlightable } from "~lib/highlight"

interface FixInfo {
  steps: string[]
  docsUrl?: string
}

const FIX_INFO: Record<number, FixInfo> = {
  1: {
    steps: [
      "Break pages into reusable elements",
      "Use popups instead of hidden groups",
      "Remove unused elements from the page",
    ],
    docsUrl: "https://bubble.io/blog/bubble-app-performance/",
  },
  2: {
    steps: [
      "Flatten nested RGs into a single data source",
      "Use Option Sets for static nested data",
      "Consider Backend Workflows for complex data",
    ],
    docsUrl: "https://bubble.io/blog/bubble-app-performance/",
  },
  3: {
    steps: [
      "Use popups for content shown on user action",
      "Implement pagination or infinite scroll",
      "Lazy-load below-the-fold content",
    ],
    docsUrl: "https://bubble.io/blog/bubble-app-performance/",
  },
  4: {
    steps: [
      "Use conditional 'This element is visible' instead of hidden",
      "Remove data sources from hidden elements",
      "Consider 'Only when needed' data loading",
    ],
    docsUrl: "https://bubble.io/blog/bubble-app-performance/",
  },
  5: {
    steps: [
      "Set explicit width/height on images",
      "Use Bubble's image processing for consistent sizes",
      "Enable responsive images with proper aspect ratios",
    ],
    docsUrl: "https://web.dev/cls/",
  },
  6: {
    steps: [
      "Simplify cell layout with fewer nested groups",
      "Use reusable elements for complex cells",
      "Move non-essential elements outside the RG",
    ],
    docsUrl: "https://bubble.io/blog/bubble-app-performance/",
  },
  7: {
    steps: [
      "Flatten group hierarchy with flexbox layouts",
      "Use the responsive engine instead of nested groups",
      "Combine adjacent groups where possible",
    ],
    docsUrl: "https://bubble.io/blog/bubble-app-performance/",
  },
}

function getBenchmarkMultiplier(checkNumber: number, count: number): string | null {
  const thresholds: Record<number, number> = {
    1: 100, // Best practice: under 100 elements
    2: 1, // Best practice: no nesting
    3: 50, // Best practice: under 50 visible
    4: 20, // Best practice: under 20
    5: 0, // Any is bad
    6: 5, // Best practice: 3-5 per cell
    7: 5, // Best practice: under 5 levels
  }

  const threshold = thresholds[checkNumber]
  if (threshold === undefined || threshold === 0) return null // Can't calculate multiplier for zero or unknown threshold

  const multiplier = count / threshold
  if (multiplier >= 2) {
    return `${multiplier.toFixed(1)}x above recommended`
  }
  return null
}

function getSeverityColor(severity: Issue["severity"]): string {
  switch (severity) {
    case "critical":
      return "bg-red-500"
    case "warning":
      return "bg-yellow-500"
    case "info":
      return "bg-blue-500"
  }
}

function getSeverityBorderColor(severity: Issue["severity"]): string {
  switch (severity) {
    case "critical":
      return "border-red-500"
    case "warning":
      return "border-yellow-500"
    case "info":
      return "border-blue-500"
  }
}

function IssueItem({ issue }: { issue: Issue }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const fixInfo = FIX_INFO[issue.checkNumber]
  const multiplier = getBenchmarkMultiplier(issue.checkNumber, issue.count)

  return (
    <div
      className={`border-l-4 ${getSeverityBorderColor(issue.severity)} bg-gray-800 rounded-r mb-2`}
    >
      <button
        className="w-full p-3 text-left flex items-center justify-between hover:bg-gray-700 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium text-white">{issue.title}</span>
            <span className="text-gray-400 text-sm">({issue.count})</span>
          </div>
          {multiplier && (
            <span className="text-red-400 text-xs">{multiplier}</span>
          )}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-700">
          <p className="text-gray-300 text-sm mt-2">{issue.message}</p>
          <p className="text-gray-500 text-xs mt-1">{issue.benchmark}</p>

          {fixInfo && (
            <div className="mt-3">
              <p className="text-gray-400 text-xs font-medium mb-1">How to fix:</p>
              <ul className="text-gray-300 text-xs space-y-1">
                {fixInfo.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-400">-</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
              {fixInfo.docsUrl && (
                <a
                  href={fixInfo.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 text-xs hover:underline mt-2 inline-block"
                >
                  Learn more
                </a>
              )}
            </div>
          )}

          {issue.elements && issue.elements.length > 0 && isHighlightable(issue.checkNumber) && (
            <div className="mt-3">
              <p className="text-gray-400 text-xs font-medium mb-1">
                Affected elements ({issue.elements.length}):
              </p>
              <div className="flex flex-wrap gap-1">
                {issue.elements.slice(0, 10).map((element, i) => (
                  <button
                    key={i}
                    className="px-2 py-1 bg-gray-700 hover:bg-red-600 text-gray-300 hover:text-white text-xs rounded transition-colors"
                    onClick={(e) => {
                      e.stopPropagation()
                      highlightElement(element)
                    }}
                    title="Click to scroll to and highlight this element"
                  >
                    #{i + 1}
                  </button>
                ))}
                {issue.elements.length > 10 && (
                  <span className="px-2 py-1 text-gray-500 text-xs">
                    +{issue.elements.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function IssueGroup({
  title,
  issues,
  severity,
}: {
  title: string
  issues: Issue[]
  severity: Issue["severity"]
}) {
  if (issues.length === 0) return null

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className={`w-2 h-2 rounded-full ${getSeverityColor(severity)}`} />
        <h3 className="text-gray-300 text-sm font-medium">
          {title} ({issues.length})
        </h3>
      </div>
      {issues.map((issue) => (
        <IssueItem key={issue.id} issue={issue} />
      ))}
    </div>
  )
}

export function IssuePanel() {
  const panelOpen = useStore((state) => state.panelOpen)
  const setPanelOpen = useStore((state) => state.setPanelOpen)
  const issues = useStore((state) => state.issues)
  const score = useStore((state) => state.score)

  if (!panelOpen) return null

  const criticalIssues = issues.filter((i) => i.severity === "critical")
  const warningIssues = issues.filter((i) => i.severity === "warning")
  const infoIssues = issues.filter((i) => i.severity === "info")

  return (
    <div className="fixed top-4 right-4 w-80 max-h-[80vh] bg-gray-900 rounded-lg shadow-2xl z-[999998] flex flex-col">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <div>
          <h2 className="text-white font-semibold">BubbleBoost</h2>
          <p className="text-gray-400 text-sm">Score: {score}/100</p>
        </div>
        <button
          className="text-gray-400 hover:text-white transition-colors"
          onClick={() => setPanelOpen(false)}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {issues.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-green-400 text-4xl mb-2">100</div>
            <p className="text-gray-400">No issues found. Great job!</p>
          </div>
        ) : (
          <>
            <IssueGroup title="Critical" issues={criticalIssues} severity="critical" />
            <IssueGroup title="Warnings" issues={warningIssues} severity="warning" />
            <IssueGroup title="Info" issues={infoIssues} severity="info" />
          </>
        )}
      </div>

      <div className="p-3 border-t border-gray-700 text-center">
        <a
          href="https://github.com/bubbleboost/extension"
          target="_blank"
          rel="noopener noreferrer"
          className="text-gray-500 text-xs hover:text-gray-400"
        >
          BubbleBoost - Free Performance Analyzer
        </a>
      </div>
    </div>
  )
}
