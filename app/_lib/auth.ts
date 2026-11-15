import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import GitHub from 'next-auth/providers/github'
import MicrosoftEntraID from 'next-auth/providers/microsoft-entra-id'
import { PrismaAdapter } from '@auth/prisma-adapter'
import prisma from '@/lib/prisma'
import { verifyPassword } from '@/lib/crypto'
import { z } from 'zod'

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  totpCode: z.string().length(6).optional(),
  rememberMe: z.boolean().optional(),
})

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: 'database',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  cookies: {
    sessionToken: {
      name: 'session',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
      },
    },
    csrfToken: {
      name: 'csrf',
      options: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
      },
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
    newUser: '/onboarding',
  },
  providers: [
    Credentials({
      name: 'Email & Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        totpCode: { label: 'TOTP Code', type: 'text' },
        rememberMe: { label: 'Remember me', type: 'checkbox' },
      },
      authorize: async (credentials) => {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const { email, password, totpCode } = parsed.data

        // Rate limiting handled by middleware
        const user = await prisma.user.findUnique({
          where: { email: email.toLowerCase() },
          include: {
            memberships: {
              where: { status: 'ACTIVE' },
              include: { organization: true },
            },
          },
        })

        if (!user || !user.passwordHash) return null

        const valid = await verifyPassword(password, user.passwordHash)
        if (!valid) return null

        // Check TOTP if enabled
        if (user.totpSecret) {
          if (!totpCode) {
            throw new Error('TOTP_REQUIRED')
          }
          const { verifyTOTP } = await import('@/lib/crypto')
          const totpValid = verifyTOTP(user.totpSecret, totpCode)
          if (!totpValid) return null
        }

        // Update last login
        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        })

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.avatarUrl,
          emailVerified: user.emailVerified,
        }
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'openid email profile',
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    }),
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      authorization: {
        params: {
          scope: 'read:user user:email',
        },
      },
    }),
    MicrosoftEntraID({
      clientId: process.env.MICROSOFT_CLIENT_ID,
      clientSecret: process.env.MICROSOFT_CLIENT_SECRET,
      tenantId: process.env.MICROSOFT_TENANT_ID || 'common',
      authorization: {
        params: {
          scope: 'openid email profile User.Read',
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === 'credentials') return true

      // OAuth: check if user exists, link accounts
      const existingUser = await prisma.user.findUnique({
        where: { email: user.email! },
      })

      if (existingUser) {
        // Link account if not already linked
        const existingAccount = await prisma.account.findFirst({
          where: { userId: existingUser.id, provider: account.provider },
        })
        if (!existingAccount) {
          await prisma.account.create({
            data: {
              userId: existingUser.id,
              type: account.type,
              provider: account.provider,
              providerAccountId: account.providerAccountId,
              access_token: account.access_token,
              refresh_token: account.refresh_token,
              expires_at: account.expires_at,
              token_type: account.token_type,
              scope: account.scope,
              id_token: account.id_token,
            },
          })
        }
      }
      return true
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        // Fetch memberships
        const memberships = await prisma.organizationMember.findMany({
          where: { userId: user.id, status: 'ACTIVE' },
          include: { organization: true },
        })
        ;(session as any).memberships = memberships
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) token.id = user.id
      if (account) token.provider = account.provider
      return token
    },
  },
  events: {
    async createUser({ user }) {
      // Create default organization for new user
      await prisma.organization.create({
        data: {
          name: `${user.name || user.email?.split('@')[0] || 'User'}'s Workspace`,
          slug: `${user.email?.split('@')[0]}-${Date.now()}`.toLowerCase(),
          members: {
            create: {
              userId: user.id,
              role: 'OWNER',
              status: 'ACTIVE',
              joinedAt: new Date(),
            },
          },
        },
      })
    },
  },
  debug: process.env.NODE_ENV === 'development',
})

// Extend session type
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
    }
    memberships?: Array<{
      id: string
      role: string
      organization: {
        id: string
        name: string
        slug: string
      }
    }>
  }
}