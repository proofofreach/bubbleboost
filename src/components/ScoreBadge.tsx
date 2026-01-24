import { useState, useRef, useEffect, useCallback } from "react"
import { useStore } from "~lib/store"

function getScoreColor(score: number): string {
  if (score >= 80) return "bg-green-500"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-500"
}

function getDeltaDisplay(current: number, previous: number | null): { text: string; color: string } | null {
  if (previous === null) return null
  const delta = current - previous
  if (delta === 0) return null

  if (delta > 0) {
    return { text: `+${delta} pts`, color: "text-green-400" }
  } else {
    return { text: `${delta} pts`, color: "text-red-400" }
  }
}

export function ScoreBadge() {
  const score = useStore((state) => state.score)
  const previousScore = useStore((state) => state.previousScore)
  const isActive = useStore((state) => state.isActive)
  const panelOpen = useStore((state) => state.panelOpen)
  const setPanelOpen = useStore((state) => state.setPanelOpen)

  const [position, setPosition] = useState({ x: 20, y: 20 })
  const [isDragging, setIsDragging] = useState(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const badgeRef = useRef<HTMLDivElement>(null)

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (!badgeRef.current) return
    e.preventDefault()
    const rect = badgeRef.current.getBoundingClientRect()
    dragOffset.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
    setIsDragging(true)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newX = window.innerWidth - e.clientX - (badgeRef.current?.offsetWidth || 60) + dragOffset.current.x
      const newY = window.innerHeight - e.clientY - (badgeRef.current?.offsetHeight || 60) + dragOffset.current.y
      setPosition({
        x: Math.max(0, Math.min(newX, window.innerWidth - 80)),
        y: Math.max(0, Math.min(newY, window.innerHeight - 80)),
      })
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [isDragging])

  if (!isActive) return null

  const scoreColor = getScoreColor(score)
  const delta = getDeltaDisplay(score, previousScore)

  return (
    <div
      ref={badgeRef}
      className={`fixed z-[999999] cursor-grab select-none ${isDragging ? "cursor-grabbing" : ""}`}
      style={{
        right: position.x,
        bottom: position.y,
      }}
      onMouseDown={handleMouseDown}
      onClick={() => {
        if (!isDragging) {
          setPanelOpen(!panelOpen)
        }
      }}
    >
      <div
        className={`${scoreColor} rounded-full w-14 h-14 flex flex-col items-center justify-center text-white shadow-lg transition-transform hover:scale-105`}
      >
        <span className="text-lg font-bold leading-none">{score}</span>
        {delta && (
          <span className={`text-[10px] font-medium leading-none mt-0.5 ${delta.color}`}>
            {delta.text}
          </span>
        )}
      </div>
    </div>
  )
}
