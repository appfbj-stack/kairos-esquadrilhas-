import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { z } from 'zod';
import { db } from '../db';
import { users, tenants } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { verifyPassword } from './password';
import { authConfigEdge } from './edge';

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

/**
 * Config COMPLETA do NextAuth (Node runtime).
 * Importada apenas em API routes, server actions, e route handlers.
 * Para o middleware (Edge), use ./edge.ts.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfigEdge,
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
});
