import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { uploadToCloudinary, deleteFromCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'

const ALLOWED   = new Set(['image/png', 'image/jpeg', 'image/webp'])
const MAX_BYTES = 2 * 1024 * 1024

/* POST — upload own avatar */
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const fd   = await req.formData()
    const file = fd.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
    if (!ALLOWED.has(file.type)) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
    if (file.size > MAX_BYTES) return NextResponse.json({ error: 'File too large (max 2 MB)' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const result = await uploadToCloudinary(buffer, {
      folder:   'forestry/avatars',
      publicId: session.user.id, // stable id → overwrites prior avatar
    })
    const avatarUrl = result.secure_url

    await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl } })

    return NextResponse.json({ avatarUrl })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Upload failed' }, { status: 500 })
  }
}

/* DELETE — remove own avatar */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { avatarUrl: true } })
    if (user?.avatarUrl) await deleteFromCloudinary(user.avatarUrl)
    await prisma.user.update({ where: { id: session.user.id }, data: { avatarUrl: null } })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? 'Remove failed' }, { status: 500 })
  }
}
