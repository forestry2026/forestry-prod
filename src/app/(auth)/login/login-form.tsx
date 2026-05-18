'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react'
import { ForestryLogo } from '@/components/ui/ForestryLogo'
import { LoadingSpinner } from '@/components/ui/LoadingSpinner'
import { useSiteLogo } from '@/hooks/useSiteLogo'

interface Slide {
  id:       string
  imageUrl: string
  headline: string
  subtext:  string | null
}

interface Props { slide: Slide | null }

const schema = z.object({
  email:    z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})
type FormData = z.infer<typeof schema>

/* ── Fallback visual (no slides configured) ──────────────────── */
function FallbackVisual({ logoUrl }: { logoUrl: string | null }) {
  return (
    <div className="absolute inset-0 bg-charcoal flex flex-col items-center justify-center p-16">
      <div className="absolute inset-0 bg-dot-grid opacity-40" aria-hidden />
      <div className="relative z-10 flex flex-col items-center text-center">
        <div className="flex items-center gap-3 mb-16">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="h-9 max-w-[160px] object-contain brightness-0 invert" />
            : <>
                <ForestryLogo className="w-8 h-8 text-terracotta" />
                <span className="font-heading text-xl font-bold tracking-widest text-cream">FORESTRY</span>
              </>
          }
        </div>
        <div className="relative w-64 h-64 mb-12 animate-float" aria-hidden>
          <div className="absolute top-12 left-4">
            <div className="relative">
              <div className="absolute -top-2 -left-1.5 -right-1.5 h-3.5 bg-[#4A5657] rounded-sm" />
              <div className="w-20 h-20 bg-gradient-to-br from-[#5E6B6C] to-[#2D3436] rounded-b-xl" />
            </div>
          </div>
          <div className="absolute top-16 right-4" style={{ clipPath: 'polygon(14% 0%, 86% 0%, 100% 100%, 0% 100%)' }}>
            <div className="w-20 h-24 bg-gradient-to-br from-[#D4A574] to-[#9A6E40]" />
          </div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="relative w-28 h-36">
              <div className="absolute -top-2.5 -left-2 -right-2 h-5 bg-gradient-to-r from-[#C4683A] to-[#B35C2A] rounded-sm" />
              <div className="h-full bg-gradient-to-br from-[#C4683A] via-[#B35C2A] to-[#8B4520] rounded-b-2xl shadow-xl" />
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 w-10 h-16 bg-gradient-to-b from-[#4A7A3D] to-[#3D6533] rounded-t-full rounded-b-sm" />
            </div>
          </div>
        </div>
        <blockquote className="font-heading text-lg italic text-cream/65 leading-relaxed max-w-xs">
          <span className="block text-5xl text-terracotta leading-none mb-3">"</span>
          Every great space begins with a single, perfectly crafted piece.
        </blockquote>
      </div>
    </div>
  )
}

/* ── Slide visual ────────────────────────────────────────────── */
function SlideVisual({ slide, logoUrl }: { slide: Slide; logoUrl: string | null }) {
  return (
    <div className="absolute inset-0">
      {/* Full-bleed image */}
      <img
        src={slide.imageUrl}
        alt={slide.headline}
        className="w-full h-full object-cover"
      />

      {/* Dark gradient overlay — heavier at bottom for text legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/90 via-charcoal-900/30 to-charcoal-900/20" />

      {/* Top logo bar */}
      <Link href="/" className="absolute top-0 left-0 right-0 flex items-center gap-3 px-8 pt-8 w-fit">
        {logoUrl
          ? <img src={logoUrl} alt="Logo" className="h-8 max-w-[140px] object-contain brightness-0 invert" />
          : <>
              <div className="w-8 h-8 bg-terracotta rounded-lg flex items-center justify-center">
                <ForestryLogo className="w-5 h-5 text-white" />
              </div>
              <span className="font-heading text-base font-bold tracking-[0.2em] text-white">FORESTRY</span>
            </>
        }
      </Link>

      {/* Bottom text block */}
      <div className="absolute bottom-0 left-0 right-0 px-8 pb-10">
        {/* Decorative rule */}
        <div className="w-10 h-0.5 bg-terracotta mb-5" />

        <h2 className="font-heading font-bold text-white text-[42px] leading-[1.1] mb-4 max-w-[340px]">
          {slide.headline}
        </h2>

        {slide.subtext && (
          <p className="text-white/75 text-[15px] leading-relaxed max-w-[320px]">
            {slide.subtext}
          </p>
        )}
      </div>
    </div>
  )
}

