'use client'

import type { AnchorRect } from './useAnchorRect'

interface CardRect { top: number; left: number; width: number; height: number }

interface Props {
  card:   CardRect
  anchor: AnchorRect
}

/**
 * Thin terracotta connecting line from card edge to anchor edge.
 * Drawn with SVG. Includes a small filled circle at the anchor end.
 */
export function AnnotationLine({ card, anchor }: Props) {
  const cardCx = card.left + card.width / 2
  const cardCy = card.top  + card.height / 2

  // Pick the closest point on the anchor's bounding box to the card centre.
  const ax = clamp(cardCx, anchor.left, anchor.left + anchor.width)
  const ay = clamp(cardCy, anchor.top,  anchor.top  + anchor.height)

  // Pick the closest point on the card's bounding box to the anchor centre.
  const anCx = anchor.left + anchor.width / 2
  const anCy = anchor.top  + anchor.height / 2
  const cx   = clamp(anCx, card.left, card.left + card.width)
  const cy   = clamp(anCy, card.top,  card.top  + card.height)

  return (
    <svg
      width="100vw"
      height="100vh"
      style={{
        position:      'fixed',
        inset:         0,
        pointerEvents: 'none',
        zIndex:        9998,
      }}
    >
      <line
        x1={cx}
        y1={cy}
        x2={ax}
        y2={ay}
        stroke="#C96B4A"
        strokeWidth="1.5"
        strokeDasharray="0"
        opacity="0.7"
      />
      <circle cx={ax} cy={ay} r="3.5" fill="#C96B4A" />
      <circle cx={ax} cy={ay} r="7"  fill="#C96B4A" opacity="0.18" />
    </svg>
  )
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}
