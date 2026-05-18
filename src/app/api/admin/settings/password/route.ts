import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import bcrypt               from 'bcryptjs'

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { currentPassword?: string; newPassword?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { currentPassword, newPassword } = body
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Both fields required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const match = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!match) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })

  const hash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({ where: { id: session.user.id }, data: { passwordHash: hash } })

  return NextResponse.json({ success: true })
}
