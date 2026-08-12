'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { customers } from '@/lib/db/schema';
import { eq, and, ilike, or, desc, sql } from 'drizzle-orm';
import { requireTenantContext } from '@/lib/tenant/context';

const customerSchema = z.object({
  name: z.string().min(2, 'Nome e obrigatorio'),
  phone: z.string().optional().or(z.literal('')),
  whatsapp: z.string().optional().or(z.literal('')),
  email: z.string().email('Email invalido').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
});

export type CustomerFormState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function createCustomer(_prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const ctx = await requireTenantContext();

  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Verifique os campos', fieldErrors };
  }

  const [created] = await db
    .insert(customers)
    .values({
      tenantId: ctx.tenantId,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
    })
    .returning();

  revalidatePath('/clientes');
  redirect(`/clientes/${created.id}`);
}

export async function updateCustomer(id: string, _prev: CustomerFormState, formData: FormData): Promise<CustomerFormState> {
  const ctx = await requireTenantContext();

  const raw = Object.fromEntries(formData.entries());
  const parsed = customerSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0]?.toString();
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return { ok: false, error: 'Verifique os campos', fieldErrors };
  }

  await db
    .update(customers)
    .set({
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      whatsapp: parsed.data.whatsapp || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
      notes: parsed.data.notes || null,
      updatedAt: new Date(),
    })
    .where(and(eq(customers.id, id), eq(customers.tenantId, ctx.tenantId)));

  revalidatePath('/clientes');
  revalidatePath(`/clientes/${id}`);
  redirect(`/clientes/${id}?ok=1`);
}

export async function deleteCustomer(id: string): Promise<void> {
  const ctx = await requireTenantContext();
  await db
    .delete(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, ctx.tenantId)));
  revalidatePath('/clientes');
  redirect('/clientes');
}

export async function searchCustomers(q: string) {
  const ctx = await requireTenantContext();
  const query = q.trim();
  if (!query) {
    return db
      .select()
      .from(customers)
      .where(eq(customers.tenantId, ctx.tenantId))
      .orderBy(desc(customers.updatedAt))
      .limit(50);
  }
  const like = `%${query}%`;
  return db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.tenantId, ctx.tenantId),
        or(
          ilike(customers.name, like),
          ilike(customers.phone, like),
          ilike(customers.whatsapp, like),
          ilike(customers.email, like)
        )
      )
    )
    .orderBy(desc(customers.updatedAt))
    .limit(50);
}

export async function getCustomer(id: string) {
  const ctx = await requireTenantContext();
  const [row] = await db
    .select()
    .from(customers)
    .where(and(eq(customers.id, id), eq(customers.tenantId, ctx.tenantId)))
    .limit(1);
  return row ?? null;
}

export async function getCustomerProjectsCount(id: string) {
  const ctx = await requireTenantContext();
  // tabela projects tem customerId
  const { projects } = await import('@/lib/db/schema');
  const rows = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(projects)
    .where(and(eq(projects.customerId, id), eq(projects.tenantId, ctx.tenantId)));
  return rows[0]?.count ?? 0;
}
