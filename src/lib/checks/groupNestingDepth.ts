import { registry } from "./registry"
import { scorer } from "./scorer"
import type { Check, CheckResult } from "./types"
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
 * Returns raw depth - scorer determines severity based on thresholds.
 */
function runCheck(): CheckResult {
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

  const result: CheckResult = {
    value: maxDepth,
    message: maxDepth > 0
      ? `Groups nested ${maxDepth} levels deep`
      : "No groups found",
  }

  if (deepestChain.length > 0) {
    result.elements = deepestChain
  }

  return result
}

const groupNestingDepthCheck: Check = {
  meta: CHECK_META,
  run: runCheck,
}

// Self-register with the registry
registry.register(groupNestingDepthCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkGroupNestingDepth(): Issue | null {
  const result = runCheck()
  return scorer.resultToIssue(CHECK_META, result)
}

export { groupNestingDepthCheck }
