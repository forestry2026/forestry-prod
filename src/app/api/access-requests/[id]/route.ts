import { NextRequest, NextResponse }              from 'next/server'
import { getServerSession }                        from 'next-auth'
import { authOptions }                             from '@/lib/auth'
import { prisma }                                  from '@/lib/prisma'
import { z }                                       from 'zod'
import bcrypt                                      from 'bcryptjs'
import { Prisma }                                  from '@prisma/client'
import { generatePassword }                        from '@/lib/utils'
import { sendAccessApproved, sendAccessRejected, sendAccessRevoked } from '@/lib/email'

const patchSchema = z.discriminatedUnion('action', [
  z.object({ action: z.literal('approve')   }),
  z.object({ action: z.literal('reject'),   reason: z.string().optional() }),
  z.object({ action: z.literal('revoke'),   reason: z.string().optional() }),
  z.object({ action: z.literal('reapprove') }),
])

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body   = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })

  const request = await prisma.accessRequest.findUnique({ where: { id } })
  if (!request) return NextResponse.json({ error: 'Request not found.' }, { status: 404 })

  const { action } = parsed.data

  /* ── Guard: ensure action makes sense for the current status ──────────────── */
  if (action === 'approve'   && request.status !== 'PENDING')  {
    return NextResponse.json({ error: 'Only pending requests can be approved. Use "reapprove" for rejected requests.' }, { status: 409 })
  }
  if (action === 'reject'    && request.status !== 'PENDING')  {
    return NextResponse.json({ error: 'Only pending requests can be rejected. Use "revoke" to cancel an approved vendor.' }, { status: 409 })
  }
  if (action === 'revoke'    && request.status !== 'APPROVED') {
    return NextResponse.json({ error: 'Only approved vendors can be revoked.' }, { status: 409 })
  }
  if (action === 'reapprove' && request.status !== 'REJECTED') {
    return NextResponse.json({ error: 'Only rejected requests can be re-approved.' }, { status: 409 })
  }

  /* ────────────────────────────────────────────────────────────────────────────
     APPROVE  (PENDING → APPROVED)  — create new User + VendorProfile
  ──────────────────────────────────────────────────────────────────────────── */
  if (action === 'approve') {
    const password     = generatePassword()
    const passwordHash = await bcrypt.hash(password, 12)

    try {
      await prisma.$transaction(async (tx) => {
        await tx.user.create({
          data: {
            email:        request.email,
            name:         request.name,
            passwordHash,
            role:         'VENDOR',
            isActive:     true,
            vendorProfile: {
              create: {
                companyName:  request.companyName,
                tradeLicense: request.tradeLicense,
                status:       'APPROVED',
                approvedAt:   new Date(),
                approvedBy:   session.user.id,
              },
            },
          },
        })
        await tx.accessRequest.update({
          where: { id },
          data:  { status: 'APPROVED', processedAt: new Date(), processedBy: session.user.id },
        })
        await tx.auditLog.create({
          data: {
            userId: session.user.id, action: 'VENDOR_APPROVED',
            entityType: 'AccessRequest', entityId: id,
            details: JSON.stringify({ vendorEmail: request.email, vendorName: request.name }),
          },
        })
      })
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        return NextResponse.json(
          { error: `A user account for ${request.email} already exists. Use "reapprove" if this vendor was previously revoked.` },
          { status: 409 },
        )
      }
      console.error('[APPROVE]', err)
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
    }

    let emailSent = false
    try { await sendAccessApproved(request.email, request.name, password); emailSent = true }
    catch (e) { console.error('[APPROVE] email failed:', e) }

    return NextResponse.json({ success: true, emailSent, credentials: { email: request.email, password } })
  }

  /* ────────────────────────────────────────────────────────────────────────────
     REJECT  (PENDING → REJECTED)  — no account exists yet, just update status
  ──────────────────────────────────────────────────────────────────────────── */
  if (action === 'reject') {
    const reason = (parsed.data as { reason?: string }).reason
    await prisma.$transaction(async (tx) => {
      await tx.accessRequest.update({
        where: { id },
        data:  { status: 'REJECTED', processedAt: new Date(), processedBy: session.user.id },
      })
      await tx.auditLog.create({
        data: {
          userId: session.user.id, action: 'VENDOR_REJECTED',
          entityType: 'AccessRequest', entityId: id,
          details: JSON.stringify({ reason: reason ?? null }),
        },
      })
    })

    let emailSent = false
    try { await sendAccessRejected(request.email, request.name, reason); emailSent = true }
    catch (e) { console.error('[REJECT] email failed:', e) }

    return NextResponse.json({ success: true, emailSent })
  }

  /* ────────────────────────────────────────────────────────────────────────────
     REVOKE  (APPROVED → REJECTED)  — deactivate existing account
  ──────────────────────────────────────────────────────────────────────────── */
  if (action === 'revoke') {
    const reason = (parsed.data as { reason?: string }).reason

    // Find the vendor's user account
    const vendorUser = await prisma.user.findUnique({
      where:   { email: request.email },
      include: { vendorProfile: true },
    })

    await prisma.$transaction(async (tx) => {
      // Deactivate login
      if (vendorUser) {
        await tx.user.update({
          where: { id: vendorUser.id },
          data:  { isActive: false },
        })
        if (vendorUser.vendorProfile) {
          await tx.vendorProfile.update({
            where: { id: vendorUser.vendorProfile.id },
            data:  { status: 'REJECTED' },
          })
        }
      }

      await tx.accessRequest.update({
        where: { id },
        data:  { status: 'REJECTED', processedAt: new Date(), processedBy: session.user.id },
      })

      await tx.auditLog.create({
        data: {
          userId: session.user.id, action: 'VENDOR_REVOKED',
          entityType: 'AccessRequest', entityId: id,
          details: JSON.stringify({ vendorEmail: request.email, reason: reason ?? null }),
        },
      })
    })

    let emailSent = false
    try { await sendAccessRevoked(request.email, request.name, reason); emailSent = true }
    catch (e) { console.error('[REVOKE] email failed:', e) }

    return NextResponse.json({ success: true, emailSent })
  }

  /* ────────────────────────────────────────────────────────────────────────────
     REAPPROVE  (REJECTED → APPROVED)
     — reactivate existing account, or create new one if it never existed
  ──────────────────────────────────────────────────────────────────────────── */
  if (action === 'reapprove') {
    const password     = generatePassword()
    const passwordHash = await bcrypt.hash(password, 12)

    const existingUser = await prisma.user.findUnique({
      where:   { email: request.email },
      include: { vendorProfile: true },
    })

    try {
      if (existingUser) {
        // Reactivate the existing account with a fresh password
        await prisma.$transaction(async (tx) => {
          await tx.user.update({
            where: { id: existingUser.id },
            data:  { isActive: true, passwordHash },
          })
          if (existingUser.vendorProfile) {
            await tx.vendorProfile.update({
              where: { id: existingUser.vendorProfile.id },
              data:  { status: 'APPROVED', approvedAt: new Date(), approvedBy: session.user.id },
            })
          }
          await tx.accessRequest.update({
            where: { id },
            data:  { status: 'APPROVED', processedAt: new Date(), processedBy: session.user.id },
          })
          await tx.auditLog.create({
            data: {
              userId: session.user.id, action: 'VENDOR_REAPPROVED',
              entityType: 'AccessRequest', entityId: id,
              details: JSON.stringify({ vendorEmail: request.email, reactivated: true }),
            },
          })
        })
      } else {
        // No account ever created — treat exactly like a first approval
        await prisma.$transaction(async (tx) => {
          await tx.user.create({
            data: {
              email:        request.email,
              name:         request.name,
              passwordHash,
              role:         'VENDOR',
              isActive:     true,
              vendorProfile: {
                create: {
                  companyName:  request.companyName,
                  tradeLicense: request.tradeLicense,
                  status:       'APPROVED',
                  approvedAt:   new Date(),
                  approvedBy:   session.user.id,
                },
              },
            },
          })
          await tx.accessRequest.update({
            where: { id },
            data:  { status: 'APPROVED', processedAt: new Date(), processedBy: session.user.id },
          })
          await tx.auditLog.create({
            data: {
              userId: session.user.id, action: 'VENDOR_REAPPROVED',
              entityType: 'AccessRequest', entityId: id,
              details: JSON.stringify({ vendorEmail: request.email, reactivated: false }),
            },
          })
        })
      }
    } catch (err) {
      console.error('[REAPPROVE]', err)
      return NextResponse.json({ error: 'An unexpected error occurred.' }, { status: 500 })
    }

    let emailSent = false
    try { await sendAccessApproved(request.email, request.name, password); emailSent = true }
    catch (e) { console.error('[REAPPROVE] email failed:', e) }

    return NextResponse.json({ success: true, emailSent, credentials: { email: request.email, password } })
  }
}
