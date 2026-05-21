import { NextRequest, NextResponse } from 'next/server'
import { getServerSession }           from 'next-auth'
import { authOptions }                from '@/lib/auth'
import { prisma }                     from '@/lib/prisma'
import { REGISTRY }                   from '@/lib/emailTemplates/types'
import { DEFAULTS }                   from '@/lib/emailTemplates/defaults'
import { renderTemplate, clearTemplateCache, buildEmail } from '@/lib/emailTemplates/engine'
import { brandHeaderHtml }            from '@/lib/emailTemplates/layout'
import { getEmailConfig }             from '@/lib/emailConfig'
import type { TemplateKey }           from '@/lib/emailTemplates/types'

export const runtime = 'nodejs'

async function guard() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') return null
  return session
}

function validKey(key: string): key is TemplateKey {
  return REGISTRY.some(m => m.key === key)
}

/* GET — single template with current state. */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await params
  if (!validKey(key)) return NextResponse.json({ error: 'Unknown template key' }, { status: 404 })

  const row = await prisma.emailTemplate.findUnique({ where: { key } })
  const meta = REGISTRY.find(m => m.key === key)!
  const def  = DEFAULTS[key]

  return NextResponse.json({
    ...meta,
    isCustom:  Boolean(row),
    subject:   row?.subject ?? def.subject,
    html:      row?.html    ?? def.html,
    default:   def,
    updatedAt: row?.updatedAt ?? null,
  })
}

/* PUT — save admin override. */
export async function PUT(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  const session = await guard()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await params
  if (!validKey(key)) return NextResponse.json({ error: 'Unknown template key' }, { status: 404 })

  const body = await req.json()
  const subject = (body.subject ?? '').toString().trim()
  const html    = (body.html    ?? '').toString().trim()
  if (!subject || !html) return NextResponse.json({ error: 'Subject and HTML required' }, { status: 400 })

  const row = await prisma.emailTemplate.upsert({
    where:  { key },
    update: { subject, html, updatedBy: session.user.id },
    create: { key, subject, html, updatedBy: session.user.id },
  })
  clearTemplateCache(key as TemplateKey)
  return NextResponse.json({ ok: true, updatedAt: row.updatedAt })
}

/* DELETE — revert to file default by removing DB override. */
export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await params
  if (!validKey(key)) return NextResponse.json({ error: 'Unknown template key' }, { status: 404 })

  await prisma.emailTemplate.deleteMany({ where: { key } })
  clearTemplateCache(key as TemplateKey)
  return NextResponse.json({ ok: true })
}

/* POST — preview rendered output with example variables, no save. */
export async function POST(req: NextRequest, { params }: { params: Promise<{ key: string }> }) {
  if (!await guard()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { key } = await params
  if (!validKey(key)) return NextResponse.json({ error: 'Unknown template key' }, { status: 404 })

  const body = await req.json()
  const subject = (body.subject ?? '').toString()
  const html    = (body.html    ?? '').toString()
  const meta = REGISTRY.find(m => m.key === key)!
  const vars: Record<string, string> = {}
  for (const v of meta.variables) vars[v.token.replace(/[{}]/g, '').trim()] = v.example

  const rendered = renderTemplate({ subject, html }, vars)
  // Inject the live brand logo so preview matches what recipients will see.
  const logo = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })
  rendered.html = rendered.html.replace(/<!--BRAND_HEADER-->/g, brandHeaderHtml(logo?.value ?? null))
  return NextResponse.json(rendered)
}
