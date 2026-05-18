import { Metadata }         from 'next'
import { getServerSession }  from 'next-auth'
import { redirect }          from 'next/navigation'
import { authOptions }       from '@/lib/auth'
import { prisma }            from '@/lib/prisma'
import { ProfileClient }     from './ProfileClient'

export const metadata: Metadata = { title: 'My Profile — Forestry Admin' }

export default async function ProfilePage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where:  { id: session.user.id },
    select: {
      id: true, name: true, email: true, role: true,
      phone: true, avatarUrl: true, createdAt: true, lastLoginAt: true,
    },
  })
  if (!user) redirect('/login')

  return (
    <ProfileClient
      user={{
        id:          user.id,
        name:        user.name ?? '',
        email:       user.email ?? '',
        role:        user.role,
        phone:       user.phone ?? null,
        avatarUrl:   user.avatarUrl ?? null,
        createdAt:   user.createdAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
      }}
    />
  )
}
