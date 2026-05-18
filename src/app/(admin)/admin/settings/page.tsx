import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { SettingsClient }   from '@/components/admin/SettingsClient'

export const metadata: Metadata = {
  title: 'Settings — Forestry Admin',
}

export default async function SettingsPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const adminUser = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!adminUser) redirect('/login')

  const now = new Date()
  const dateLabel = now.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })

  // Email settings — DB takes precedence over env vars
  const emailRows = await prisma.siteSetting.findMany({
    where: { key: { in: ['email_resend_api_key', 'email_from', 'admin_email'] } },
  })
  const emailDb = Object.fromEntries(emailRows.map(r => [r.key, r.value]))

  // Vercel injects these at build time on each deploy. Falls back to "dev" locally.
  const commitSha = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || 'dev'
  const branch    = process.env.VERCEL_GIT_COMMIT_REF || 'local'
  const deployedAt = new Date().toISOString() // captured at build / server-render time

  const systemInfo = {
    version:       `${commitSha} (${branch})`,
    deployedAt,
    environment:   process.env.NODE_ENV === 'production' ? 'Production' : 'Development',
    dbProvider:    'postgresql',
    emailFrom:     emailDb['email_from']    || process.env.EMAIL_FROM  || '',
    adminEmail:    emailDb['admin_email']   || process.env.ADMIN_EMAIL || '',
    appUrl:        process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    hasResendKey:  !!(emailDb['email_resend_api_key'] || process.env.RESEND_API_KEY),
    jwtMaxAgeDays: 30,
  }

  const user = {
    id:          adminUser.id,
    name:        adminUser.name,
    email:       adminUser.email,
    phone:       adminUser.phone ?? null,
    role:        adminUser.role,
    lastLoginAt: adminUser.lastLoginAt?.toISOString() ?? null,
    createdAt:   adminUser.createdAt.toISOString(),
  }

  return (
    <div className="space-y-6">

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terracotta mb-1">Admin Portal</p>
          <h1 className="font-heading text-4xl font-bold text-charcoal-900 tracking-tight">Settings</h1>
          <p className="text-sm text-charcoal-400 mt-1.5">{dateLabel}</p>
        </div>

        {/* Admin identity pill */}
        <div className="flex items-center gap-3 flex-shrink-0 mt-1 px-4 py-2.5 rounded-xl bg-white border border-[#E8E0D5]">
          <div className="w-8 h-8 rounded-lg bg-terracotta flex items-center justify-center flex-shrink-0">
            <span className="font-heading text-sm font-bold text-white">
              {adminUser.name.split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-bold text-charcoal-900 leading-none">{adminUser.name}</p>
            <p className="text-[11px] text-charcoal-400 mt-0.5">{adminUser.email}</p>
          </div>
        </div>
      </div>

      {/* ── Settings Panels ─────────────────────────────────────── */}
      <SettingsClient user={user} systemInfo={systemInfo} />

    </div>
  )
}
