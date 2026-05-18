import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

const ALLOWED_ROLES = ['ADMIN', 'MANAGER', 'PRODUCTION']

type Params = { params: Promise<{ id: string }> }

// GET /api/rfp/[id]/notes — list notes newest-first
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const notes = await prisma.rfpNote.findMany({
    where:   { rfpId: id },
    include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ success: true, data: notes })
}

// POST /api/rfp/[id]/notes — create note
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session || !ALLOWED_ROLES.includes(session.user.role)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  let body: unknown
  try { body = await req.json() }
  catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const bodyText = (body as any)?.body
  if (!bodyText || typeof bodyText !== 'string' || !bodyText.trim()) {
    return NextResponse.json({ error: 'Note body is required' }, { status: 400 })
  }

  // Verify RFP exists
  const rfp = await prisma.rfp.findUnique({ where: { id }, select: { id: true } })
  if (!rfp) return NextResponse.json({ error: 'RFP not found' }, { status: 404 })

  const note = await prisma.rfpNote.create({
    data: {
      rfpId:  id,
      userId: session.user.id,
      body:   bodyText.trim(),
    },
    include: { user: { select: { id: true, name: true, role: true, avatarUrl: true } } },
  })

  return NextResponse.json({ success: true, data: note }, { status: 201 })
}
