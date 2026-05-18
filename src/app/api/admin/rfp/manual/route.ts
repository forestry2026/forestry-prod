/**
 * POST /api/admin/rfp/manual
 *
 * Admin manually creates an RFP on behalf of a vendor.
 * Vendor can be:
 *  - existing (mode='existing' + vendorProfileId)
 *  - new external (mode='new' + companyName, contactName, email)
 *
 * Created RFP starts at status 'SUBMITTED' (not DRAFT) since admin already filled it,
 * and is marked source='MANUAL' so we can distinguish vendor-self vs admin-created.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { writeAuditLog, getIp } from '@/lib/auditLog'

/* ── Schemas ─────────────────────────────────────────────────────── */

const itemSchema = z.object({
  productId:        z.string().optional().nullable(),
  productName:      z.string().min(1, 'Product name required'),
  productSku:       z.string().optional().nullable(),
  isCustom:         z.boolean().default(false),

  // Size
  dimensionId:      z.string().optional().nullable(),
  variantName:      z.string().optional().nullable(),
  isCustomSize:     z.boolean().default(false),
  customWidth:      z.number().optional().nullable(),
  customHeight:     z.number().optional().nullable(),
  customDepth:      z.number().optional().nullable(),
  customDimensions: z.string().optional().nullable(),

  // Colour
  colorId:          z.string().optional().nullable(),
  customColorName:  z.string().optional().nullable(),
  customColorHex:   z.string().optional().nullable(),
  customColorRal:   z.string().optional().nullable(),

  // Texture
  textureId:        z.string().optional().nullable(),
  customTextureUrl: z.string().optional().nullable(),

  // Finish
  finishId:         z.string().optional().nullable(),
  customFinishDesc: z.string().optional().nullable(),

  // Other
  holesOption:      z.enum(['with_holes', 'without_holes']).optional().nullable(),
  quantity:         z.number().int().min(1).default(1),
  unitPrice:        z.number().optional().nullable(),
  notes:            z.string().optional().nullable(),
})

const vendorExisting = z.object({
  mode:            z.literal('existing'),
  vendorProfileId: z.string().min(1, 'Vendor required'),
})

const vendorNew = z.object({
  mode:        z.literal('new'),
  companyName: z.string().min(1, 'Company name required'),
  contactName: z.string().min(1, 'Contact name required'),
  email:       z.string().email('Valid email required'),
  phone:       z.string().optional().nullable(),
  city:        z.string().optional().nullable(),
  country:     z.string().optional().nullable(),
})

const bodySchema = z.object({
  vendor:          z.discriminatedUnion('mode', [vendorExisting, vendorNew]),
  projectName:     z.string().optional().nullable(),
  projectLocation: z.string().optional().nullable(),
  deliveryAddress: z.string().optional().nullable(),
  notes:           z.string().optional().nullable(),
  items:           z.array(itemSchema).min(1, 'At least one item is required'),
})

/* ── RFP number generator ────────────────────────────────────────── */
async function generateRfpNumber(): Promise<string> {
  const year   = new Date().getFullYear()
  const prefix = `RFP-${year}-`
  const last   = await prisma.rfp.findFirst({
    where:   { rfpNumber: { startsWith: prefix } },
    orderBy: { rfpNumber: 'desc' },
  })
  const seq = last ? parseInt(last.rfpNumber.split('-')[2] ?? '0') + 1 : 1
  return `${prefix}${String(seq).padStart(4, '0')}`
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'
  let p = ''
  for (let i = 0; i < 14; i++) p += chars[Math.floor(Math.random() * chars.length)]
  return p
}

