import { NextResponse }     from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { REGISTRY }         from '@/lib/emailTemplates/types'
import { DEFAULTS }         from '@/lib/emailTemplates/defaults'

export const runtime = 'nodejs'

/* GET — list every template + current state (DB override or default). */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.emailTemplate.findMany()
  const byKey = new Map(rows.map(r => [r.key, r]))

  const list = REGISTRY.map(meta => {
    const row = byKey.get(meta.key)
    const def = DEFAULTS[meta.key]
    return {
      ...meta,
      isCustom:  Boolean(row),
      subject:   row?.subject ?? def.subject,
      html:      row?.html    ?? def.html,
      updatedAt: row?.updatedAt ?? null,
    }
  })

  return NextResponse.json({ templates: list })
}