/* ── Main ────────────────────────────────────────────────────── */
export default function LoginForm({ slide }: Props) {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') || ''
  const errorParam   = searchParams.get('error')
  const logoUrl      = useSiteLogo()

  const [loading,      setLoading]      = useState(false)
  const [showPw,       setShowPw]       = useState(false)
  const [hasLoggedIn,  setHasLoggedIn]  = useState(false)
  const [authError,    setAuthError]    = useState<string | null>(
    errorParam === 'unauthorized' ? 'You are not authorized to access that page.' : null
  )

  // Check localStorage on mount — flag set after first successful login
  useEffect(() => {
    setHasLoggedIn(!!localStorage.getItem('fry_has_logged_in'))
  }, [])

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    setLoading(true)
    setAuthError(null)

    const result = await signIn('credentials', {
      email:    data.email.toLowerCase().trim(),
      password: data.password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setAuthError('Invalid email or password. Please try again.')
      return
    }

    // Mark as returning user for future visits
    localStorage.setItem('fry_has_logged_in', '1')

    if (callbackUrl && !callbackUrl.includes('/login')) {
      router.push(callbackUrl)
    } else {
      router.push('/portal')
    }
  }

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-[1fr_480px]">

      {/* ── LEFT: Visual panel ─────────────────────────────────── */}
      <div className="hidden lg:block relative overflow-hidden">
        {slide ? <SlideVisual slide={slide} logoUrl={logoUrl} /> : <FallbackVisual logoUrl={logoUrl} />}
      </div>

      {/* ── RIGHT: Form panel ──────────────────────────────────── */}
      <div className="flex items-center justify-center bg-cream px-8 py-16 lg:px-12 relative">

        {/* Mobile logo */}
        <div className="absolute top-8 left-8 flex items-center gap-2 lg:hidden">
          {logoUrl
            ? <img src={logoUrl} alt="Logo" className="h-8 max-w-[120px] object-contain" />
            : <>
                <ForestryLogo className="w-7 h-7 text-terracotta" />
                <span className="font-heading text-lg font-bold tracking-widest">FORESTRY</span>
              </>
          }
        </div>

        <div className="w-full max-w-sm">

          {/* Heading */}
          <div className="mb-8">
            <h1 className="font-heading text-[28px] font-bold text-charcoal-900 leading-tight mb-2">
              {hasLoggedIn ? 'Welcome back' : 'Welcome to Forestry'}
            </h1>
            <p className="text-[14px] text-charcoal-400">
              {hasLoggedIn
                ? 'Sign in to your Forestry vendor portal.'
                : 'Sign in to get started with your vendor portal.'}
            </p>
          </div>

          {/* Error */}
          {authError && (
            <div role="alert" className="mb-5 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {authError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            <div>
              <label htmlFor="email" className="form-label">Email Address</label>
              <input
                id="email"
                type="email"
                className="form-input"
                placeholder="ahmed@company.ae"
                autoComplete="email"
                {...register('email')}
              />
              {errors.email && <p className="form-error">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="form-label mb-0">Password</label>
                <button
                  type="button"
                  className="text-xs text-terracotta font-medium hover:underline"
                  onClick={() => {/* TODO: forgot password */}}
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  className="form-input pr-11"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  {...register('password')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-charcoal-400 hover:text-charcoal-700 transition-colors p-0.5"
                  aria-label={showPw ? 'Hide password' : 'Show password'}
                >
                  {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && <p className="form-error">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center py-3 text-base disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading
                ? <><LoadingSpinner size={18} /> Signing in…</>
                : <><LogIn size={16} aria-hidden /> Sign In</>
              }
            </button>
          </form>

          {/* Footer links */}
          <div className="mt-8 text-center space-y-2 text-sm text-charcoal-400">
            <p>
              Don't have an account?{' '}
              <Link href="/request-access" className="text-terracotta font-semibold hover:underline">
                Request vendor access
              </Link>
            </p>
            <p className="text-xs">
              Admin staff?{' '}
              <Link href="/login" className="text-charcoal font-medium hover:underline">
                Use the same login →
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
