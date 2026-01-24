import { registry } from "./registry"
import { scorer } from "./scorer"
import type { Check, CheckResult } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "rg-cell-count",
  name: "RG cell element count",
  checkNumber: 6,
  highlightable: true,
  benchmark: "Best practice: 3-5 elements per cell",
} as const

/**
 * Check 6: RG cell element count
 * Count elements inside each RG cell.
 * Returns raw count - scorer determines severity based on thresholds.
 */
function runCheck(): CheckResult & { bloatedCount: number } {
  // Find all repeating groups
  const repeatingGroups = document.querySelectorAll(
    '[class*="RepeatingGroup"], [data-element-id*="RepeatingGroup"]'
  )

  let maxPerCell = 0
  const bloatedCells: Element[] = []

  repeatingGroups.forEach((rg) => {
    // Find cells within this RG - Bubble typically uses class patterns for cells
    // Look for direct children or common cell wrapper patterns
    const cells = rg.querySelectorAll(
      '[class*="RepeatingGroupCell"], [data-element-id*="cell"], [class*="Cell"]'
    )

    // If no explicit cells found, treat direct children as cells
    const cellsToCheck = cells.length > 0 ? cells : rg.children

    Array.from(cellsToCheck).forEach((cell) => {
      // Count all Bubble elements inside this cell
      const elementsInCell = cell.querySelectorAll(
        '[data-element-id], [class*="bubble-element"]'
      )
      const count = elementsInCell.length

      if (count > maxPerCell) {
        maxPerCell = count
      }

      if (count > 5) {
        bloatedCells.push(cell)
      }
    })
  })

  const result: CheckResult & { bloatedCount: number } = {
    value: maxPerCell,
    message: maxPerCell > 5
      ? `RG cells have up to ${maxPerCell} elements (${bloatedCells.length} bloated ${bloatedCells.length === 1 ? "cell" : "cells"})`
      : maxPerCell > 0
        ? `RG cells have up to ${maxPerCell} elements`
        : "No repeating groups found",
    bloatedCount: bloatedCells.length,
  }

  if (bloatedCells.length > 0) {
    result.elements = bloatedCells
  }

  return result
}

const rgCellElementCountCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    const checkResult: CheckResult = {
      value: result.value,
      message: result.message,
    }
    if (result.elements !== undefined) {
      checkResult.elements = result.elements
    }
    return checkResult
  },
}

// Self-register with the registry
registry.register(rgCellElementCountCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkRgCellElementCount(): Issue | null {
  const result = runCheck()
  return scorer.resultToIssue(CHECK_META, result)
}

export { rgCellElementCountCheck }
