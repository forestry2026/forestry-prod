import { Metadata }         from 'next'
import { getServerSession }  from 'next-auth'
import { redirect, notFound } from 'next/navigation'
import { authOptions }        from '@/lib/auth'
import { prisma }             from '@/lib/prisma'
import { UserDetailClient }   from './UserDetailClient'

export const metadata: Metadata = { title: 'User Detail — Forestry Admin' }

export default async function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const { id } = await params

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true, name: true, email: true, role: true, isActive: true,
      lastLoginAt: true, createdAt: true, phone: true, permissions: true, avatarUrl: true,
    },
  })
  if (!user) notFound()

  // Quick stats: counts of activities by category in last 30 days
  const since = new Date(Date.now() - 30 * 86400_000)
  const [total30d, total7d, lastEvent] = await Promise.all([
    prisma.auditLog.count({ where: { userId: id, createdAt: { gte: since } } }),
    prisma.auditLog.count({ where: { userId: id, createdAt: { gte: new Date(Date.now() - 7 * 86400_000) } } }),
    prisma.auditLog.findFirst({ where: { userId: id }, orderBy: { createdAt: 'desc' }, select: { createdAt: true, action: true } }),
  ])

  return (
    <UserDetailClient
      user={{
        id:          user.id,
        name:        user.name ?? '(no name)',
        email:       user.email ?? '',
        role:        user.role,
        isActive:    user.isActive,
        phone:       user.phone ?? null,
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
        createdAt:   user.createdAt.toISOString(),
        avatarUrl:   user.avatarUrl ?? null,
      }}
      stats={{
        total30d,
        total7d,
        lastActionAt: lastEvent?.createdAt.toISOString() ?? null,
        lastAction:   lastEvent?.action ?? null,
      }}
    />
  )
}
