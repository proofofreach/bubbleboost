import { registry } from "./registry"
import type { Check } from "./types"
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
 * Any = warning. These cause layout shifts (CLS) hurting Core Web Vitals.
 */
function runCheck(): { value: number; severity: Issue["severity"]; elements: Element[] } | null {
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

  // No images without dimensions is acceptable
  if (count === 0) {
    return null
  }

  return { value: count, severity: "warning", elements: imagesWithoutDimensions }
}

const imagesWithoutDimensionsCheck: Check = {
  meta: CHECK_META,
  run: () => {
    const result = runCheck()
    if (result === null) return null
    return {
      value: result.value,
      message: `${result.value} image${result.value === 1 ? "" : "s"} missing width/height`,
      elements: result.elements,
    }
  },
}

// Self-register with the registry
registry.register(imagesWithoutDimensionsCheck)

/**
 * Legacy function for backward compatibility.
 */
export function checkImagesWithoutDimensions(): Issue | null {
  const result = runCheck()
  if (result === null) return null

  return {
    id: `check-${CHECK_META.checkNumber}-${CHECK_META.id}`,
    checkNumber: CHECK_META.checkNumber,
    title: CHECK_META.name,
    severity: result.severity,
    count: result.value,
    message: `${result.value} image${result.value === 1 ? "" : "s"} missing width/height`,
    benchmark: CHECK_META.benchmark,
    elements: result.elements,
  }
}

export { imagesWithoutDimensionsCheck }
