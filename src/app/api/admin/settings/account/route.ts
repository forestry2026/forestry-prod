import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: string; phone?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const name = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { name, phone: body.phone?.trim() || undefined },
  })

  return NextResponse.json({ success: true })
}
