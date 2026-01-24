import { registry } from "./registry"
import type { Check } from "./types"
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
 * Warn >20.
 */
function runCheck(): { value: number; severity: Issue["severity"]; elements: Element[] } | null {
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

  // No hidden loaded elements is acceptable
  if (count <= 20) {
    return null
  }

  return { value: count, severity: "warning", elements: hiddenLoadedElements }
}

const hiddenButLoadedCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    if (result === null) return null
    return {
      value: result.value,
      message: `${result.value} hidden elements are still loading data`,
      elements: result.elements,
    }
  },
}

// Self-register with the registry
registry.register(hiddenButLoadedCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkHiddenButLoaded(): Issue | null {
  const result = runCheck()
  if (result === null) return null

  return {
    id: `check-${CHECK_META.checkNumber}-${CHECK_META.id}`,
    checkNumber: CHECK_META.checkNumber,
    title: CHECK_META.name,
    severity: result.severity,
    count: result.value,
    message: `${result.value} hidden elements are still loading data`,
    benchmark: CHECK_META.benchmark,
    elements: result.elements,
  }
}

export { hiddenButLoadedCheck }
