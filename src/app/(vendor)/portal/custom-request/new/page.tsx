import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'
import { ArrowLeft, Wand2 } from 'lucide-react'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { CustomRequestForm } from '../CustomRequestForm'

export const dynamic = 'force-dynamic'

export default async function NewCustomRequestPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const vendor = await prisma.vendorProfile.findUnique({ where: { userId: session.user.id } })
  if (!vendor) redirect('/portal')

  // Fetch catalog options
  const [colors, textures, finishes] = await Promise.all([
    prisma.color.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.texture.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
    prisma.finish.findMany({ where: { isActive: true }, orderBy: { sortOrder: 'asc' } }),
  ])

  return (
    <div className="space-y-7">

      {/* Header row */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/custom-request"
            className="inline-flex items-center gap-1.5 text-charcoal-400 hover:text-terracotta text-sm font-medium transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
            All Requests
          </Link>
          <span className="text-charcoal-200">/</span>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-terracotta/10 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-terracotta" />
            </div>
            <div>
              <h1 className="font-heading text-xl font-bold text-charcoal-900 leading-tight">Custom Design Request</h1>
              <p className="text-xs text-charcoal-400">Describe your vision — we&apos;ll handle the rest.</p>
            </div>
          </div>
        </div>
      </div>

      <CustomRequestForm
        colors={colors.map(c => ({ id: c.id, name: c.name, hexCode: c.hexCode }))}
        textures={textures.map(t => ({ id: t.id, name: t.name, imageUrl: t.imageUrl }))}
        finishes={finishes.map(f => ({ id: f.id, name: f.name }))}
      />
    </div>
  )
}
