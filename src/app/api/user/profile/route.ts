import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const name  = typeof body.name  === 'string' ? body.name.trim()  : undefined
  const phone = typeof body.phone === 'string' ? body.phone.trim() : body.phone === null ? null : undefined

  if (name !== undefined && name.length === 0) {
    return NextResponse.json({ error: 'Name cannot be empty' }, { status: 400 })
  }

  const data: Record<string, any> = {}
  if (name  !== undefined) data.name  = name
  if (phone !== undefined) data.phone = phone || null

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
  }

  await prisma.user.update({ where: { id: session.user.id }, data })

  return NextResponse.json({ ok: true })
}
