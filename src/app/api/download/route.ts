import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/download?url=<cloudinary_url>&name=document.pdf
// Proxies a Cloudinary file and forces Content-Disposition: attachment
// so the browser downloads it with the correct filename.
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const fileUrl = searchParams.get('url')
  const name    = searchParams.get('name') ?? 'document'

  if (!fileUrl) return NextResponse.json({ error: 'Missing url' }, { status: 400 })

  // Only allow proxying Cloudinary URLs
  try {
    const host = new URL(fileUrl).hostname
    if (!host.endsWith('cloudinary.com')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } catch {
    return NextResponse.json({ error: 'Invalid url' }, { status: 400 })
  }

  const upstream = await fetch(fileUrl)
  if (!upstream.ok) {
    return NextResponse.json({ error: `Upstream ${upstream.status}` }, { status: 502 })
  }

  const ct  = upstream.headers.get('content-type') ?? 'application/octet-stream'
  const buf = await upstream.arrayBuffer()

  return new NextResponse(buf, {
    headers: {
      'Content-Type':        ct,
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control':       'private, max-age=3600',
    },
  })
}
