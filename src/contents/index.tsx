import { useEffect } from "react"
import type { PlasmoCSConfig, PlasmoGetStyle } from "plasmo"
import { useStore } from "~lib/store"
import { ScoreBadge } from "~components/ScoreBadge"
import { IssuePanel } from "~components/IssuePanel"
import { runAnalysisWithHistory } from "~lib/scoring"
import cssText from "data-text:~style.css"

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

  // Helper to get current state without subscribing to changes
  const getState = () => useStore.getState()

  // Run analysis once on mount and on URL changes
  useEffect(() => {
    const isEditor = isBubbleEditorPage()
    setIsActive(isEditor)

    // Run initial analysis if on editor page
    if (isEditor) {
      runAnalysisWithHistory(getState, setScore, setPreviousScore, setIssues)
    }

    // Re-check on URL changes (for SPA navigation)
    const handleUrlChange = () => {
      const newIsEditor = isBubbleEditorPage()
      setIsActive(newIsEditor)

      // Run analysis when navigating to editor page
      if (newIsEditor) {
        runAnalysisWithHistory(getState, setScore, setPreviousScore, setIssues)
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
    }
  }, [setIsActive, setScore, setPreviousScore, setIssues])

  return (
    <>
      <ScoreBadge />
      <IssuePanel />
    </>
  )
}

export default ContentScript
