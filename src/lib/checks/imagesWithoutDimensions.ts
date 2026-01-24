import type { Issue } from "~lib/store"

/**
 * Check 5: Images without dimensions
 * Find img tags without width/height attributes or inline styles.
 * Any = warning. These cause layout shifts (CLS) hurting Core Web Vitals.
 */
export function checkImagesWithoutDimensions(): Issue | null {
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

  return {
    id: "check-5-images-no-dimensions",
    checkNumber: 5,
    title: "Images without dimensions",
    severity: "warning",
    count,
    message: `${count} image${count === 1 ? "" : "s"} missing width/height`,
    benchmark: "Best practice: all images should have explicit dimensions",
    elements: imagesWithoutDimensions,
  }
}
