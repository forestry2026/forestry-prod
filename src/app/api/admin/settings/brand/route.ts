import { NextRequest, NextResponse } from 'next/server'
import { prisma }                    from '@/lib/prisma'

export async function GET() {
  const setting = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })
  return NextResponse.json({ logoUrl: setting?.value ?? null })
}
