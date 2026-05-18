import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import bcrypt                        from 'bcryptjs'
import { generatePassword }          from '@/lib/utils'
import { sendAccessApproved }        from '@/lib/email'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // id is vendorProfile.id — fetch profile + user
  const vendor = await prisma.vendorProfile.findUnique({
    where:   { id },
    include: { user: true },
  })
  if (!vendor) return NextResponse.json({ error: 'Vendor not found.' }, { status: 404 })

  // Generate a new temporary password and update the user's hash
  const password     = generatePassword()
  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.user.update({
    where: { id: vendor.userId },
    data:  { passwordHash },
  })

  await prisma.auditLog.create({
    data: {
      userId:     session.user.id,
      action:     'VENDOR_CREDENTIALS_RESENT',
      entityType: 'VendorProfile',
      entityId:   id,
      details:    JSON.stringify({ vendorEmail: vendor.user.email, sentBy: session.user.email }),
    },
  })

  // Send credentials email
  let emailSent = false
  try {
    await sendAccessApproved(vendor.user.email, vendor.user.name, password)
    emailSent = true
  } catch (err) {
    console.error('[resend-credentials] email failed:', err)
  }

  return NextResponse.json({
    success: true,
    emailSent,
    credentials: { email: vendor.user.email, password },
  })
}
