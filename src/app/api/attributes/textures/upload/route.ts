import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { uploadToCloudinary, uploadFileToCloudinary } from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const croppedImageBase64 = formData.get('croppedImage') as string

    if (!file && !croppedImageBase64) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    let imageUrl: string

    if (croppedImageBase64) {
      // Base64 PNG from client-side crop tool
      const base64Data = croppedImageBase64.replace(/^data:image\/\w+;base64,/, '')
      const buffer = Buffer.from(base64Data, 'base64')
      const result = await uploadToCloudinary(buffer, {
        folder:       'forestry/textures',
        resourceType: 'image',
      })
      imageUrl = result.secure_url
    } else {
      imageUrl = await uploadFileToCloudinary(file, 'forestry/textures')
    }

    return NextResponse.json({ success: true, imageUrl }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload image' },
      { status: 500 }
    )
  }
}
