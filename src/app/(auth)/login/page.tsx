import { Suspense } from 'react'
import { PrismaClient } from '@prisma/client'
import LoginForm from './login-form'

export const dynamic = 'force-dynamic'

export default async function LoginPage() {
  // Fresh client — bypasses stale global singleton
  const db = new PrismaClient()
  let slide = null
  try {
    const slides = await db.loginSlide.findMany({
      where:   { isActive: true },
      orderBy: { sortOrder: 'asc' },
    })
    if (slides.length > 0) slide = slides[Math.floor(Math.random() * slides.length)]
  } catch (e) {
    console.error('[login-slides]', e)
  } finally {
    await db.$disconnect()
  }

  return (
    <Suspense>
      <LoginForm slide={slide} />
    </Suspense>
  )
}
