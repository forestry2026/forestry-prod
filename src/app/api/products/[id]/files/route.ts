import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }          from 'next-auth'
import { authOptions }               from '@/lib/auth'
import { prisma }                    from '@/lib/prisma'
import { uploadFileToCloudinary }    from '@/lib/cloudinary'

export const runtime = 'nodejs'

// GET — list files for a product
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const files = await prisma.productFile.findMany({ where: { productId: id }, orderBy: { createdAt: 'asc' } })
  return NextResponse.json({ data: files })
}

// POST — upload a file
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const formData = await req.formData()
  const file = formData.get('file') as File
  const type = formData.get('type') as string // 'specification' | 'dwg' | 'png'

  if (!file || !type) return NextResponse.json({ error: 'Missing file or type' }, { status: 400 })

  const url = await uploadFileToCloudinary(file, `forestry/product-files/${id}`)

  const record = await prisma.productFile.create({
    data: { productId: id, type, name: file.name, url, size: file.size }
  })
  return NextResponse.json({ data: record }, { status: 201 })
}
