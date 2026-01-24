import { lazy, Suspense, useCallback, useEffect, useRef } from "react"
import { ScoreBadge } from "~components/ScoreBadge"
import { runAnalysisWithHistory } from "~lib/scoring"
import { useStore } from "~lib/store"
import cssText from "data-text:~style.css"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"

// Lazy load IssuePanel - only loaded when panel is opened
const IssuePanel = lazy(() => import("~components/IssuePanel").then(m => ({ default: m.IssuePanel })))

const DEBOUNCE_MS = 2000

export const config: PlasmoCSConfig = {
  matches: ["https://*.bubble.io/*"]
}

export const getStyle: PlasmoGetStyle = () => {
  const style = document.createElement("style")
  style.textContent = cssText
  return style
}

/**
 * Detects if the current URL is a Bubble editor page.
 * Editor pages match: /page*, /version-*, /edit*
 */
function isBubbleEditorPage(): boolean {
  const pathname = window.location.pathname
  return (
    pathname.startsWith("/page") ||
    pathname.startsWith("/version-") ||
    pathname.startsWith("/edit")
  )
}

function ContentScript() {
  const setIsActive = useStore((state) => state.setIsActive)
  const setScore = useStore((state) => state.setScore)
  const setPreviousScore = useStore((state) => state.setPreviousScore)
  const setIssues = useStore((state) => state.setIssues)

  // Refs for debounce timer and MutationObserver
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const observerRef = useRef<MutationObserver | null>(null)
  const lastAnalysisHashRef = useRef<string>("")

  // Helper to get current state without subscribing to changes
  const getState = () => useStore.getState()

  // Generate a simple hash of DOM state for cache comparison
  const getDomHash = useCallback((): string => {
    const elements = document.querySelectorAll("[data-element-id]")
    const count = elements.length
    // Include a rough structure fingerprint
    const sample = Array.from(elements)
      .slice(0, 50)
      .map((el) => el.tagName + (el.className || "").slice(0, 20))
      .join("|")
    return `${count}:${sample}`
  }, [])

  // Debounced analysis function
  const runDebouncedAnalysis = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      // Check cache - skip if DOM hasn't meaningfully changed
      const currentHash = getDomHash()
      if (currentHash === lastAnalysisHashRef.current) {
        return
      }
      lastAnalysisHashRef.current = currentHash

      runAnalysisWithHistory(getState, setScore, setPreviousScore, setIssues)
    }, DEBOUNCE_MS)
  }, [getDomHash, setScore, setPreviousScore, setIssues])

  // Run analysis immediately (for initial load and URL changes)
  const runImmediateAnalysis = useCallback(() => {
    // Clear any pending debounced analysis
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    const currentHash = getDomHash()
    lastAnalysisHashRef.current = currentHash

    runAnalysisWithHistory(getState, setScore, setPreviousScore, setIssues)
  }, [getDomHash, setScore, setPreviousScore, setIssues])

  // Setup MutationObserver for DOM changes
  useEffect(() => {
    const isEditor = isBubbleEditorPage()
    setIsActive(isEditor)

    // Run initial analysis if on editor page
    if (isEditor) {
      runImmediateAnalysis()

      // Setup MutationObserver to watch for DOM changes
      observerRef.current = new MutationObserver((mutations) => {
        // Filter out style-only changes and our own highlight overlays
        const hasRelevantChanges = mutations.some((mutation) => {
          // Skip attribute changes that are just style updates
          if (mutation.type === "attributes" && mutation.attributeName === "style") {
            return false
          }
          // Skip changes to our own extension elements
          if (mutation.target instanceof Element) {
            const target = mutation.target as Element
            if (target.closest("[data-plasmo-csui]")) {
              return false
            }
          }
          return true
        })

        if (hasRelevantChanges) {
          runDebouncedAnalysis()
        }
      })

      observerRef.current.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["data-element-id", "data-source", "class"],
      })
    }

    // Re-check on URL changes (for SPA navigation)
    const handleUrlChange = () => {
      const newIsEditor = isBubbleEditorPage()
      setIsActive(newIsEditor)

      if (newIsEditor) {
        // Reset cache on URL change
        lastAnalysisHashRef.current = ""
        runImmediateAnalysis()

        // Setup observer if not already running
        if (!observerRef.current) {
          observerRef.current = new MutationObserver((mutations) => {
            const hasRelevantChanges = mutations.some((mutation) => {
              if (mutation.type === "attributes" && mutation.attributeName === "style") {
                return false
              }
              if (mutation.target instanceof Element) {
                const target = mutation.target as Element
                if (target.closest("[data-plasmo-csui]")) {
                  return false
                }
              }
              return true
            })

            if (hasRelevantChanges) {
              runDebouncedAnalysis()
            }
          })

          observerRef.current.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ["data-element-id", "data-source", "class"],
          })
        }
      } else {
        // Disconnect observer when leaving editor
        if (observerRef.current) {
          observerRef.current.disconnect()
          observerRef.current = null
        }
      }
    }

    // Listen for popstate (back/forward navigation)
    window.addEventListener("popstate", handleUrlChange)

    // Watch for pushState/replaceState
    const originalPushState = history.pushState
    const originalReplaceState = history.replaceState

    history.pushState = function (...args) {
      originalPushState.apply(this, args)
      handleUrlChange()
    }

    history.replaceState = function (...args) {
      originalReplaceState.apply(this, args)
      handleUrlChange()
    }

    return () => {
      window.removeEventListener("popstate", handleUrlChange)
      history.pushState = originalPushState
      history.replaceState = originalReplaceState

      // Cleanup observer
      if (observerRef.current) {
        observerRef.current.disconnect()
        observerRef.current = null
      }

      // Clear debounce timer
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [setIsActive, runImmediateAnalysis, runDebouncedAnalysis])

  const panelOpen = useStore((state) => state.panelOpen)

  return (
    <>
      <ScoreBadge />
      {panelOpen && (
        <Suspense fallback={null}>
          <IssuePanel />
        </Suspense>
      )}
    </>
  )
}

export default ContentScript
