import type { Issue } from "~lib/store"

/**
 * Check 7: Group nesting depth
 * Measure deepest group-in-group nesting.
 * Warn >5, critical >8.
 */
export function checkGroupNestingDepth(): Issue | null {
  // Find all Bubble groups - they typically have class containing "Group" but not "RepeatingGroup"
  const allElements = document.querySelectorAll('[data-element-id], [class*="Group"]')

  // Filter to get only group elements (not repeating groups)
  const groups: Element[] = []
  allElements.forEach((el) => {
    const className = el.className || ""
    const dataElementId = el.getAttribute("data-element-id") || ""

    // Include elements that are groups but exclude repeating groups
    const isGroup =
      className.includes("Group") ||
      dataElementId.includes("Group")
    const isRepeatingGroup =
      className.includes("RepeatingGroup") ||
      dataElementId.includes("RepeatingGroup")

    if (isGroup && !isRepeatingGroup) {
      groups.push(el)
    }
  })

  let maxDepth = 0
  let deepestChain: Element[] = []

  groups.forEach((group) => {
    // Count how many group ancestors this element has
    let depth = 1 // Start at 1 for the element itself
    const chain: Element[] = [group]
    let parent = group.parentElement

    while (parent) {
      const className = parent.className || ""
      const dataElementId = parent.getAttribute("data-element-id") || ""

      const isGroup =
        className.includes("Group") ||
        dataElementId.includes("Group")
      const isRepeatingGroup =
        className.includes("RepeatingGroup") ||
        dataElementId.includes("RepeatingGroup")

      if (isGroup && !isRepeatingGroup) {
        depth++
        chain.unshift(parent) // Add to beginning to maintain order
      }
      parent = parent.parentElement
    }

    if (depth > maxDepth) {
      maxDepth = depth
      deepestChain = chain
    }
  })

  // No deep nesting - 5 or fewer levels is acceptable
  if (maxDepth <= 5) {
    return null
  }

  // Determine severity
  let severity: "critical" | "warning" | "info"
  if (maxDepth > 8) {
    severity = "critical"
  } else {
    severity = "warning"
  }

  return {
    id: "check-7-group-nesting",
    checkNumber: 7,
    title: "Group nesting depth",
    severity,
    count: maxDepth,
    message: `Groups nested ${maxDepth} levels deep`,
    benchmark: "Best practice: under 5 levels of nesting",
    elements: deepestChain,
  }
}
