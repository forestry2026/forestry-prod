import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import LoginSlidesClient from './login-slides-client'

export const metadata = { title: 'Login Slides — Admin' }

export default async function LoginSlidesPage() {
  const session = await getServerSession(authOptions)
  if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
    redirect('/admin')
  }

  const slides = await prisma.loginSlide.findMany({ orderBy: { sortOrder: 'asc' } })

  return <LoginSlidesClient initialSlides={slides} />
}
