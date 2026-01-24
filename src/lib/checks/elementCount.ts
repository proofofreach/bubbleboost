import { registry } from "./registry"
import type { Check } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "element-count",
  name: "Element count",
  checkNumber: 1,
  highlightable: false,
  benchmark: "Best practice: under 100 elements",
} as const

/**
 * Check 1: Element count
 * Count DOM elements with [data-element-id] or Bubble class markers.
 * Warn >200, critical >500.
 */
function runCheck(): { value: number; severity: Issue["severity"] } | null {
  // Count elements with Bubble markers
  const elementsWithDataId = document.querySelectorAll("[data-element-id]")
  const elementsWithBubbleClass = document.querySelectorAll(
    '[class*="bubble-element"]'
  )

  // Use a Set to avoid counting the same element twice
  const allElements = new Set<Element>()
  elementsWithDataId.forEach((el) => allElements.add(el))
  elementsWithBubbleClass.forEach((el) => allElements.add(el))

  const count = allElements.size

  // Determine severity
  if (count > 500) {
    return { value: count, severity: "critical" }
  } else if (count > 200) {
    return { value: count, severity: "warning" }
  }

  return null // No issue
}

const elementCountCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    if (result === null) return null
    return {
      value: result.value,
      message: `Found ${result.value} Bubble elements on the page`,
    }
  },
}

// Self-register with the registry
registry.register(elementCountCheck)

/**
 * Legacy function for backward compatibility.
 * Returns an Issue directly (used by existing scoring.ts).
 */
export function checkElementCount(): Issue | null {
  const result = runCheck()
  if (result === null) return null

  return {
    id: `check-${CHECK_META.checkNumber}-${CHECK_META.id}`,
    checkNumber: CHECK_META.checkNumber,
    title: CHECK_META.name,
    severity: result.severity,
    count: result.value,
    message: `Found ${result.value} Bubble elements on the page`,
    benchmark: CHECK_META.benchmark,
  }
}

export { elementCountCheck }
