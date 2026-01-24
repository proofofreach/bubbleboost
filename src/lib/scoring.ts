import {
  checkElementCount,
  checkRgNestingDepth,
  checkVisibleOnLoad,
  checkHiddenButLoaded,
  checkImagesWithoutDimensions,
  checkRgCellElementCount,
  checkGroupNestingDepth,
} from "./checks"
import type { Issue } from "./store"

const STARTING_SCORE = 100
const CRITICAL_PENALTY = 15
const WARNING_PENALTY = 5
const MINIMUM_SCORE = 0

/**
 * Run all 7 checks and collect issues.
 * Deterministic: same DOM state = same results.
 */
export function runAllChecks(): Issue[] {
  const checks = [
    checkElementCount,
    checkRgNestingDepth,
    checkVisibleOnLoad,
    checkHiddenButLoaded,
    checkImagesWithoutDimensions,
    checkRgCellElementCount,
    checkGroupNestingDepth,
  ]

  const issues: Issue[] = []

  for (const check of checks) {
    const result = check()
    if (result !== null) {
      issues.push(result)
    }
  }

  return issues
}

/**
 * Calculate score from issues.
 * Start at 100, critical = -15, warning = -5, minimum 0.
 * Deterministic: same issues = same score.
 */
export function calculateScoreFromIssues(issues: Issue[]): number {
  let score = STARTING_SCORE

  for (const issue of issues) {
    if (issue.severity === "critical") {
      score -= CRITICAL_PENALTY
    } else if (issue.severity === "warning") {
      score -= WARNING_PENALTY
    }
    // 'info' severity has no penalty
  }

  return Math.max(MINIMUM_SCORE, score)
}

/**
 * Run a full analysis: execute all checks and calculate score.
 * Returns issues array and calculated score.
 */
export function runAnalysis(): { issues: Issue[]; score: number } {
  const issues = runAllChecks()
  const score = calculateScoreFromIssues(issues)
  return { issues, score }
}

/**
 * Run analysis and update store with history tracking.
 * Before saving new score, stores current score as previousScore.
 * This ensures the score delta can be displayed.
 *
 * @param getState - Function to get current store state
 * @param setScore - Function to update score in store
 * @param setPreviousScore - Function to update previousScore in store
 * @param setIssues - Function to update issues in store
 */
export function runAnalysisWithHistory(
  getState: () => { score: number },
  setScore: (score: number) => void,
  setPreviousScore: (score: number | null) => void,
  setIssues: (issues: Issue[]) => void
): { issues: Issue[]; score: number } {
  // Get current score from store at execution time
  const currentScore = getState().score

  // Store current score as previous before running new analysis
  setPreviousScore(currentScore)

  // Run the analysis
  const { issues, score } = runAnalysis()

  // Update store with new results
  setIssues(issues)
  setScore(score)

  return { issues, score }
}
