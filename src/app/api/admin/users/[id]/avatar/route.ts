import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'

const ALLOWED   = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_BYTES = 2 * 1024 * 1024

/* POST — admin uploads avatar for a specific user */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params
    const fd   = await req.formData()
    const file = fd.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToCloudinary(buffer, {
      folder:   'forestry/avatars',
      publicId: userId,
    })
    const avatarUrl = result.secure_url

    await prisma.user.update({ where: { id: userId }, data: { avatarUrl } })

    return NextResponse.json({ avatarUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Upload failed' }, { status: 500 })
  }
}

/* DELETE — admin removes avatar for a specific user */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id: userId } = await params
    const user = await prisma.user.findUnique({ where: { id: userId }, select: { avatarUrl: true } })
    if (user?.avatarUrl) await deleteFromCloudinary(user.avatarUrl)

    await prisma.user.update({ where: { id: userId }, data: { avatarUrl: null } })
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Remove failed' }, { status: 500 })
  }
}
