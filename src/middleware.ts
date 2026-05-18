import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token    = req.nextauth.token
    const pathname = req.nextUrl.pathname

    // Admin dashboard entry point
    if (pathname === '/admin') {
      return NextResponse.next()
    }

    // Admin/Manager routes (skip demo routes which are open for testing)
    const isDemoAdminRoute =
      pathname.startsWith('/admin/quotations') ||
      pathname.startsWith('/admin/production-queue') ||
      pathname.startsWith('/admin/production') ||
      pathname.startsWith('/admin/vendor-orders') ||
      pathname.startsWith('/admin/admin') ||
      pathname.startsWith('/admin/products') ||
      pathname.startsWith('/admin/attributes') ||
      pathname.startsWith('/admin/vendors') ||
      pathname.startsWith('/admin/users') ||
      pathname.startsWith('/admin/rfps')

    if (pathname.startsWith('/admin') && !isDemoAdminRoute) {
      if (!token || (token.role !== 'ADMIN' && token.role !== 'MANAGER')) {
        return NextResponse.redirect(new URL('/login?error=unauthorized', req.url))
      }
    }

    // Vendor portal routes
    if (pathname.startsWith('/portal')) {
      if (!token) {
        return NextResponse.redirect(new URL('/login', req.url))
      }
      if (token.role === 'ADMIN' || token.role === 'MANAGER') {
        return NextResponse.redirect(new URL('/admin', req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        // Public routes — always allow
        if (
          pathname === '/' ||
          pathname === '/login' ||
          pathname === '/request-access' ||
          pathname.startsWith('/product/') ||
          pathname.startsWith('/api/auth') ||
          pathname.startsWith('/api/access-requests') ||
          pathname.startsWith('/api/admin/settings/brand') ||
          pathname.startsWith('/api/upload') ||
          pathname.startsWith('/api/quotations') ||
          pathname.startsWith('/api/production') ||
          pathname.startsWith('/_next') ||
          pathname.startsWith('/favicon') ||
          pathname.startsWith('/uploads/') ||
          pathname.startsWith('/downloads/') ||
          // Admin dashboard routes (demo mode)
          pathname === '/admin' ||
          pathname.startsWith('/admin/quotations') ||
          pathname.startsWith('/admin/production-queue') ||
          pathname.startsWith('/admin/production') ||
          pathname.startsWith('/admin/vendor-orders') ||
          // CMS Admin routes (demo mode)
          pathname.startsWith('/admin/products') ||
          pathname.startsWith('/admin/attributes') ||
          pathname.startsWith('/admin/vendors') ||
          pathname.startsWith('/admin/users') ||
          pathname.startsWith('/admin/rfps') ||
          // Demo routes for Order Lifecycle Module
          pathname.startsWith('/quotations') ||
          pathname.startsWith('/orders') ||
          pathname.startsWith('/dashboard') ||
          pathname.startsWith('/production-queue') ||
          pathname.startsWith('/jobs')
        ) {
          return true
        }
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$).*)'],
}
