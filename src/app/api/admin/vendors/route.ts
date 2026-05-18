import { NextResponse, NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import bcrypt               from 'bcryptjs'

/* ── GET /api/admin/vendors — list vendors for admin selection ─── */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()

  const where: any = { status: { in: ['APPROVED', 'PENDING'] } }
  if (q) {
    where.OR = [
      { companyName: { contains: q } },
      { user:       { name:  { contains: q } } },
      { user:       { email: { contains: q } } },
    ]
  }

  const vendors = await prisma.vendorProfile.findMany({
    where,
    select: {
      id:          true,
      companyName: true,
      city:        true,
      country:     true,
      status:      true,
      user: { select: { id: true, name: true, email: true, phone: true } },
    },
    orderBy: { companyName: 'asc' },
    take:    50,
  })

  return NextResponse.json({ success: true, data: vendors })
}

/* ── Temp password generator ─────────────────────────────────────── */
function generateTempPassword(): string {
  const upper   = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower   = 'abcdefghjkmnpqrstuvwxyz'
  const digits  = '23456789'
  const special = '!@#$%'
  const all     = upper + lower + digits + special

  const password = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
  ]
  for (let i = 4; i < 12; i++) {
    password.push(all[Math.floor(Math.random() * all.length)])
  }
  return password.sort(() => Math.random() - 0.5).join('')
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: {
    companyName:   string
    contactName:   string
    email:         string
    phone?:        string
    country?:      string   // full country name (resolved client-side from ISO code)
    city?:         string
    address?:      string
    tradeLicense?: string
    website?:      string
    notes?:        string
    documents?:    string[] // uploaded file paths
  }
  try { body = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { companyName, contactName, email } = body
  if (!companyName?.trim() || !contactName?.trim() || !email?.trim()) {
    return NextResponse.json({ error: 'Company name, contact name and email are required' }, { status: 400 })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } })
    if (existing) {
      return NextResponse.json({ error: 'A user with this email already exists' }, { status: 409 })
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)
    const now          = new Date()

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email:        email.toLowerCase().trim(),
          passwordHash,
          name:         contactName.trim(),
          phone:        body.phone?.trim()        || null,
          role:         'VENDOR',
          isActive:     true,
          permissions:  '{}',
        },
      })

      const profile = await tx.vendorProfile.create({
        data: {
          userId:       user.id,
          companyName:  companyName.trim(),
          tradeLicense: body.tradeLicense?.trim() || null,
          city:         body.city?.trim()         || null,
          address:      body.address?.trim()      || null,
          country:      body.country?.trim()      || 'UAE',
          website:      body.website?.trim()      || null,
          notes:        body.notes?.trim()        || null,
          documents:    JSON.stringify(body.documents ?? []),
          status:       'APPROVED',
          approvedAt:   now,
          approvedBy:   session.user.id,
        },
      })

      return { user, profile }
    })

    return NextResponse.json({
      vendorId:    result.profile.id,
      userId:      result.user.id,
      email:       result.user.email,
      tempPassword,
    })
  } catch (err: any) {
    console.error('[POST /api/admin/vendors]', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
