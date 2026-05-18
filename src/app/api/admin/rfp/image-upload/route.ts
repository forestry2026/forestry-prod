import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { uploadFileToCloudinary }    from '@/lib/cloudinary'

export const runtime = 'nodejs'

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const MAX_MB  = 8

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const fd   = await req.formData()
    const file = fd.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    if (!ALLOWED.includes(file.type))
      return NextResponse.json({ error: 'Only JPEG, PNG, WEBP or GIF allowed' }, { status: 400 })
    if (file.size > MAX_MB * 1024 * 1024)
      return NextResponse.json({ error: `File too large (max ${MAX_MB} MB)` }, { status: 400 })

    const imageUrl = await uploadFileToCloudinary(file, 'forestry/rfp-items')

    return NextResponse.json({ success: true, imageUrl }, { status: 201 })
  } catch (err: any) {
    console.error('[POST /api/admin/rfp/image-upload]', err)
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 })
  }
}
