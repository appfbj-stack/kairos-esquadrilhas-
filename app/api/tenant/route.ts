import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth/config';
import { db } from '@/lib/db';
import { tenants } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@/lib/utils';

const schema = z.object({
  name: z.string().min(2),
  legalName: z.string().optional(),
  cnpj: z.string().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  address: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.tenantId) {
    return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 });
  }

  const data = parsed.data;
  const baseSlug = slugify(data.name) || `tenant-${Date.now()}`;

  // Garante slug único
  const [existing] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, baseSlug))
    .limit(1);

  const finalSlug = existing ? `${baseSlug}-${Math.random().toString(36).slice(2, 6)}` : baseSlug;

  await db
    .update(tenants)
    .set({
      slug: finalSlug,
      name: data.name,
      legalName: data.legalName || null,
      cnpj: data.cnpj || null,
      phone: data.phone || null,
      whatsapp: data.whatsapp || null,
      email: data.email || null,
      address: data.address || null,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, session.user.tenantId));

  return NextResponse.json({ ok: true, slug: finalSlug });
}
