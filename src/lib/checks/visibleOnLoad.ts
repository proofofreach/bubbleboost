import { registry } from "./registry"
import { scorer } from "./scorer"
import type { Check, CheckResult } from "./types"
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
 * Returns raw count - scorer determines severity based on thresholds.
 */
function runCheck(): CheckResult {
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

  return {
    value: visibleCount,
    message: `${visibleCount} elements visible on initial load`,
  }
}

const visibleOnLoadCheck: Check = {
  meta: CHECK_META,
  run: runCheck,
}

// Self-register with the registry
registry.register(visibleOnLoadCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkVisibleOnLoad(): Issue | null {
  const result = runCheck()
  return scorer.resultToIssue(CHECK_META, result)
}

export { visibleOnLoadCheck }