/* ── POST ────────────────────────────────────────────────────────── */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  let payload: unknown
  try { payload = await req.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(payload)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.errors[0]?.message ?? 'Invalid input' }, { status: 400 })
  }

  const data = parsed.data

  try {
    /* ── Resolve vendor profile ────────────────────────────────── */
    let vendorProfileId: string

    if (data.vendor.mode === 'existing') {
      const exists = await prisma.vendorProfile.findUnique({
        where:  { id: data.vendor.vendorProfileId },
        select: { id: true },
      })
      if (!exists) {
        return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
      }
      vendorProfileId = exists.id
    } else {
      // New external vendor: find or create user + profile
      const email = data.vendor.email.toLowerCase().trim()

      const existingUser = await prisma.user.findUnique({
        where:   { email },
        include: { vendorProfile: true },
      })

      if (existingUser) {
        if (existingUser.vendorProfile) {
          vendorProfileId = existingUser.vendorProfile.id
        } else {
          const profile = await prisma.vendorProfile.create({
            data: {
              userId:      existingUser.id,
              companyName: data.vendor.companyName.trim(),
              city:        data.vendor.city?.trim()    || null,
              country:     data.vendor.country?.trim() || 'UAE',
              status:      'APPROVED',
              approvedAt:  new Date(),
              approvedBy:  session.user.id,
            },
          })
          vendorProfileId = profile.id
        }
      } else {
        // Create new user (no welcome email — admin can resend creds later)
        const tempPassword = generateTempPassword()
        const passwordHash = await bcrypt.hash(tempPassword, 12)

        const result = await prisma.$transaction(async tx => {
          const user = await tx.user.create({
            data: {
              email,
              passwordHash,
              name:        data.vendor.mode === 'new' ? data.vendor.contactName.trim() : '',
              phone:       data.vendor.mode === 'new' ? (data.vendor.phone?.trim() || null) : null,
              role:        'VENDOR',
              isActive:    true,
              permissions: '{}',
            },
          })
          const profile = await tx.vendorProfile.create({
            data: {
              userId:      user.id,
              companyName: data.vendor.mode === 'new' ? data.vendor.companyName.trim() : '',
              city:        data.vendor.mode === 'new' ? (data.vendor.city?.trim()    || null) : null,
              country:     data.vendor.mode === 'new' ? (data.vendor.country?.trim() || 'UAE') : 'UAE',
              status:      'APPROVED',
              approvedAt:  new Date(),
              approvedBy:  session.user.id,
            },
          })
          return profile
        })

        vendorProfileId = result.id
      }
    }

    /* ── Create RFP ────────────────────────────────────────────── */
    const rfpNumber = await generateRfpNumber()
    const now       = new Date()

    const rfp = await prisma.rfp.create({
      data: {
        rfpNumber,
        vendorProfileId,
        source:          'MANUAL',
        createdByUserId: session.user.id,
        projectName:     data.projectName     || null,
        projectLocation: data.projectLocation || null,
        deliveryAddress: data.deliveryAddress || null,
        notes:           data.notes           || null,
        status:          'SUBMITTED',
        submittedAt:     now,
        items: {
          create: data.items.map(it => ({
            productId:        it.productId   || null,
            productName:      it.productName,
            productSku:       it.productSku  || null,
            isCustom:         it.isCustom,
            // Size
            dimensionId:      it.dimensionId || null,
            variantName:      it.variantName || null,
            isCustomSize:     it.isCustomSize ?? false,
            customWidth:      it.customWidth  ?? null,
            customHeight:     it.customHeight ?? null,
            customDepth:      it.customDepth  ?? null,
            customDimensions: it.customDimensions || null,
            // Colour
            colorId:          it.colorId     || null,
            customColorName:  it.customColorName || null,
            customColorHex:   it.customColorHex  || null,
            customColorRal:   it.customColorRal  || null,
            // Texture
            textureId:        it.textureId   || null,
            customTextureUrl: it.customTextureUrl || null,
            // Finish
            finishId:         it.finishId    || null,
            customFinishDesc: it.customFinishDesc || null,
            // Other
            holesOption:      it.holesOption || null,
            quantity:         it.quantity,
            unitPrice:        it.unitPrice ?? null,
            notes:            it.notes ?? null,
          })),
        },
      },
      include: { vendorProfile: { include: { user: true } } },
    })

    /* ── Audit log ─────────────────────────────────────────────── */
    await writeAuditLog({
      userId:     session.user.id,
      action:     'RFP_CREATED_MANUALLY',
      entityType: 'RFP',
      entityId:   rfp.id,
      details:    {
        actorName:   session.user.name,
        actorRole:   session.user.role,
        rfpNumber:   rfp.rfpNumber,
        vendorName:  rfp.vendorProfile.companyName,
        vendorEmail: rfp.vendorProfile.user.email,
        itemCount:   data.items.length,
        source:      'MANUAL',
      },
      ipAddress: getIp(req),
    })

    return NextResponse.json(
      { success: true, data: { id: rfp.id, rfpNumber: rfp.rfpNumber } },
      { status: 201 }
    )
  } catch (err: any) {
    console.error('[POST /api/admin/rfp/manual]', err)
    return NextResponse.json({ error: err?.message ?? 'Internal server error' }, { status: 500 })
  }
}
