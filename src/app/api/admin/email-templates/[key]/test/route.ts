import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import { getEmailConfig }             from '@/lib/emailConfig'
import { buildEmail }                 from '@/lib/emailTemplates/engine'
import { REGISTRY }                   from '@/lib/emailTemplates/types'
import type { TemplateKey }           from '@/lib/emailTemplates/types'

export const runtime = 'nodejs'

/**
 * POST /api/admin/email-templates/[key]/test
 * Fires a real send to the chosen recipient using example variable values.
 * Returns Resend's response so we can show the message id in the UI.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { key } = await params
  const meta = REGISTRY.find(m => m.key === key)
  if (!meta) return NextResponse.json({ error: 'Unknown template key' }, { status: 404 })

  let body: { to?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const to = (body.to ?? session.user.email ?? '').trim()
  if (!/.+@.+\..+/.test(to)) return NextResponse.json({ error: 'Valid email required' }, { status: 400 })

  // Build variable map from registry examples — every template gets populated.
  const vars: Record<string, string> = {}
  for (const v of meta.variables) vars[v.token.replace(/[{}]/g, '').trim()] = v.example

  try {
    const { resend, from } = await getEmailConfig()
    const { subject, html } = await buildEmail(key as TemplateKey, vars)
    const result = await resend.emails.send({
      from,
      to,
      subject: `[TEST] ${subject}`,
      html,
    })
    return NextResponse.json({ ok: true, to, messageId: (result as any)?.data?.id ?? (result as any)?.id ?? null })
  } catch (err: any) {
    console.error('[email-templates/test]', err)
    return NextResponse.json({ error: err?.message ?? 'Send failed' }, { status: 500 })
  }
}
