/**
 * Utility functions for highlighting DOM elements.
 * Used by the IssuePanel to scroll to and highlight problematic elements.
 */

const HIGHLIGHT_DURATION_MS = 3000
const HIGHLIGHT_STYLE = "3px solid #ef4444" // red-500

/**
 * Scrolls to an element and adds a temporary red outline.
 * The outline automatically removes after 3 seconds.
 */
export function highlightElement(element: Element): void {
  // Scroll element into view
  element.scrollIntoView({
    behavior: "smooth",
    block: "center",
    inline: "center",
  })

  // Type assertion for HTMLElement to access style property
  if (!(element instanceof HTMLElement)) {
    return
  }

  // Store original outline to restore later
  const originalOutline = element.style.outline
  const originalOutlineOffset = element.style.outlineOffset

  // Apply highlight
  element.style.outline = HIGHLIGHT_STYLE
  element.style.outlineOffset = "2px"

  // Remove highlight after duration
  setTimeout(() => {
    element.style.outline = originalOutline
    element.style.outlineOffset = originalOutlineOffset
  }, HIGHLIGHT_DURATION_MS)
}

/**
 * Check numbers that support element highlighting.
 * These checks return element references that can be scrolled to.
 *
 * Checks 1 (element count) and 3 (visible on load) are aggregate
 * checks without specific elements to highlight.
 */
export const HIGHLIGHTABLE_CHECKS = new Set([2, 4, 5, 6, 7])

/**
 * Determines if a check supports element highlighting.
 */
export function isHighlightable(checkNumber: number): boolean {
  return HIGHLIGHTABLE_CHECKS.has(checkNumber)
}
