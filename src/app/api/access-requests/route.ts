import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { z }                         from 'zod'
import { sendAccessRequestReceived } from '@/lib/email'

const schema = z.object({
  name:          z.string().min(2),
  email:         z.string().email(),
  companyName:   z.string().min(2),
  phone:         z.string().min(4),
  country:       z.string().optional(),
  tradeLicense:  z.string().optional(),
  documentPaths: z.array(z.string()).optional(),
  message:       z.string().optional(),
})

// POST /api/access-requests — public
export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data

    // Duplicate pending request check
    const existing = await prisma.accessRequest.findFirst({
      where: { email: data.email.toLowerCase(), status: 'PENDING' },
    })
    if (existing) {
      return NextResponse.json({ error: 'A pending request already exists for this email.' }, { status: 409 })
    }

    const request = await prisma.accessRequest.create({
      data: {
        name:         data.name,
        email:        data.email.toLowerCase(),
        companyName:  data.companyName,
        phone:        data.phone,
        country:      data.country      || null,
        tradeLicense: data.tradeLicense || null,
        documents:    data.documentPaths?.length ? JSON.stringify(data.documentPaths) : null,
        message:      data.message      || null,
      },
    })

    // Send confirmation email (non-blocking)
    sendAccessRequestReceived(data.email, data.name).catch(console.error)

    return NextResponse.json({ success: true, data: { id: request.id } }, { status: 201 })
  } catch (error: any) {
    console.error('[access-requests POST]', error)
    return NextResponse.json({ error: error?.message ?? 'Internal server error' }, { status: 500 })
  }
}

// GET /api/access-requests — admin only
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || 'PENDING'
  const page   = parseInt(searchParams.get('page') || '1')
  const limit  = 20
  const skip   = (page - 1) * limit

  const [requests, total] = await Promise.all([
    prisma.accessRequest.findMany({
      where:   status === 'ALL' ? {} : { status: status as any },
      orderBy: { createdAt: 'desc' },
      take:    limit,
      skip,
    }),
    prisma.accessRequest.count({
      where: status === 'ALL' ? {} : { status: status as any },
    }),
  ])

  return NextResponse.json({ success: true, data: requests, meta: { total, page, limit } })
}
