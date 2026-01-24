import { registry } from "./registry"
import type { Check } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "group-nesting",
  name: "Group nesting depth",
  checkNumber: 7,
  highlightable: true,
  benchmark: "Best practice: under 5 levels of nesting",
} as const

/**
 * Check 7: Group nesting depth
 * Measure deepest group-in-group nesting.
 * Warn >5, critical >8.
 */
function runCheck(): { value: number; severity: Issue["severity"]; elements: Element[] } | null {
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
  const severity: Issue["severity"] = maxDepth > 8 ? "critical" : "warning"

  return { value: maxDepth, severity, elements: deepestChain }
}

const groupNestingDepthCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    if (result === null) return null
    return {
      value: result.value,
      message: `Groups nested ${result.value} levels deep`,
      elements: result.elements,
    }
  },
}

// Self-register with the registry
registry.register(groupNestingDepthCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkGroupNestingDepth(): Issue | null {
  const result = runCheck()
  if (result === null) return null

  return {
    id: `check-${CHECK_META.checkNumber}-${CHECK_META.id}`,
    checkNumber: CHECK_META.checkNumber,
    title: CHECK_META.name,
    severity: result.severity,
    count: result.value,
    message: `Groups nested ${result.value} levels deep`,
    benchmark: CHECK_META.benchmark,
    elements: result.elements,
  }
}

export { groupNestingDepthCheck }
