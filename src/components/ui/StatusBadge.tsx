import type { RfpStatus, VendorStatus } from '@prisma/client'

const RFP_STYLES: Record<RfpStatus, string> = {
  DRAFT:        'badge-charcoal',
  SUBMITTED:    'badge-blue',
  UNDER_REVIEW: 'badge-yellow',
  QUOTED:       'badge-purple',
  ACCEPTED:     'badge-green',
  REJECTED:     'badge-red',
  EXPIRED:      'bg-gray-100 text-gray-500 badge',
}

const VENDOR_STYLES: Record<VendorStatus, string> = {
  PENDING:  'badge-yellow',
  APPROVED: 'badge-green',
  REJECTED: 'badge-red',
}

const RFP_LABELS: Record<RfpStatus, string> = {
  DRAFT:        'Draft',
  SUBMITTED:    'Submitted',
  UNDER_REVIEW: 'Under Review',
  QUOTED:       'Quoted',
  ACCEPTED:     'Accepted',
  REJECTED:     'Rejected',
  EXPIRED:      'Expired',
}

export function RfpStatusBadge({ status }: { status: RfpStatus }) {
  return (
    <span className={RFP_STYLES[status]}>
      {RFP_LABELS[status]}
    </span>
  )
}

export function VendorStatusBadge({ status }: { status: VendorStatus }) {
  return (
    <span className={VENDOR_STYLES[status]}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  )
}
