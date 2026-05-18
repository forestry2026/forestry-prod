import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import { prisma }                     from '@/lib/prisma'

export const runtime = 'nodejs'

const KEYS = ['company_name', 'company_trn', 'company_email', 'company_phone', 'company_address'] as const
type Key = typeof KEYS[number]

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) return null
  return session
}

/* GET — read current company details (used by Settings page + PDF builder). */
export async function GET() {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.siteSetting.findMany({ where: { key: { in: KEYS as unknown as string[] } } })
  const db = Object.fromEntries(rows.map(r => [r.key, r.value]))

  return NextResponse.json({
    name:    db['company_name']    ?? '',
    trn:     db['company_trn']     ?? '',
    email:   db['company_email']   ?? '',
    phone:   db['company_phone']   ?? '',
    address: db['company_address'] ?? '',
  })
}

/* POST — admin updates company details. */
export async function POST(req: NextRequest) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const map: Partial<Record<Key, string>> = {
    company_name:    body.name,
    company_trn:     body.trn,
    company_email:   body.email,
    company_phone:   body.phone,
    company_address: body.address,
  }

  await Promise.all(
    (Object.entries(map) as [Key, string | undefined][])
      .map(([key, value]) =>
        prisma.siteSetting.upsert({
          where:  { key },
          update: { value: (value ?? '').trim() },
          create: { key, value: (value ?? '').trim() },
        })
      )
  )

  return NextResponse.json({ success: true })
}
