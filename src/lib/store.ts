import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { eventBus } from './eventBus'
import { createEvent } from './events'

export interface Issue {
  id: string
  checkNumber: number
  title: string
  severity: 'critical' | 'warning' | 'info'
  count: number
  message: string
  benchmark: string
  elements?: Element[]
}

export interface BubbleBoostState {
  score: number
  previousScore: number | null
  issues: Issue[]
  isActive: boolean
  panelOpen: boolean
  setScore: (score: number) => void
  setPreviousScore: (score: number | null) => void
  setIssues: (issues: Issue[]) => void
  setIsActive: (isActive: boolean) => void
  setPanelOpen: (panelOpen: boolean, source?: 'badge' | 'panel' | 'popup' | 'external') => void
  reset: () => void
}

// Chrome storage adapter for Zustand persist
const chromeStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const result = await chrome.storage.local.get(name)
    const value = result[name]
    return typeof value === 'string' ? value : null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await chrome.storage.local.set({ [name]: value })
  },
  removeItem: async (name: string): Promise<void> => {
    await chrome.storage.local.remove(name)
  },
}

const initialState = {
  score: 100,
  previousScore: null as number | null,
  issues: [] as Issue[],
  isActive: false,
  panelOpen: false,
}

export const useStore = create<BubbleBoostState>()(
  persist(
    (set, get) => ({
      ...initialState,
      setScore: (score) => {
        const previousScore = get().previousScore
        set({ score })
        eventBus.dispatch(createEvent.scoreUpdated(score, previousScore))
      },
      setPreviousScore: (previousScore) => {
        set({ previousScore })
      },
      setIssues: (issues) => {
        set({ issues })
      },
      setIsActive: (isActive) => {
        set({ isActive })
        eventBus.dispatch(createEvent.editorPageDetected(isActive, window.location.href))
      },
      setPanelOpen: (panelOpen, source = 'badge') => {
        set({ panelOpen })
        eventBus.dispatch(createEvent.panelToggled(panelOpen, source))
      },
      reset: () => {
        set(initialState)
        eventBus.dispatch(createEvent.stateReset())
      },
    }),
    {
      name: 'bubbleboost-storage',
      storage: createJSONStorage(() => chromeStorage),
      partialize: (state) => ({
        score: state.score,
        previousScore: state.previousScore,
        issues: state.issues,
        isActive: state.isActive,
        panelOpen: state.panelOpen,
      }),
    }
  )
)

// Listen for external chrome.storage changes (e.g., from popup)
// Only sync panelOpen - isActive is controlled by content script URL detection
if (typeof chrome !== 'undefined' && chrome.storage?.local?.onChanged) {
  chrome.storage.local.onChanged.addListener((changes) => {
    if (changes['bubbleboost-storage']) {
      try {
        const newValue = changes['bubbleboost-storage'].newValue
        if (typeof newValue === 'string') {
          const parsed = JSON.parse(newValue)
          if (parsed.state && parsed.state.panelOpen !== undefined) {
            const { setPanelOpen } = useStore.getState()
            setPanelOpen(parsed.state.panelOpen, 'external')
          }
        }
      } catch (e) {
        console.error('Failed to sync external storage change:', e)
      }
    }
  })
}
