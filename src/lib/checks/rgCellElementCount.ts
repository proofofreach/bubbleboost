import type { Issue } from "~lib/store"

/**
 * Check 6: RG cell element count
 * Count elements inside each RG cell.
 * Warn if any cell has >5 elements.
 */
export function checkRgCellElementCount(): Issue | null {
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

  return {
    id: "check-6-rg-cell-count",
    checkNumber: 6,
    title: "RG cell element count",
    severity: "warning",
    count: maxPerCell,
    message: `RG cells have up to ${maxPerCell} elements (${bloatedCells.length} bloated ${bloatedCells.length === 1 ? "cell" : "cells"})`,
    benchmark: "Best practice: 3-5 elements per cell",
    elements: bloatedCells,
  }
}
