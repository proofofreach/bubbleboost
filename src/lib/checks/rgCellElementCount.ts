import { registry } from "./registry"
import type { Check } from "./types"
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
 * Warn if any cell has >5 elements.
 */
function runCheck(): { value: number; severity: Issue["severity"]; elements: Element[]; bloatedCount: number } | null {
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

  // No RGs or all cells have acceptable element counts
  if (maxPerCell <= 5) {
    return null
  }

  return { value: maxPerCell, severity: "warning", elements: bloatedCells, bloatedCount: bloatedCells.length }
}

const rgCellElementCountCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    if (result === null) return null
    return {
      value: result.value,
      message: `RG cells have up to ${result.value} elements (${result.bloatedCount} bloated ${result.bloatedCount === 1 ? "cell" : "cells"})`,
      elements: result.elements,
    }
  },
}

// Self-register with the registry
registry.register(rgCellElementCountCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkRgCellElementCount(): Issue | null {
  const result = runCheck()
  if (result === null) return null

  return {
    id: `check-${CHECK_META.checkNumber}-${CHECK_META.id}`,
    checkNumber: CHECK_META.checkNumber,
    title: CHECK_META.name,
    severity: result.severity,
    count: result.value,
    message: `RG cells have up to ${result.value} elements (${result.bloatedCount} bloated ${result.bloatedCount === 1 ? "cell" : "cells"})`,
    benchmark: CHECK_META.benchmark,
    elements: result.elements,
  }
}

export { rgCellElementCountCheck }
