import { NextRequest, NextResponse } from 'next/server'
import { uploadFileToCloudinary }    from '@/lib/cloudinary'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']
const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// POST /api/upload — public (used by request-access form)
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
    }

    const url = await uploadFileToCloudinary(file, 'forestry/access-requests')
    return NextResponse.json({ path: url })
  } catch (error: any) {
    console.error('[upload POST]', error)
    return NextResponse.json({ error: error?.message ?? 'Upload failed' }, { status: 500 })
  }
}
