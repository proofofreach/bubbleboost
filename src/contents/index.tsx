import { useEffect } from "react"
import type { PlasmoCSConfig } from "plasmo"
import { useStore } from "~lib/store"

export const config: PlasmoCSConfig = {
  matches: ["https://*.bubble.io/*"]
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

  useEffect(() => {
    const isEditor = isBubbleEditorPage()
    setIsActive(isEditor)

    // Re-check on URL changes (for SPA navigation)
    const handleUrlChange = () => {
      const newIsEditor = isBubbleEditorPage()
      setIsActive(newIsEditor)
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
  }, [setIsActive])

  return null
}

export default ContentScript
