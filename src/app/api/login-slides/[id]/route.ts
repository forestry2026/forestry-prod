import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const updateSchema = z.object({
  imageUrl:  z.string().min(1).optional(),
  headline:  z.string().min(1).optional(),
  subtext:   z.string().nullable().optional(),
  isActive:  z.boolean().optional(),
  sortOrder: z.number().optional(),
})

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) return null
  return session
}

// PATCH
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    const body   = await req.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
    const slide = await prisma.loginSlide.update({ where: { id }, data: parsed.data })
    return NextResponse.json({ success: true, data: slide })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}

// DELETE
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { id } = await params
  try {
    await prisma.loginSlide.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Failed' }, { status: 500 })
  }
}
