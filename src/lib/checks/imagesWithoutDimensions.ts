import { registry } from "./registry"
import { scorer } from "./scorer"
import type { Check, CheckResult } from "./types"
import type { Issue } from "~lib/store"

const CHECK_META = {
  id: "images-no-dimensions",
  name: "Images without dimensions",
  checkNumber: 5,
  highlightable: true,
  benchmark: "Best practice: all images should have explicit dimensions",
} as const

/**
 * Check 5: Images without dimensions
 * Find img tags without width/height attributes or inline styles.
 * Any image without dimensions causes layout shifts (CLS) hurting Core Web Vitals.
 * Returns raw count - scorer determines severity based on thresholds.
 */
function runCheck(): CheckResult {
  const images = document.querySelectorAll("img")

  const imagesWithoutDimensions: Element[] = []

  images.forEach((img) => {
    const hasWidthAttr = img.hasAttribute("width")
    const hasHeightAttr = img.hasAttribute("height")

    // Check inline styles
    const style = img.style
    const hasWidthStyle = style.width !== ""
    const hasHeightStyle = style.height !== ""

    // Image needs either attributes or inline styles for both dimensions
    const hasWidth = hasWidthAttr || hasWidthStyle
    const hasHeight = hasHeightAttr || hasHeightStyle

    if (!hasWidth || !hasHeight) {
      imagesWithoutDimensions.push(img)
    }
  })

  const count = imagesWithoutDimensions.length

  const result: CheckResult = {
    value: count,
    message: count > 0
      ? `${count} image${count === 1 ? "" : "s"} missing width/height`
      : "All images have explicit dimensions",
  }

  if (imagesWithoutDimensions.length > 0) {
    result.elements = imagesWithoutDimensions
  }

  return result
}

const imagesWithoutDimensionsCheck: Check = {
  meta: CHECK_META,
  run: runCheck,
}

// Self-register with the registry
registry.register(imagesWithoutDimensionsCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkImagesWithoutDimensions(): Issue | null {
  const result = runCheck()
  return scorer.resultToIssue(CHECK_META, result)
}

export { imagesWithoutDimensionsCheck }
