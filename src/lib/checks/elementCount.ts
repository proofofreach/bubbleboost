import type { Issue } from "~lib/store"

/**
 * Check 1: Element count
 * Count DOM elements with [data-element-id] or Bubble class markers.
 * Warn >200, critical >500.
 */
export function checkElementCount(): Issue | null {
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
  let severity: "critical" | "warning" | "info"
  if (count > 500) {
    severity = "critical"
  } else if (count > 200) {
    severity = "warning"
  } else {
    return null // No issue
  }

  return {
    id: "check-1-element-count",
    checkNumber: 1,
    title: "Element count",
    severity,
    count,
    message: `Found ${count} Bubble elements on the page`,
    benchmark: "Best practice: under 100 elements",
    // Note: elements are not stored for this aggregate check (US-014)
  }
}
