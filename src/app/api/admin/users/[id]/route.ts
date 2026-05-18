import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'

const ALLOWED_ROLES = ['ADMIN', 'MANAGER', 'PRODUCTION']

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: { name?: string; email?: string; phone?: string; role?: string; isActive?: boolean }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  // Build update payload — only include provided fields
  const data: Record<string, unknown> = {}

  if (body.name  !== undefined) data.name     = body.name.trim()
  if (body.phone !== undefined) data.phone    = body.phone?.trim() || null
  if (body.role  !== undefined) {
    if (!ALLOWED_ROLES.includes(body.role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }
    // Prevent demoting the only ADMIN if target is ADMIN and role changes
    if (target.role === 'ADMIN' && body.role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Cannot demote the only admin' }, { status: 400 })
      }
    }
    data.role = body.role
  }
  if (body.email !== undefined) {
    const emailNorm = body.email.toLowerCase().trim()
    const clash = await prisma.user.findFirst({ where: { email: emailNorm, NOT: { id } } })
    if (clash) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })
    data.email = emailNorm
  }
  if (body.isActive !== undefined) {
    // Prevent deactivating self
    if (id === session.user.id && body.isActive === false) {
      return NextResponse.json({ error: 'Cannot deactivate your own account' }, { status: 400 })
    }
    data.isActive = body.isActive
  }

  const updated = await prisma.user.update({ where: { id }, data })
  return NextResponse.json({ success: true, userId: updated.id })
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  if (id === session.user.id) {
    return NextResponse.json({ error: 'Cannot delete your own account' }, { status: 400 })
  }

  const target = await prisma.user.findUnique({ where: { id } })
  if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  if (target.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    if (adminCount <= 1) {
      return NextResponse.json({ error: 'Cannot delete the only admin' }, { status: 400 })
    }
  }

  await prisma.user.delete({ where: { id } })
  return NextResponse.json({ success: true })
}
