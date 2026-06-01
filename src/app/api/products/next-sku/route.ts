import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { generateProductSku } from '@/lib/product-sku'

/**
 * GET /api/products/next-sku
 *
 * Returns the next proposed SKU for the product create form. Admin can
 * accept or override before saving. Format: DD + sequence + YY.
 */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const sku = await generateProductSku()
    return NextResponse.json({ sku })
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to allocate SKU' },
      { status: 500 },
    )
  }
}
