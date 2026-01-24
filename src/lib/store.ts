import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'

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
  setPanelOpen: (panelOpen: boolean) => void
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
    (set) => ({
      ...initialState,
      setScore: (score) => set({ score }),
      setPreviousScore: (previousScore) => set({ previousScore }),
      setIssues: (issues) => set({ issues }),
      setIsActive: (isActive) => set({ isActive }),
      setPanelOpen: (panelOpen) => set({ panelOpen }),
      reset: () => set(initialState),
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
