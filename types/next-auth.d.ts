// Estender tipos do NextAuth para incluir campos customizados.
import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      tenantId: string;
      role: 'admin' | 'vendedor' | 'producao';
      isDemo: boolean;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    tenantId: string;
    role: 'admin' | 'vendedor' | 'producao';
    isDemo: boolean;
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
