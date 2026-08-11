import NextAuth, { type DefaultSession, type NextAuthConfig } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '../db';
import { users, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from './password';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: 'admin' | 'vendedor' | 'producao';
      isDemo: boolean;
    } & DefaultSession['user'];
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    uid?: string;
    tenantId?: string;
    role?: 'admin' | 'vendedor' | 'producao';
    isDemo?: boolean;
  }
}

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const demoSchema = z.object({
  tenantSlug: z.string().min(1).default('demo'),
});

const demoEnabled = process.env.ENABLE_DEMO_MODE === 'true';

export const authConfig: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  trustHost: true,
  providers: [
    Credentials({
      id: 'credentials',
      name: 'Email e senha',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const rows = await db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
            passwordHash: users.passwordHash,
            role: users.role,
            isDemo: users.isDemo,
            tenantId: users.tenantId,
            active: users.active,
          })
          .from(users)
          .where(eq(users.email, email))
          .limit(1);

        const user = rows[0];
        if (!user || !user.passwordHash || !user.active) return null;

        const ok = await verifyPassword(password, user.passwordHash);
        if (!ok) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          tenantId: user.tenantId,
          role: user.role,
          isDemo: user.isDemo,
        };
      },
    }),
    ...(demoEnabled
      ? [
          Credentials({
            id: 'demo',
            name: 'Entrar como demo',
            credentials: {
              tenantSlug: { label: 'Tenant demo', type: 'text' },
            },
            async authorize(raw) {
              const parsed = demoSchema.safeParse(raw);
              if (!parsed.success) return null;

              const slug = parsed.data.tenantSlug;
              const rows = await db
                .select({
                  id: users.id,
                  email: users.email,
                  name: users.name,
                  role: users.role,
                  isDemo: users.isDemo,
                  tenantId: users.tenantId,
                  active: users.active,
                })
                .from(users)
                .innerJoin(tenants, eq(tenants.id, users.tenantId))
                .where(and(eq(tenants.slug, slug), eq(users.isDemo, true), eq(users.active, true)))
                .limit(1);

              const user = rows[0];
              if (!user) return null;

              return {
                id: user.id,
                email: user.email,
                name: user.name,
                tenantId: user.tenantId,
                role: user.role,
                isDemo: true,
              };
            },
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        const u = user as { id: string; tenantId: string; role: 'admin' | 'vendedor' | 'producao'; isDemo: boolean };
        token.uid = u.id;
        token.tenantId = u.tenantId;
        token.role = u.role;
        token.isDemo = u.isDemo;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.uid) {
        session.user.id = token.uid;
        session.user.tenantId = token.tenantId!;
        session.user.role = token.role!;
        session.user.isDemo = token.isDemo ?? false;
      }
      return session;
    },
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;

      // Rotas publicas
      if (
        pathname === '/' ||
        pathname.startsWith('/login') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/files')
      ) {
        return true;
      }

      // Tudo o resto exige auth
      return isLoggedIn;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
