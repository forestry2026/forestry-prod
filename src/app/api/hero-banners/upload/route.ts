import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { uploadFileToCloudinary }    from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

    const imageUrl = await uploadFileToCloudinary(file, 'forestry/hero-banners')

    return NextResponse.json({ success: true, imageUrl }, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Upload failed' }, { status: 500 })
  }
}
