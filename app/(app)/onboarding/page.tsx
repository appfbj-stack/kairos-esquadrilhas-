import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { OnboardingForm } from './onboarding-form';

export const metadata = { title: 'Configurar empresa' };

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.id, session.user.tenantId))
    .limit(1);

  if (tenant) redirect('/dashboard');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Bem-vindo!</h1>
        <p className="text-sm text-muted-foreground">
          Configure sua empresa para comecar a usar o Kairos Esquadrilhas 3D.
        </p>
      </div>
      <OnboardingForm />
    </div>
  );
}
