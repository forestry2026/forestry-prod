import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { CustomDesignAdmin } from './CustomDesignAdmin'

export const metadata: Metadata = { title: 'Custom Design — Forestry Admin' }
export const dynamic = 'force-dynamic'

export default async function AdminCustomDesignDetailPage({
  params,
}: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const req = await prisma.customDesignRequest.findUnique({
    where: { id },
    include: {
      vendorProfile: {
        select: {
          companyName: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  })
  if (!req) notFound()

  // Resolve catalog selections
  const [color, texture, finish] = await Promise.all([
    req.colorId   ? prisma.color.findUnique({ where: { id: req.colorId } })     : null,
    req.textureId ? prisma.texture.findUnique({ where: { id: req.textureId } }) : null,
    req.finishId  ? prisma.finish.findUnique({ where: { id: req.finishId } })   : null,
  ])

  const data = {
    id:               req.id,
    title:            req.title,
    description:      req.description,
    quantity:         req.quantity,
    status:           req.status,
    adminNotes:       req.adminNotes,
    holesOption:      req.holesOption,
    notes:            req.notes,
    customColorHex:   req.customColorHex,
    customColorName:  req.customColorName,
    customColorRal:   req.customColorRal,
    customTexture:    req.customTexture,
    customTextureUrl: req.customTextureUrl,
    dimensions:       JSON.parse(req.dimensions      || '[]'),
    referenceImages:  JSON.parse(req.referenceImages || '[]'),
    createdAt:        req.createdAt.toISOString(),
    vendorProfile: {
      companyName: req.vendorProfile.companyName,
      user: { name: req.vendorProfile.user.name, email: req.vendorProfile.user.email },
    },
    color:   color   ? { name: color.name,   hexCode: color.hexCode }      : null,
    texture: texture ? { name: texture.name, imageUrl: texture.imageUrl }  : null,
    finish:  finish  ? { name: finish.name }                               : null,
  }

  return <CustomDesignAdmin data={data} />
}
