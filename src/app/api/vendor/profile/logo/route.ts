export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

const ALLOWED  = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const vendorProfileId = session.user.vendorProfileId
    if (!vendorProfileId) return NextResponse.json({ error: 'No vendor profile' }, { status: 400 })

    let formData: FormData
    try {
      formData = await req.formData()
    } catch {
      return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!ALLOWED.includes(file.type))  return NextResponse.json({ error: 'Only PNG, JPG, WebP, SVG allowed' }, { status: 400 })
    if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 })

    // Stable publicId per vendor — Cloudinary overwrites prior logo automatically.
    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToCloudinary(buffer, {
      folder:       'forestry/vendor-logos',
      publicId:     vendorProfileId,
      resourceType: file.type === 'image/svg+xml' ? 'raw' : 'image',
    })
    const logoUrl = result.secure_url

    await prisma.vendorProfile.update({
      where: { id: vendorProfileId },
      data:  { logoUrl },
    })

    return NextResponse.json({ success: true, logoUrl })
  } catch (err: any) {
    console.error('[logo POST]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'VENDOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const vendorProfileId = session.user.vendorProfileId
    if (!vendorProfileId) return NextResponse.json({ error: 'No vendor profile' }, { status: 400 })

    const existing = await prisma.vendorProfile.findUnique({
      where:  { id: vendorProfileId },
      select: { logoUrl: true },
    })
    if (existing?.logoUrl) await deleteFromCloudinary(existing.logoUrl)

    await prisma.vendorProfile.update({
      where: { id: vendorProfileId },
      data:  { logoUrl: null },
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[logo DELETE]', err)
    return NextResponse.json({ error: err?.message ?? 'Server error' }, { status: 500 })
  }
}
