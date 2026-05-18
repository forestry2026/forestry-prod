import type { UserRole, VendorStatus, RfpStatus } from '@prisma/client'

export type { UserRole, VendorStatus, RfpStatus }

// ── Auth ────────────────────────────────────────────────────────
export interface SessionUser {
  id:              string
  email:           string
  name:            string
  role:            UserRole
  vendorProfileId: string | null
}

// ── Products ────────────────────────────────────────────────────
export interface ProductWithRelations {
  id:          string
  sku:         string
  name:        string
  description: string | null
  category:    string | null
  basePrice:   number | null
  isActive:    boolean
  isFeatured:  boolean
  images:      { id: string; url: string; alt: string | null; isPrimary: boolean; sortOrder: number }[]
  dimensions:  { dimension: DimensionOption }[]
  colors:      { color: ColorOption }[]
  textures:    { texture: TextureOption }[]
  finishes:    { finish: FinishOption }[]
  createdAt:   string
}

export interface DimensionOption {
  id:            string
  name:          string
  label:         string
  width:         number | null
  height:        number | null
  depth:         number | null
  priceModifier: number | null
  sortOrder:     number
}

export interface ColorOption {
  id:            string
  name:          string
  hexCode:       string | null
  priceModifier: number | null
  sortOrder:     number
}

export interface TextureOption {
  id:            string
  name:          string
  description:   string | null
  imageUrl:      string | null
  priceModifier: number | null
  sortOrder:     number
}

export interface FinishOption {
  id:            string
  name:          string
  description:   string | null
  imageUrl:      string | null
  priceModifier: number | null
  sortOrder:     number
}

// ── Enquiry ─────────────────────────────────────────────────────
export interface EnquiryItemLocal {
  id:          string
  product:     { id: string; name: string; sku: string; images: { url: string; alt: string | null }[] }
  dimension:   DimensionOption | null
  color:       ColorOption | null
  texture:     TextureOption | null
  finish:      FinishOption | null
  customWidth:  number | null
  customHeight: number | null
  customDepth:  number | null
  quantity:    number
  notes:       string | null
}

// ── RFP ─────────────────────────────────────────────────────────
export interface RfpWithDetails {
  id:              string
  rfpNumber:       string
  projectName:     string | null
  projectLocation: string | null
  deliveryAddress: string | null
  notes:           string | null
  status:          RfpStatus
  submittedAt:     string | null
  createdAt:       string
  items:           RfpItemDetail[]
  quotes:          RfpQuoteDetail[]
}

export interface RfpItemDetail {
  id:           string
  product:      { id: string; name: string; sku: string }
  dimension:    DimensionOption | null
  color:        ColorOption | null
  texture:      TextureOption | null
  finish:       FinishOption | null
  customWidth:  number | null
  customHeight: number | null
  customDepth:  number | null
  quantity:     number
  notes:        string | null
  unitPrice:    number | null
  totalPrice:   number | null
}

export interface RfpQuoteDetail {
  id:         string
  subtotal:   number
  discount:   number | null
  tax:        number | null
  shipping:   number | null
  total:      number
  validUntil: string
  terms:      string | null
  sentAt:     string | null
  createdAt:  string
  quotedBy:   { name: string }
}

// ── Forms ────────────────────────────────────────────────────────
export interface AccessRequestForm {
  name:         string
  email:        string
  companyName:  string
  phone:        string
  tradeLicense?: string
  message?:     string
}

export interface LoginForm {
  email:    string
  password: string
}

// ── API Responses ────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean
  data?:   T
  error?:  string
  message?: string
}

// ── Status badge colours ─────────────────────────────────────────
export const RFP_STATUS_STYLES: Record<RfpStatus, string> = {
  DRAFT:        'bg-gray-100 text-gray-700',
  SUBMITTED:    'bg-blue-100 text-blue-700',
  UNDER_REVIEW: 'bg-yellow-100 text-yellow-700',
  QUOTED:       'bg-purple-100 text-purple-700',
  ACCEPTED:     'bg-green-100 text-green-700',
  REJECTED:     'bg-red-100 text-red-700',
  EXPIRED:      'bg-gray-100 text-gray-500',
}

export const VENDOR_STATUS_STYLES: Record<VendorStatus, string> = {
  PENDING:  'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  REJECTED: 'bg-red-100 text-red-700',
}
