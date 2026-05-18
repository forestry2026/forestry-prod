import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// PATCH — admin updates status and/or adminNotes
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await params
    const body   = await req.json()

    const updated = await prisma.customDesignRequest.update({
      where: { id },
      data:  {
        ...(body.status     !== undefined && { status:     body.status }),
        ...(body.adminNotes !== undefined && { adminNotes: body.adminNotes }),
      },
    })

    return NextResponse.json(updated)
  } catch (e) {
    console.error('[custom-design PATCH]', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
