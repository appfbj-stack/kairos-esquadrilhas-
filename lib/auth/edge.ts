import type { NextAuthConfig } from 'next-auth';

/**
 * Config EDGE-SAFE do NextAuth.
 * Usada pelo middleware (que roda no Edge Runtime — sem Node.js APIs).
 * NAO inclua providers que dependam de bcryptjs, pg, etc. aqui.
 * A config completa (com providers) fica em ./config.ts.
 */
export const authConfigEdge: NextAuthConfig = {
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  trustHost: true,
  providers: [],
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
