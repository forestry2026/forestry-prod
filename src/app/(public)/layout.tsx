import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getSiteLogo } from '@/lib/getSiteLogo'

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = await getSiteLogo()

  return (
    <>
      <Navbar initialLogoUrl={logoUrl} />
      <main>{children}</main>
      <Footer initialLogoUrl={logoUrl} />
    </>
  )
}
