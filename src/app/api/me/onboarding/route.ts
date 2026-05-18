import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }            from 'next-auth'
import { authOptions }                 from '@/lib/auth'
import { prisma }                      from '@/lib/prisma'

export const runtime = 'nodejs'

interface OnboardingState {
  adminTour?:  'in_progress' | 'completed' | 'skipped'
  vendorTour?: 'in_progress' | 'completed' | 'skipped'
  lastStep?:   number
  completedAt?: string
}

/* ── GET ─────────────────────────────────────────────────────────────────── */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { onboardingState: true },
  })

  let state: OnboardingState = {}
  try { state = JSON.parse(user?.onboardingState ?? '{}') } catch { /* keep default */ }
  return NextResponse.json({ state })
}

/* ── PATCH ───────────────────────────────────────────────────────────────── */
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: Partial<OnboardingState>
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const current = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: { onboardingState: true },
  })

  let merged: OnboardingState = {}
  try { merged = JSON.parse(current?.onboardingState ?? '{}') } catch { /* keep empty */ }
  merged = { ...merged, ...body }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { onboardingState: JSON.stringify(merged) },
  })

  return NextResponse.json({ state: merged })
}
