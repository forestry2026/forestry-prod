import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { unlink } from 'fs/promises'
import { join } from 'path'

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; fileId: string }> }
) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER'))
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, fileId } = await params
  const file = await prisma.productFile.findUnique({ where: { id: fileId } })
  if (!file || file.productId !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Delete physical file (ignore error if already gone)
  try {
    await unlink(join(process.cwd(), 'public', file.url))
  } catch {}

  await prisma.productFile.delete({ where: { id: fileId } })
  return NextResponse.json({ success: true })
}
