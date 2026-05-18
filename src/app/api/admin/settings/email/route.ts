import { NextRequest, NextResponse }    from 'next/server'
import { getServerSession }             from 'next-auth'
import { authOptions }                  from '@/lib/auth'
import { prisma }                       from '@/lib/prisma'
import { invalidateEmailConfigCache }   from '@/lib/emailConfig'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

// GET — return current values (key masked)
export async function GET() {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.siteSetting.findMany({
    where: { key: { in: ['email_resend_api_key', 'email_from', 'admin_email'] } },
  })
  const db = Object.fromEntries(rows.map(r => [r.key, r.value]))

  return NextResponse.json({
    resendApiKey: db['email_resend_api_key'] ? '••••••••••••••••••••' : '',
    emailFrom:    db['email_from']    || process.env.EMAIL_FROM  || '',
    adminEmail:   db['admin_email']   || process.env.ADMIN_EMAIL || '',
    hasKey:       !!db['email_resend_api_key'] || !!process.env.RESEND_API_KEY,
  })
}

// POST — upsert into SiteSetting
export async function POST(req: NextRequest) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { resendApiKey, emailFrom, adminEmail } = await req.json()

  const upserts: { key: string; value: string }[] = []

  // Only save API key if it's a real value (not masked placeholder)
  if (resendApiKey && !resendApiKey.startsWith('•')) {
    upserts.push({ key: 'email_resend_api_key', value: resendApiKey.trim() })
  }
  if (emailFrom?.trim())  upserts.push({ key: 'email_from',  value: emailFrom.trim()  })
  if (adminEmail?.trim()) upserts.push({ key: 'admin_email', value: adminEmail.trim() })

  await Promise.all(
    upserts.map(({ key, value }) =>
      prisma.siteSetting.upsert({
        where:  { key },
        update: { value },
        create: { key, value },
      })
    )
  )

  // Bust the in-process cache so next email send picks up new values immediately
  invalidateEmailConfigCache()

  return NextResponse.json({ success: true })
}
