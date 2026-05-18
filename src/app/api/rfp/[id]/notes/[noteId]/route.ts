import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

type Params = { params: Promise<{ id: string; noteId: string }> }

// DELETE /api/rfp/[id]/notes/[noteId] — author or ADMIN can delete
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { noteId } = await params

  const note = await prisma.rfpNote.findUnique({ where: { id: noteId } })
  if (!note) return NextResponse.json({ error: 'Note not found' }, { status: 404 })

  // Only note author or ADMIN can delete
  const isAuthor = note.userId === session.user.id
  const isAdmin  = session.user.role === 'ADMIN'
  if (!isAuthor && !isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  await prisma.rfpNote.delete({ where: { id: noteId } })

  return NextResponse.json({ success: true })
}
