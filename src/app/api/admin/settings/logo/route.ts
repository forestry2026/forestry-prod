export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'
import { clearLogoCache } from '@/lib/emailTemplates/engine'

const ALLOWED  = ['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml']
const MAX_SIZE = 2 * 1024 * 1024 // 2 MB

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json({ error: 'Only PNG, JPG, WebP, SVG allowed' }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 })
  }

  // Stable publicId so re-upload overwrites existing logo on Cloudinary.
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await uploadToCloudinary(buffer, {
    folder:        'forestry/site-logo',
    publicId:      'site-logo',
    resourceType:  file.type === 'image/svg+xml' ? 'raw' : 'image',
  })
  const logoUrl = result.secure_url

  await prisma.siteSetting.upsert({
    where:  { key: 'logoUrl' },
    update: { value: logoUrl },
    create: { key: 'logoUrl', value: logoUrl },
  })
  clearLogoCache()

  return NextResponse.json({ success: true, logoUrl })
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })
  if (existing?.value) await deleteFromCloudinary(existing.value)

  await prisma.siteSetting.deleteMany({ where: { key: 'logoUrl' } })
  clearLogoCache()

  return NextResponse.json({ success: true })
}
