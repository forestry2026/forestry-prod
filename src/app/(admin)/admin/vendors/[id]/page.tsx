import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import {
  ArrowLeft, Truck, Mail, Phone, Building2,
  FileText, Calendar, CheckCircle, Clock, ShieldCheck,
  PackageSearch,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'Vendor Details - Forestry Admin',
}

function formatDate(date: Date | string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateShort(date: Date | string | null) {
  if (!date) return '—'
  return new Date(date).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function VendorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/login')
  }

  const { id } = await params

  const vendor = await prisma.vendorProfile.findUnique({
    where: { id },
    include: {
      user: true,
      rfps: { include: { items: true }, take: 10, orderBy: { createdAt: 'desc' } },
    },
  })

  if (!vendor) notFound()

  const initials = vendor.companyName
    .split(' ')
    .map(w => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── Back button ── */}
      <Link
        href="/admin/vendors"
        className="inline-flex items-center gap-2 text-sm text-charcoal/50 hover:text-charcoal transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Vendors
      </Link>

      {/* ── Hero / header card ── */}
      <div className="bg-white rounded-2xl border border-cream-darker shadow-card p-6">
        <div className="flex items-start gap-5">
          {/* Avatar / logo */}
          {vendor.logoUrl ? (
            <div className="w-16 h-16 rounded-2xl border border-[#E8E0D5] bg-cream/60 flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={vendor.logoUrl} alt={vendor.companyName} className="w-full h-full object-contain p-1.5" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-terracotta/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xl font-bold text-terracotta font-heading">{initials}</span>
            </div>
          )}

          {/* Name + status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-charcoal font-heading leading-tight">
                {vendor.companyName}
              </h1>
              {vendor.status === 'APPROVED' && (
                <span className="badge-sage">
                  <CheckCircle className="w-3 h-3" /> Approved
                </span>
              )}
              {vendor.status === 'PENDING' && (
                <span className="badge-yellow">
                  <Clock className="w-3 h-3" /> Pending
                </span>
              )}
              {vendor.status === 'REJECTED' && (
                <span className="badge-red">Rejected</span>
              )}
            </div>
            <p className="text-charcoal/50 text-sm mt-1">{vendor.user.email}</p>
          </div>

          {/* RFP count pill */}
          <div className="flex-shrink-0 text-right">
            <p className="text-3xl font-bold text-charcoal font-heading">{vendor.rfps.length}</p>
            <p className="text-xs text-charcoal/40 font-semibold uppercase tracking-wider mt-0.5">RFPs</p>
          </div>
        </div>
      </div>

      {/* ── Contact + Company grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Contact Information */}
        <div className="bg-white rounded-2xl border border-cream-darker shadow-card p-6 space-y-5">
          <h2 className="text-sm font-bold text-charcoal/50 uppercase tracking-wider">Contact Information</h2>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-charcoal/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Email</p>
              <p className="text-sm font-medium text-charcoal">{vendor.user.email}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-charcoal/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Phone</p>
              <p className="text-sm font-medium text-charcoal">
                {vendor.user.phone || <span className="text-charcoal/30 italic">Not provided</span>}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
              <Truck className="w-4 h-4 text-charcoal/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Contact Name</p>
              <p className="text-sm font-medium text-charcoal">{vendor.user.name}</p>
            </div>
          </div>
        </div>

        {/* Company Details */}
        <div className="bg-white rounded-2xl border border-cream-darker shadow-card p-6 space-y-5">
          <h2 className="text-sm font-bold text-charcoal/50 uppercase tracking-wider">Company Details</h2>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-charcoal/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Company Name</p>
              <p className="text-sm font-medium text-charcoal">{vendor.companyName}</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4 text-charcoal/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Trade License</p>
              <p className="text-sm font-medium text-charcoal">
                {vendor.tradeLicense || <span className="text-charcoal/30 italic">Not provided</span>}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-charcoal/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Status</p>
              {vendor.status === 'APPROVED' && <span className="badge-sage"><CheckCircle className="w-3 h-3" /> Approved</span>}
              {vendor.status === 'PENDING'  && <span className="badge-yellow"><Clock className="w-3 h-3" /> Pending</span>}
              {vendor.status === 'REJECTED' && <span className="badge-red">Rejected</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div className="bg-white rounded-2xl border border-cream-darker shadow-card p-6">
        <h2 className="text-sm font-bold text-charcoal/50 uppercase tracking-wider mb-5">Timeline</h2>

        <div className="flex flex-wrap gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cream flex items-center justify-center flex-shrink-0">
              <Calendar className="w-4 h-4 text-charcoal/40" />
            </div>
            <div>
              <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Registered</p>
              <p className="text-sm font-medium text-charcoal">{formatDate(vendor.createdAt)}</p>
            </div>
          </div>

          {vendor.approvedAt && (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-sage/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-[#4A7A3D]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-charcoal/40 mb-0.5">Approved</p>
                <p className="text-sm font-medium text-charcoal">{formatDate(vendor.approvedAt)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent RFPs ── */}
      <div className="bg-white rounded-2xl border border-cream-darker shadow-card overflow-hidden">
        <div className="px-6 py-4 border-b border-cream-darker flex items-center justify-between">
          <h2 className="text-sm font-bold text-charcoal/50 uppercase tracking-wider">Recent RFPs</h2>
          <span className="text-xs font-semibold text-charcoal/40">{vendor.rfps.length} total</span>
        </div>

        {vendor.rfps.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <PackageSearch className="w-8 h-8 mx-auto mb-2 text-charcoal/20" />
            <p className="text-sm text-charcoal/40">No RFPs submitted yet</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-cream border-b border-cream-darker">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-charcoal/50 uppercase tracking-wider">RFP Number</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-charcoal/50 uppercase tracking-wider">Project Name</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-charcoal/50 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-charcoal/50 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-charcoal/50 uppercase tracking-wider">Submitted</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-darker">
              {vendor.rfps.map((rfp) => (
                <tr key={rfp.id} className="hover:bg-cream/50 transition-colors">
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/rfps/${rfp.id}`}
                      className="text-sm font-semibold text-terracotta hover:underline"
                    >
                      {rfp.rfpNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal">{rfp.projectName || '—'}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-charcoal">{rfp.items.length}</td>
                  <td className="px-6 py-4">
                    {rfp.status === 'SUBMITTED' && <span className="badge-blue">Submitted</span>}
                    {rfp.status === 'QUOTED'    && <span className="badge-sage">Quoted</span>}
                    {rfp.status === 'ACCEPTED'  && <span className="badge-green">Accepted</span>}
                    {rfp.status === 'DRAFT'     && <span className="badge-charcoal">Draft</span>}
                  </td>
                  <td className="px-6 py-4 text-sm text-charcoal/50">
                    {formatDateShort(rfp.submittedAt ?? null)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}
