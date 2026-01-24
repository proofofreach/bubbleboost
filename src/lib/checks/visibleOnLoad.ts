import { registry } from "./registry"
import type { Check } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "visible-on-load",
  name: "Visible elements on load",
  checkNumber: 3,
  highlightable: false,
  benchmark: "Best practice: under 50 visible elements",
} as const

/**
 * Check 3: Visible elements on load
 * Count Bubble elements that are NOT hidden via display:none or visibility:hidden.
 * Warn >50, critical >100.
 */
function runCheck(): { value: number; severity: Issue["severity"] } | null {
  // Get all Bubble elements
  const elementsWithDataId = document.querySelectorAll("[data-element-id]")
  const elementsWithBubbleClass = document.querySelectorAll(
    '[class*="bubble-element"]'
  )

  // Use a Set to avoid counting the same element twice
  const allElements = new Set<Element>()
  elementsWithDataId.forEach((el) => allElements.add(el))
  elementsWithBubbleClass.forEach((el) => allElements.add(el))

  // Filter to only visible elements
  let visibleCount = 0
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el)
    const isHidden =
      style.display === "none" || style.visibility === "hidden"

    if (!isHidden) {
      visibleCount++
    }
  })

  // Determine severity
  if (visibleCount > 100) {
    return { value: visibleCount, severity: "critical" }
  } else if (visibleCount > 50) {
    return { value: visibleCount, severity: "warning" }
  }

  return null // No issue
}

const visibleOnLoadCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    if (result === null) return null
    return {
      value: result.value,
      message: `${result.value} elements visible on initial load`,
    }
  },
}

// Self-register with the registry
registry.register(visibleOnLoadCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkVisibleOnLoad(): Issue | null {
  const result = runCheck()
  if (result === null) return null

  return {
    id: `check-${CHECK_META.checkNumber}-${CHECK_META.id}`,
    checkNumber: CHECK_META.checkNumber,
    title: CHECK_META.name,
    severity: result.severity,
    count: result.value,
    message: `${result.value} elements visible on initial load`,
    benchmark: CHECK_META.benchmark,
  }
}

export { visibleOnLoadCheck }
