import type { Metadata } from 'next'
import { Zilla_Slab, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

// Force every route to render at request time. Pages depend on session + DB,
// so static prerender would either crash or serve stale data.
export const dynamic = 'force-dynamic'

const zillaSlab = Zilla_Slab({
  subsets:  ['latin'],
  weight:   ['400', '500', '600', '700'],
  style:    ['normal', 'italic'],
  variable: '--font-zilla-slab',
  display:  'swap',
})

const dmSans = DM_Sans({
  subsets:  ['latin'],
  weight:   ['300', '400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display:  'swap',
})

export const metadata: Metadata = {
  title: {
    default:  'Forestry — Custom Pot Manufacturing UAE',
    template: '%s | Forestry',
  },
  description: 'UAE\'s premium custom pot manufacturer for interior designers, landscapers & commercial projects. Any size. Any quantity.',
  keywords:    ['custom pots', 'planters', 'UAE manufacturing', 'B2B vendor portal', 'commercial planters'],
  authors:     [{ name: 'Forestry' }],
  openGraph: {
    title:       'Forestry — Custom Pot Manufacturing UAE',
    description: 'Premium custom pots crafted to order for B2B vendors.',
    type:        'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${zillaSlab.variable} ${dmSans.variable}`} suppressHydrationWarning>
      <body className="font-body antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
