import { registry } from "./registry"
import { scorer } from "./scorer"
import type { Check, CheckResult } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "hidden-loaded",
  name: "Hidden but loaded",
  checkNumber: 4,
  highlightable: true,
  benchmark: "Best practice: under 20 hidden data sources",
} as const

/**
 * Check 4: Hidden but loaded
 * Count elements with display:none that have data-source attributes.
 * These are elements loading data but not visible - a performance waste.
 * Returns raw count - scorer determines severity based on thresholds.
 */
function runCheck(): CheckResult {
  // Find all elements with data-source attribute (Bubble's data binding)
  const elementsWithDataSource = document.querySelectorAll("[data-source]")

  const hiddenLoadedElements: Element[] = []

  elementsWithDataSource.forEach((el) => {
    const computedStyle = window.getComputedStyle(el)
    if (computedStyle.display === "none") {
      hiddenLoadedElements.push(el)
    }
  })

  const count = hiddenLoadedElements.length

  const result: CheckResult = {
    value: count,
    message: count > 0
      ? `${count} hidden elements are still loading data`
      : "No hidden elements loading data",
  }

  if (hiddenLoadedElements.length > 0) {
    result.elements = hiddenLoadedElements
  }

  return result
}

const hiddenButLoadedCheck: Check = {
  meta: CHECK_META,
  run: runCheck,
}

// Self-register with the registry
registry.register(hiddenButLoadedCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkHiddenButLoaded(): Issue | null {
  const result = runCheck()
  return scorer.resultToIssue(CHECK_META, result)
}

export { hiddenButLoadedCheck }
