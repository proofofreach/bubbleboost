import type { Issue } from "./store"

/**
 * Event types for BubbleBoost's typed event system.
 * All state changes flow through these events.
 */

// Analysis lifecycle events
export interface AnalysisStartedEvent {
  type: "AnalysisStarted"
  timestamp: number
}

export interface AnalysisCompleteEvent {
  type: "AnalysisComplete"
  score: number
  previousScore: number | null
  issues: Issue[]
  timestamp: number
}

export interface AnalysisErrorEvent {
  type: "AnalysisError"
  error: string
  timestamp: number
}

// Page detection events
export interface EditorPageDetectedEvent {
  type: "EditorPageDetected"
  isActive: boolean
  url: string
}

// UI state events
export interface PanelToggledEvent {
  type: "PanelToggled"
  panelOpen: boolean
  source: "badge" | "panel" | "popup" | "external"
}

// Score update event (for badge updates)
export interface ScoreUpdatedEvent {
  type: "ScoreUpdated"
  score: number
  previousScore: number | null
}

// Issue highlight event
export interface IssueHighlightedEvent {
  type: "IssueHighlighted"
  issueId: string | null
}

// State reset event
export interface StateResetEvent {
  type: "StateReset"
}

// Union type of all events
export type BubbleBoostEvent =
  | AnalysisStartedEvent
  | AnalysisCompleteEvent
  | AnalysisErrorEvent
  | EditorPageDetectedEvent
  | PanelToggledEvent
  | ScoreUpdatedEvent
  | IssueHighlightedEvent
  | StateResetEvent

// Event type literal union
export type EventType = BubbleBoostEvent["type"]

// Map from event type string to event payload type
export type EventMap = {
  AnalysisStarted: AnalysisStartedEvent
  AnalysisComplete: AnalysisCompleteEvent
  AnalysisError: AnalysisErrorEvent
  EditorPageDetected: EditorPageDetectedEvent
  PanelToggled: PanelToggledEvent
  ScoreUpdated: ScoreUpdatedEvent
  IssueHighlighted: IssueHighlightedEvent
  StateReset: StateResetEvent
}

// Factory functions for creating events
export const createEvent = {
  analysisStarted: (): AnalysisStartedEvent => ({
    type: "AnalysisStarted",
    timestamp: Date.now(),
  }),

  analysisComplete: (
    score: number,
    previousScore: number | null,
    issues: Issue[]
  ): AnalysisCompleteEvent => ({
    type: "AnalysisComplete",
    score,
    previousScore,
    issues,
    timestamp: Date.now(),
  }),

  analysisError: (error: string): AnalysisErrorEvent => ({
    type: "AnalysisError",
    error,
    timestamp: Date.now(),
  }),

  editorPageDetected: (isActive: boolean, url: string): EditorPageDetectedEvent => ({
    type: "EditorPageDetected",
    isActive,
    url,
  }),

  panelToggled: (
    panelOpen: boolean,
    source: PanelToggledEvent["source"]
  ): PanelToggledEvent => ({
    type: "PanelToggled",
    panelOpen,
    source,
  }),

  scoreUpdated: (score: number, previousScore: number | null): ScoreUpdatedEvent => ({
    type: "ScoreUpdated",
    score,
    previousScore,
  }),

  issueHighlighted: (issueId: string | null): IssueHighlightedEvent => ({
    type: "IssueHighlighted",
    issueId,
  }),

  stateReset: (): StateResetEvent => ({
    type: "StateReset",
  }),
}
