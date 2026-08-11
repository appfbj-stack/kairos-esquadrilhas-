import { redirect } from 'next/navigation';
import { auth, signOut } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, session.user.tenantId))
    .limit(1);

  async function doSignOut() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Logo size="sm" />
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium leading-tight">{session.user.name}</p>
              <p className="text-xs text-muted-foreground">
                {tenant?.name ?? 'Sem empresa'} · {session.user.role}
                {session.user.isDemo && ' · demo'}
              </p>
            </div>
            <form action={doSignOut}>
              <Button type="submit" variant="ghost" size="icon" aria-label="Sair">
                <LogOut className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      </header>
      <div className="container py-6">{children}</div>
    </div>
  );
}
