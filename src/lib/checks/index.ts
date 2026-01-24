// Export the registry singleton
export { registry } from "./registry"

// Export types
export type { Check, CheckMeta, CheckResult } from "./types"

// Import all checks to trigger their self-registration with the registry.
// When adding a new check, simply create the file - no changes needed here!
// Each check self-registers via `registry.register()` at import time.
import "./elementCount"
import "./rgNestingDepth"
import "./visibleOnLoad"
import "./hiddenButLoaded"
import "./imagesWithoutDimensions"
import "./rgCellElementCount"
import "./groupNestingDepth"

// Legacy exports for backward compatibility with existing code.
// These will be deprecated once RF-005 separates scoring from checks.
export { checkElementCount } from "./elementCount"
export { checkRgNestingDepth } from "./rgNestingDepth"
export { checkVisibleOnLoad } from "./visibleOnLoad"
export { checkHiddenButLoaded } from "./hiddenButLoaded"
export { checkImagesWithoutDimensions } from "./imagesWithoutDimensions"
export { checkRgCellElementCount } from "./rgCellElementCount"
export { checkGroupNestingDepth } from "./groupNestingDepth"
