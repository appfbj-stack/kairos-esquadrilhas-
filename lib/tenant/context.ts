import { auth } from '../auth/config';
import { headers } from 'next/headers';

export type TenantContext = {
  tenantId: string;
  userId: string;
  role: 'admin' | 'vendedor' | 'producao';
  isDemo: boolean;
};

export async function getTenantContext(): Promise<TenantContext | null> {
  const session = await auth();
  if (!session?.user?.tenantId || !session.user.id) return null;
  return {
    tenantId: session.user.tenantId,
    userId: session.user.id,
    role: session.user.role,
    isDemo: session.user.isDemo,
  };
}

export async function requireTenantContext(): Promise<TenantContext> {
  const ctx = await getTenantContext();
  if (!ctx) {
    throw new Error('Sem contexto de tenant — autenticacao requerida.');
  }
  return ctx;
}
