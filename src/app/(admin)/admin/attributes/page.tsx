import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { parsePermissions, canAccess, canEdit } from '@/lib/portal-permissions'
import AttributesClient     from './AttributesClient'

export default async function AttributesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const userRec   = await prisma.user.findUnique({ where: { id: session.user.id }, select: { permissions: true } })
  const userPerms = parsePermissions(userRec?.permissions)
  if (!canAccess(session.user.role, userPerms, 'attributes')) redirect('/admin')
  const readonly  = !canEdit(session.user.role, userPerms, 'attributes')

  return <AttributesClient readonly={readonly} />
}
