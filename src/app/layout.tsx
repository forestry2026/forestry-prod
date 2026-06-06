import type { Metadata } from 'next'
import { Zilla_Slab, DM_Sans } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { unstable_cache } from 'next/cache'
import { prisma } from '@/lib/prisma'

// Cache the site logo for 1 hour — avoids force-dynamic on every request
const getSiteLogoCache = unstable_cache(
  async () => {
    try {
      const setting = await prisma.siteSetting.findUnique({ where: { key: 'logoUrl' } })
      return setting?.value ?? null
    } catch {
      return null
    }
  },
  ['site-logo'],
  { revalidate: 3600 },
)

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
  metadataBase: new URL('https://theforestry.me'),
  title: {
    default:  'Forestry — Custom Planters & Bespoke Pots Manufacturer UAE',
    template: '%s | Forestry',
  },
  description:
    "UAE's premium custom planter manufacturer for interior designers, landscapers and commercial contractors. Fiberglass, GRC and polystone. Any size, any quantity. 48-hour quotes.",
  keywords: [
    'custom planters UAE',
    'bespoke planters Dubai',
    'fiberglass planters UAE',
    'GRC planters Dubai',
    'commercial planters UAE',
    'custom pots manufacturer UAE',
    'architectural planters',
    'luxury planters UAE',
    'B2B planters supplier',
  ],
  authors:   [{ name: 'Forestry', url: 'https://theforestry.me' }],
  creator:   'Forestry',
  publisher: 'Forestry',
  verification: {
    google: '8Gf-kY_DlKbClitXr_Lrw7JzLEA7b8RpP_GhnVVxKK4',
  },
  robots: {
    index:  true,
    follow: true,
    googleBot: {
      index:               true,
      follow:              true,
      'max-image-preview': 'large',
      'max-snippet':       -1,
    },
  },
  openGraph: {
    type:        'website',
    locale:      'en_AE',
    url:         'https://theforestry.me',
    siteName:    'Forestry',
    title:       'Forestry — Custom Planters & Bespoke Pots Manufacturer UAE',
    description: "UAE's premium custom planter manufacturer. Fiberglass, GRC, polystone. Any size, any quantity. 48-hour B2B quotes.",
    images: [
      {
        url:    '/og-image.jpg',
        width:  1200,
        height: 630,
        alt:    'Forestry — Custom Planters & Bespoke Pots Manufacturer UAE',
      },
    ],
  },
  twitter: {
    card:        'summary_large_image',
    title:       'Forestry — Custom Planters UAE',
    description: "UAE's premium custom planter manufacturer. B2B trade accounts. 48-hour quotes.",
    images:      ['/og-image.jpg'],
  },
  alternates: {
    canonical: 'https://theforestry.me',
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type':       'Organization',
      '@id':         'https://theforestry.me/#organization',
      name:          'Forestry',
      url:           'https://theforestry.me',
      description:   "UAE's premium custom planter and pot manufacturer for interior designers, landscapers and commercial contractors. Any size, any quantity, 48-hour quotes.",
      address: {
        '@type':         'PostalAddress',
        addressLocality: 'Dubai',
        addressCountry:  'AE',
      },
      email:     'info@theforestry.me',
      areaServed: [
        { '@type': 'Country', name: 'United Arab Emirates' },
        { '@type': 'Country', name: 'Saudi Arabia' },
        { '@type': 'Country', name: 'Qatar' },
        { '@type': 'Country', name: 'Kuwait' },
        { '@type': 'Country', name: 'Bahrain' },
        { '@type': 'Country', name: 'Oman' },
      ],
    },
    {
      '@type':     'WebSite',
      '@id':       'https://theforestry.me/#website',
      url:         'https://theforestry.me',
      name:        'Forestry — Custom Planters & Bespoke Pots Manufacturer UAE',
      publisher:   { '@id': 'https://theforestry.me/#organization' },
    },
  ],
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteLogoUrl = await getSiteLogoCache()

  return (
    <html
      lang="en-AE"
      className={`${zillaSlab.variable} ${dmSans.variable}`}
      data-site-logo-url={siteLogoUrl ?? ''}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <meta name="geo.region" content="AE-DU" />
        <meta name="geo.placename" content="Dubai, United Arab Emirates" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
