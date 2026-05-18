import { NextResponse }    from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // ADMIN users always have full access — permissions cannot be restricted
  if (target.role === 'ADMIN') {
    return NextResponse.json({ error: 'Cannot set permissions for Admin users' }, { status: 400 })
  }

  let body: { permissions?: Record<string, string> }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const permissions = body.permissions ?? {}

  await prisma.user.update({
    where: { id },
    data:  { permissions: JSON.stringify(permissions) },
  })

  return NextResponse.json({ success: true })
}
