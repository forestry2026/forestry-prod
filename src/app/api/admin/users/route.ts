import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import bcrypt               from 'bcryptjs'

const ALLOWED_ROLES = ['ADMIN', 'MANAGER', 'PRODUCTION']

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

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: { name?: string; email?: string; phone?: string; role?: string }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { name, email, role, phone } = body

  if (!name?.trim())  return NextResponse.json({ error: 'Name is required'  }, { status: 400 })
  if (!email?.trim()) return NextResponse.json({ error: 'Email is required' }, { status: 400 })
  if (!role || !ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const emailNorm = email.toLowerCase().trim()
  const existing  = await prisma.user.findUnique({ where: { email: emailNorm } })
  if (existing) return NextResponse.json({ error: 'Email already in use' }, { status: 409 })

  const tempPassword   = generateTempPassword()
  const passwordHash   = await bcrypt.hash(tempPassword, 12)

  const user = await prisma.user.create({
    data: {
      name:         name.trim(),
      email:        emailNorm,
      phone:        phone?.trim() || null,
      role,
      passwordHash,
      isActive:     true,
    },
  })

  return NextResponse.json({ success: true, userId: user.id, tempPassword }, { status: 201 })
}
