import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import bcrypt               from 'bcryptjs'
import { sendPasswordReset } from '@/lib/email'

function generateTempPassword(): string {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower   = 'abcdefghijkmnpqrstuvwxyz'
  const digits  = '23456789'
  const special = '!@#$'
  const all     = upper + lower + digits + special
  let pw =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)]
  for (let i = 4; i < 12; i++) pw += all[Math.floor(Math.random() * all.length)]
  return pw.split('').sort(() => Math.random() - 0.5).join('')
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  let body: { sendEmail?: boolean } = {}
  try { body = await req.json() } catch { /* optional body */ }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const tempPassword = generateTempPassword()
  const hash         = await bcrypt.hash(tempPassword, 12)

  await prisma.user.update({ where: { id }, data: { passwordHash: hash } })

  if (body.sendEmail) {
    try {
      await sendPasswordReset(user.email, user.name, tempPassword)
    } catch {
      // email failure is non-fatal — password still reset
    }
  }

  return NextResponse.json({ success: true, tempPassword })
}
