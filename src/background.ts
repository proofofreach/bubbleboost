/**
 * Background service worker for BubbleBoost extension.
 * Updates the extension badge based on score and active state.
 */

interface StoredState {
  score: number
  previousScore: number | null
  issues: unknown[]
  isActive: boolean
  panelOpen: boolean
}

const COLORS = {
  green: "#22c55e",   // score >= 80
  yellow: "#eab308",  // score 50-79
  red: "#ef4444",     // score < 50
  gray: "#9ca3af",    // inactive
} as const

function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.green
  if (score >= 50) return COLORS.yellow
  return COLORS.red
}

async function updateBadge(state: StoredState | null): Promise<void> {
  if (!state || !state.isActive) {
    // Inactive: show empty badge with gray background
    await chrome.action.setBadgeText({ text: "" })
    await chrome.action.setBadgeBackgroundColor({ color: COLORS.gray })
    return
  }

  // Active: show score with appropriate color
  const score = state.score
  const color = getScoreColor(score)

  await chrome.action.setBadgeText({ text: String(score) })
  await chrome.action.setBadgeBackgroundColor({ color })
}

// Listen for storage changes
chrome.storage.local.onChanged.addListener((changes) => {
  if (changes["bubbleboost-storage"]) {
    try {
      const newValue = changes["bubbleboost-storage"].newValue
      if (typeof newValue === "string") {
        const parsed = JSON.parse(newValue)
        updateBadge(parsed.state)
      }
    } catch (e) {
      console.error("[BubbleBoost] Failed to parse state change:", e)
    }
  }
})

// Initialize badge on startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    const result = await chrome.storage.local.get("bubbleboost-storage")
    const stored = result["bubbleboost-storage"]
    if (typeof stored === "string") {
      const parsed = JSON.parse(stored)
      await updateBadge(parsed.state)
    } else {
      // No state yet - set inactive
      await updateBadge(null)
    }
  } catch (e) {
    console.error("[BubbleBoost] Failed to initialize badge:", e)
  }
})

// Also initialize when service worker is installed/updated
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const result = await chrome.storage.local.get("bubbleboost-storage")
    const stored = result["bubbleboost-storage"]
    if (typeof stored === "string") {
      const parsed = JSON.parse(stored)
      await updateBadge(parsed.state)
    } else {
      // No state yet - set inactive
      await updateBadge(null)
    }
  } catch (e) {
    console.error("[BubbleBoost] Failed to initialize badge:", e)
  }
})

export {}
