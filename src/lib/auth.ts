import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
// UserRole is stored as a plain string in Postgres (no Prisma enum).
type UserRole = 'VENDOR' | 'ADMIN' | 'MANAGER' | 'PRODUCTION'

/**
 * NextAuth configuration for Forestry B2B Portal.
 * Uses JWT session strategy with 30-day max age.
 * Provides credentials-based authentication with email and password.
 * Automatically updates lastLoginAt on successful authentication.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt', maxAge: 30 * 24 * 60 * 60 }, // 30 days

  pages: {
    signIn:  '/login',
    error:   '/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email'    },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        // Fetch only the fields needed to authenticate — lighter than `include: vendorProfile`.
        const user = await prisma.user.findUnique({
          where:  { email: credentials.email.toLowerCase().trim() },
          select: {
            id:           true,
            email:        true,
            name:         true,
            role:         true,
            isActive:     true,
            passwordHash: true,
            vendorProfile: { select: { id: true } },
          },
        })

        if (!user || !user.isActive) return null

        const passwordMatch = await bcrypt.compare(credentials.password, user.passwordHash)
        if (!passwordMatch) return null

        // Fire-and-forget — don't make the user wait for the lastLoginAt DB roundtrip.
        prisma.user.update({
          where: { id: user.id },
          data:  { lastLoginAt: new Date() },
        }).catch(err => console.error('[auth] lastLoginAt update failed:', err))

        return {
          id:              user.id,
          email:           user.email,
          name:            user.name,
          role:            user.role as UserRole,
          vendorProfileId: user.vendorProfile?.id ?? null,
        }
      },
    }),
  ],

  callbacks: {
    /**
     * JWT callback — runs whenever a JWT is created or updated.
     * Enriches the token with user-specific data (id, role, vendorProfileId) from the user object.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id              = user.id
        token.role            = (user as any).role
        token.vendorProfileId = (user as any).vendorProfileId
      }
      return token
    },

    /**
     * Session callback — runs whenever a session is accessed.
     * Syncs JWT token data (id, role, vendorProfileId) to the session object for client-side access.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id              = token.id as string
        session.user.role            = token.role as UserRole
        session.user.vendorProfileId = token.vendorProfileId as string | null
      }
      return session
    },
  },
}

// Extend next-auth types
declare module 'next-auth' {
  interface User {
    role:            UserRole
    vendorProfileId: string | null
  }
  interface Session {
    user: {
      id:              string
      email:           string
      name:            string
      role:            UserRole
      vendorProfileId: string | null
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id:              string
    role:            UserRole
    vendorProfileId: string | null
  }
}
