import type { BubbleBoostEvent, EventMap, EventType } from "./events"

type EventListener<T extends EventType> = (event: EventMap[T]) => void

interface EventBusOptions {
  debug?: boolean
}

/**
 * Typed event bus for BubbleBoost.
 * All state changes flow through events for debugging and decoupling.
 */
class EventBus {
  private listeners: Map<EventType, Set<EventListener<EventType>>> = new Map()
  private eventLog: BubbleBoostEvent[] = []
  private maxLogSize = 100
  private debug: boolean

  constructor(options: EventBusOptions = {}) {
    this.debug = options.debug ?? false
  }

  /**
   * Subscribe to an event type.
   * Returns an unsubscribe function.
   */
  on<T extends EventType>(
    type: T,
    listener: EventListener<T>
  ): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set())
    }

    const listeners = this.listeners.get(type)
    listeners?.add(listener as EventListener<EventType>)

    return () => {
      listeners?.delete(listener as EventListener<EventType>)
    }
  }

  /**
   * Subscribe to an event type for a single occurrence.
   */
  once<T extends EventType>(
    type: T,
    listener: EventListener<T>
  ): () => void {
    const wrappedListener = (event: EventMap[T]) => {
      unsubscribe()
      listener(event)
    }
    const unsubscribe = this.on(type, wrappedListener)
    return unsubscribe
  }

  /**
   * Dispatch an event to all listeners.
   */
  dispatch(event: BubbleBoostEvent): void {
    // Log event for debugging
    this.logEvent(event)

    if (this.debug) {
      console.log(`[EventBus] ${event.type}:`, event)
    }

    const listeners = this.listeners.get(event.type)
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(event)
        } catch (error) {
          console.error(`[EventBus] Error in listener for ${event.type}:`, error)
        }
      })
    }
  }

  /**
   * Log event for debugging (circular buffer).
   */
  private logEvent(event: BubbleBoostEvent): void {
    this.eventLog.push(event)
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift()
    }
  }

  /**
   * Get recent events for debugging.
   */
  getEventLog(): BubbleBoostEvent[] {
    return [...this.eventLog]
  }

  /**
   * Clear event log.
   */
  clearEventLog(): void {
    this.eventLog = []
  }

  /**
   * Set debug mode.
   */
  setDebug(enabled: boolean): void {
    this.debug = enabled
  }

  /**
   * Remove all listeners for an event type.
   */
  off(type: EventType): void {
    this.listeners.delete(type)
  }

  /**
   * Remove all listeners.
   */
  clear(): void {
    this.listeners.clear()
  }
}

// Singleton event bus instance
// Debug mode is off by default - use setDebug(true) to enable
export const eventBus = new EventBus()

// Export for testing
export { EventBus }
