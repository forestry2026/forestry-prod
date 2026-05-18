import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  productId:   z.string(),
  productSku:  z.string(),
  productName: z.string(),
  name:        z.string().min(1),
  email:       z.string().email(),
  phone:       z.string().optional(),
  company:     z.string().optional(),
  dimensions:  z.string(), // JSON string
  quantity:    z.number().int().min(1).default(1),
  notes:       z.string().optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body   = await req.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid input', details: parsed.error.flatten() }, { status: 400 })
    }

    const enquiry = await prisma.customSizeEnquiry.create({ data: parsed.data })
    return NextResponse.json({ success: true, data: enquiry }, { status: 201 })
  } catch (err) {
    console.error('Custom size enquiry error:', err)
    return NextResponse.json({ error: 'Failed to submit enquiry' }, { status: 500 })
  }
}
