import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { uploadFileToCloudinary }    from '@/lib/cloudinary'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

  const url = await uploadFileToCloudinary(file, 'forestry/custom-design')

  return NextResponse.json({ url, name: file.name })
}
