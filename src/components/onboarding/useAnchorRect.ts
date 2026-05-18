'use client'

import { useEffect, useState } from 'react'

export interface AnchorRect {
  top:    number
  left:   number
  width:  number
  height: number
}

/**
 * Tracks the bounding rect of the element with `data-tour-id={id}`.
 * Re-measures on resize, scroll, and DOM mutations.
 * Returns null if the anchor is not in the DOM (yet).
 */
export function useAnchorRect(id: string | null): AnchorRect | null {
  const [rect, setRect] = useState<AnchorRect | null>(null)

  useEffect(() => {
    if (!id) { setRect(null); return }

    let raf = 0
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour-id="${CSS.escape(id)}"]`)
      if (!el) {
        setRect(null)
        return
      }
      const r = el.getBoundingClientRect()
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
    }

    const schedule = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(measure)
    }

    schedule()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)

    const mo = new MutationObserver(schedule)
    mo.observe(document.body, { childList: true, subtree: true, attributes: true })

    // Re-measure once after a short delay (catches late-mounted anchors)
    const t = window.setTimeout(schedule, 250)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
      mo.disconnect()
      clearTimeout(t)
    }
  }, [id])

  return rect
}
