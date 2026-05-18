import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { sendPasswordReset } from '@/lib/email'

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { tempPassword?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!body.tempPassword) {
    return NextResponse.json({ error: 'tempPassword required' }, { status: 400 })
  }

  const { id } = await params
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await sendPasswordReset(user.email, user.name, body.tempPassword)

  return NextResponse.json({ success: true })
}
