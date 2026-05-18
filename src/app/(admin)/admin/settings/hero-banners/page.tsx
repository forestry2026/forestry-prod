import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import HeroBannersClient from './hero-banners-client'

export const metadata = { title: 'Hero Banners — Admin' }

export default async function HeroBannersPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/admin')
  }

  const banners = await prisma.heroBanner.findMany({ orderBy: { sortOrder: 'asc' } })

  return <HeroBannersClient initialBanners={banners} />
}
