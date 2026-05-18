import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import VendorsClient        from './VendorsClient'
import { parsePermissions, canAccess, canEdit } from '@/lib/portal-permissions'

export const metadata: Metadata = { title: 'Vendors — Forestry Admin' }

export default async function VendorsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userRec   = await prisma.user.findUnique({ where: { id: session.user.id }, select: { permissions: true } })
  const userPerms = parsePermissions(userRec?.permissions)
  if (!canAccess(session.user.role, userPerms, 'vendors')) redirect('/admin')
  const readonly  = !canEdit(session.user.role, userPerms, 'vendors')

  /* ── Vendor profiles ── */
  const raw = await prisma.vendorProfile.findMany({
    include: { user: true, rfps: true },
    orderBy: { createdAt: 'desc' },
  })

  const approvedIds = raw.filter(v => v.status === 'APPROVED').map(v => v.id)
  const resendLogs  = approvedIds.length
    ? await prisma.auditLog.findMany({
        where:   { entityType: 'VendorProfile', entityId: { in: approvedIds }, action: 'VENDOR_CREDENTIALS_RESENT' },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const lastSentMap: Record<string, string> = {}
  for (const log of resendLogs) {
    if (!lastSentMap[log.entityId]) lastSentMap[log.entityId] = log.createdAt.toISOString()
  }

  const statusCounts: Record<string, number> = {}
  for (const v of raw) {
    statusCounts[v.status] = (statusCounts[v.status] ?? 0) + 1
  }

  const vendors = raw.map(v => ({
    id:          v.id,
    companyName: v.companyName,
    logoUrl:     v.logoUrl ?? null,
    status:      v.status,
    rfpCount:    v.rfps.length,
    approvedAt:  v.approvedAt  ? v.approvedAt.toISOString()  : null,
    lastSentAt:  lastSentMap[v.id] ?? null,
    city:        v.city    ?? null,
    country:     v.country ?? null,
    createdAt:   v.createdAt.toISOString(),
    user:        { email: v.user.email, name: v.user.name },
  }))

  /* ── Access requests ── */
  const rawRequests = await prisma.accessRequest.findMany({
    orderBy: { createdAt: 'desc' },
  })

  const accessRequestCounts: Record<string, number> = { PENDING: 0, APPROVED: 0, REJECTED: 0 }
  for (const r of rawRequests) {
    if (r.status in accessRequestCounts) accessRequestCounts[r.status]++
  }

  // For approved requests look up vendorProfile via user email
  const approvedEmails = rawRequests.filter(r => r.status === 'APPROVED').map(r => r.email)
  const vendorUsers = approvedEmails.length
    ? await prisma.user.findMany({
        where:   { email: { in: approvedEmails } },
        include: { vendorProfile: true },
      })
    : []

  const vendorMap: Record<string, { vendorProfileId: string; approvedAt: string | null }> = {}
  for (const u of vendorUsers) {
    if (u.vendorProfile) {
      vendorMap[u.email] = {
        vendorProfileId: u.vendorProfile.id,
        approvedAt:      u.vendorProfile.approvedAt?.toISOString() ?? null,
      }
    }
  }

  const arVendorIds = Object.values(vendorMap).map(v => v.vendorProfileId)
  const arResendLogs = arVendorIds.length
    ? await prisma.auditLog.findMany({
        where:   { entityType: 'VendorProfile', entityId: { in: arVendorIds }, action: 'VENDOR_CREDENTIALS_RESENT' },
        orderBy: { createdAt: 'desc' },
      })
    : []

  const arLastSentMap: Record<string, string> = {}
  for (const log of arResendLogs) {
    if (!arLastSentMap[log.entityId]) arLastSentMap[log.entityId] = log.createdAt.toISOString()
  }

  const accessRequests = rawRequests.map(r => {
    const vd = vendorMap[r.email] ?? null
    return {
      id:               r.id,
      name:             r.name,
      email:            r.email,
      companyName:      r.companyName,
      phone:            r.phone,
      country:          r.country    ?? null,
      tradeLicense:     r.tradeLicense ?? null,
      documents:        r.documents  ?? null,
      message:          r.message   ?? null,
      status:           r.status,
      processedAt:      r.processedAt?.toISOString() ?? null,
      createdAt:        r.createdAt.toISOString(),
      vendorProfileId:  vd?.vendorProfileId  ?? null,
      vendorApprovedAt: vd?.approvedAt        ?? null,
      vendorLastSentAt: vd ? (arLastSentMap[vd.vendorProfileId] ?? null) : null,
    }
  })

  return (
    <VendorsClient
      vendors={vendors}
      statusCounts={statusCounts}
      accessRequests={accessRequests}
      accessRequestCounts={accessRequestCounts}
      readonly={readonly}
    />
  )
}
