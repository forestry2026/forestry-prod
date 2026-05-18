import { Metadata }        from 'next'
import { getServerSession } from 'next-auth'
import { redirect }         from 'next/navigation'
import { authOptions }      from '@/lib/auth'
import { prisma }           from '@/lib/prisma'
import { UsersListClient }  from './UsersListClient'

export const metadata: Metadata = { title: 'Users — Forestry Admin' }

export default async function UsersPage() {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'ADMIN') redirect('/login')

  const users = await prisma.user.findMany({
    where:   { role: { not: 'VENDOR' } },
    orderBy: { createdAt: 'desc' },
  })

  // Role counts for tab badges (excludes VENDOR)
  const roleCounts: Record<string, number> = {}
  for (const user of users) {
    roleCounts[user.role] = (roleCounts[user.role] ?? 0) + 1
  }

  const serialised = users.map(u => ({
    id:          u.id,
    name:        u.name ?? '(no name)',
    email:       u.email ?? '',
    role:        u.role,
    isActive:    u.isActive,
    lastLoginAt: u.lastLoginAt?.toISOString() ?? null,
    createdAt:   u.createdAt.toISOString(),
    phone:       u.phone ?? null,
    permissions: u.permissions ?? '{}',
  }))

  return (
    <UsersListClient
      users={serialised}
      roleCounts={roleCounts}
      currentUserId={session.user.id}
    />
  )
}
