import type { Issue } from "~lib/store"

/**
 * Check 4: Hidden but loaded
 * Count elements with display:none that have data-source attributes.
 * These are elements loading data but not visible - a performance waste.
 * Warn >20.
 */
export function checkHiddenButLoaded(): Issue | null {
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

  return {
    id: "check-4-hidden-loaded",
    checkNumber: 4,
    title: "Hidden but loaded",
    severity: "warning",
    count,
    message: `${count} hidden elements are still loading data`,
    benchmark: "Best practice: under 20 hidden data sources",
    elements: hiddenLoadedElements,
  }
}
