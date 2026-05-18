import { Metadata }         from 'next'
import { getServerSession }  from 'next-auth'
import { redirect }          from 'next/navigation'
import { authOptions }       from '@/lib/auth'
import { prisma }            from '@/lib/prisma'
import { canAccess, canEdit, parsePermissions } from '@/lib/portal-permissions'
import { CreateManualRfpForm } from '@/components/admin/CreateManualRfpForm'

export const metadata: Metadata = { title: 'New RFP — Forestry Admin' }

export default async function NewManualRfpPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userRec   = await prisma.user.findUnique({ where: { id: session.user.id }, select: { permissions: true } })
  const userPerms = parsePermissions(userRec?.permissions)
  if (!canAccess(session.user.role, userPerms, 'rfps')) redirect('/admin')
  if (!canEdit(session.user.role, userPerms, 'rfps'))   redirect('/admin/rfps')

  // Fetch active products + all global attributes (for custom items)
  const [products, allColors, allTextures, allFinishes, allDimensions] = await Promise.all([
    prisma.product.findMany({
      where:  { isActive: true },
      select: {
        id: true, sku: true, name: true, specifications: true,
        images:     { where: { isPrimary: true }, take: 1, select: { url: true } },
        colors:     { include: { color:     { select: { id: true, name: true, hexCode: true } } } },
        textures:   { include: { texture:   { select: { id: true, name: true, imageUrl: true } } } },
        finishes:   { include: { finish:    { select: { id: true, name: true } } } },
        dimensions: { include: { dimension: { select: { id: true, name: true } } } },
      },
      orderBy: { name: 'asc' },
    }),
    prisma.color.findMany({     select: { id: true, name: true, hexCode: true },  orderBy: { name: 'asc' } }),
    prisma.texture.findMany({   select: { id: true, name: true, imageUrl: true }, orderBy: { name: 'asc' } }),
    prisma.finish.findMany({    select: { id: true, name: true },                 orderBy: { name: 'asc' } }),
    prisma.dimension.findMany({ select: { id: true, name: true },                 orderBy: { sortOrder: 'asc' } }),
  ])

  const slimProducts = products.map(p => ({
    id:             p.id,
    sku:            p.sku,
    name:           p.name,
    imageUrl:       p.images[0]?.url ?? null,
    specifications: p.specifications ?? null,
    colors:         p.colors.map(c => c.color),
    textures:       p.textures.map(t => t.texture),
    finishes:       p.finishes.map(f => f.finish),
    dimensions:     p.dimensions.map(d => d.dimension),
  }))

  const globalAttrs = {
    colors:     allColors,
    textures:   allTextures,
    finishes:   allFinishes,
    dimensions: allDimensions,
  }

  return <CreateManualRfpForm products={slimProducts} globalAttrs={globalAttrs} />
}
