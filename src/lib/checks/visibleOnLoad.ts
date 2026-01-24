import type { Issue } from "~lib/store"

/**
 * Check 3: Visible elements on load
 * Count Bubble elements that are NOT hidden via display:none or visibility:hidden.
 * Warn >50, critical >100.
 */
export function checkVisibleOnLoad(): Issue | null {
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
  let severity: "critical" | "warning" | "info"
  if (visibleCount > 100) {
    severity = "critical"
  } else if (visibleCount > 50) {
    severity = "warning"
  } else {
    return null // No issue
  }

  return {
    id: "check-3-visible-on-load",
    checkNumber: 3,
    title: "Visible elements on load",
    severity,
    count: visibleCount,
    message: `${visibleCount} elements visible on initial load`,
    benchmark: "Best practice: under 50 visible elements",
    // Note: elements are not stored for this aggregate check (US-014)
  }
}
