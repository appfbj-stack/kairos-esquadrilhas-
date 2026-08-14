'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { db } from '@/lib/db';
import { projects, projectPhotos, quotes, priceRules } from '@/lib/db/schema';
import { eq, and, desc, isNull, or, lt, sql } from 'drizzle-orm';
import { requireTenantContext } from '@/lib/tenant/context';
import { calculatePrice, type PriceInput } from '@/lib/pricing';

function generateCode(): string {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `P-${year}-${random}`;
}

export async function createProject() {
  const ctx = await requireTenantContext();
  const [created] = await db
    .insert(projects)
    .values({
      tenantId: ctx.tenantId,
      createdBy: ctx.userId,
      code: generateCode(),
      title: 'Novo projeto',
      status: 'rascunho',
    })
    .returning();
  revalidatePath('/projetos');
  redirect(`/projetos/novo?pid=${created.id}`);
}

const updateSchema = z.object({
  id: z.string().uuid(),
  customerId: z.string().uuid().nullable().optional(),
  productId: z.string().uuid().nullable().optional(),
  modelId: z.string().uuid().nullable().optional(),
  title: z.string().optional(),
  widthMm: z.number().int().positive().nullable().optional(),
  heightMm: z.number().int().positive().nullable().optional(),
  depthMm: z.number().int().positive().nullable().optional(),
  modulesCount: z.number().int().positive().nullable().optional(),
  leavesCount: z.number().int().positive().nullable().optional(),
  colorId: z.string().uuid().nullable().optional(),
  glassId: z.string().uuid().nullable().optional(),
  opening: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(['rascunho', 'orcamento']).optional(),
});

export async function updateProject(input: z.input<typeof updateSchema>) {
  const ctx = await requireTenantContext();
  const parsed = updateSchema.parse(input);

  // Verifica que o projeto pertence ao tenant
  const [owned] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, parsed.id), eq(projects.tenantId, ctx.tenantId)))
    .limit(1);
  if (!owned) throw new Error('Projeto nao encontrado');

  // Se tem produto/modelo, atualiza titulo default
  let title = parsed.title;
  if (!title) {
    const [proj] = await db.select().from(projects).where(eq(projects.id, parsed.id)).limit(1);
    title = proj?.title;
  }

  await db
    .update(projects)
    .set({
      customerId: parsed.customerId ?? null,
      productId: parsed.productId ?? null,
      modelId: parsed.modelId ?? null,
      title: title ?? 'Novo projeto',
      widthMm: parsed.widthMm ?? null,
      heightMm: parsed.heightMm ?? null,
      depthMm: parsed.depthMm ?? null,
      modulesCount: parsed.modulesCount ?? null,
      leavesCount: parsed.leavesCount ?? null,
      colorId: parsed.colorId ?? null,
      glassId: parsed.glassId ?? null,
      opening: parsed.opening ?? null,
      notes: parsed.notes ?? null,
      status: parsed.status ?? 'rascunho',
      updatedAt: new Date(),
    })
    .where(eq(projects.id, parsed.id));

  revalidatePath(`/projetos/${parsed.id}`);
  revalidatePath('/projetos');
  return { ok: true };
}

export async function getProject(id: string) {
  const ctx = await requireTenantContext();
  const [row] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.tenantId, ctx.tenantId)))
    .limit(1);
  return row ?? null;
}

export async function getProjectPhotos(id: string) {
  const ctx = await requireTenantContext();
  const rows = await db
    .select()
    .from(projectPhotos)
    .where(and(eq(projectPhotos.projectId, id), eq(projectPhotos.tenantId, ctx.tenantId)))
    .orderBy(projectPhotos.position);
  return rows;
}

export async function deleteProjectPhoto(photoId: string) {
  const ctx = await requireTenantContext();
  await db
    .delete(projectPhotos)
    .where(and(eq(projectPhotos.id, photoId), eq(projectPhotos.tenantId, ctx.tenantId)));
  revalidatePath('/projetos');
}

export async function listProjects() {
  const ctx = await requireTenantContext();
  return db
    .select()
    .from(projects)
    .where(eq(projects.tenantId, ctx.tenantId))
    .orderBy(desc(projects.updatedAt))
    .limit(100);
}

export async function getOrCreateQuote(projectId: string) {
  const ctx = await requireTenantContext();

  const [proj] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.tenantId, ctx.tenantId)))
    .limit(1);
  if (!proj) return null;

  // Busca regra de preco
  let rule = null;
  if (proj.modelId) {
    const [r] = await db
      .select()
      .from(priceRules)
      .where(and(eq(priceRules.modelId, proj.modelId), eq(priceRules.tenantId, ctx.tenantId)))
      .limit(1);
    rule = r ?? null;
  }
  if (!rule && proj.productId) {
    const [r] = await db
      .select()
      .from(priceRules)
      .where(
        and(
          eq(priceRules.productId, proj.productId),
          eq(priceRules.tenantId, ctx.tenantId),
          isNull(priceRules.modelId)
        )
      )
      .limit(1);
    rule = r ?? null;
  }

  // Calcula preco
  const price = calculatePrice({
    widthMm: proj.widthMm,
    heightMm: proj.heightMm,
    depthMm: proj.depthMm,
    modules: proj.modulesCount,
    leaves: proj.leavesCount,
    rule: rule
      ? {
          ruleType: rule.ruleType,
          basePrice: rule.basePrice,
          glassPricePerM2: rule.glassPricePerM2,
          hardwareCost: rule.hardwareCost,
          laborCost: rule.laborCost,
          installationCost: rule.installationCost,
          wastePercent: rule.wastePercent,
          marginPercent: rule.marginPercent,
          extras: (rule.extras as Record<string, any> | null) ?? null,
        }
      : null,
  });

  // Verifica se ja tem quote
  const [existing] = await db
    .select()
    .from(quotes)
    .where(eq(quotes.projectId, projectId))
    .limit(1);

  if (existing) {
    await db
      .update(quotes)
      .set({
        materialsTotal: price.materialsTotal.toFixed(2),
        glassTotal: price.glassTotal.toFixed(2),
        hardwareTotal: price.hardwareTotal.toFixed(2),
        laborTotal: price.laborTotal.toFixed(2),
        installationTotal: price.installationTotal.toFixed(2),
        wasteTotal: price.wasteTotal.toFixed(2),
        marginTotal: price.marginTotal.toFixed(2),
        extrasTotal: price.extrasTotal.toFixed(2),
        total: price.total.toFixed(2),
        breakdown: price.breakdown as any,
      })
      .where(eq(quotes.id, existing.id));
    return { ...existing, ...price };
  }

  const number = `O-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  const [created] = await db
    .insert(quotes)
    .values({
      tenantId: ctx.tenantId,
      projectId,
      number,
      materialsTotal: price.materialsTotal.toFixed(2),
      glassTotal: price.glassTotal.toFixed(2),
      hardwareTotal: price.hardwareTotal.toFixed(2),
      laborTotal: price.laborTotal.toFixed(2),
      installationTotal: price.installationTotal.toFixed(2),
      wasteTotal: price.wasteTotal.toFixed(2),
      marginTotal: price.marginTotal.toFixed(2),
      extrasTotal: price.extrasTotal.toFixed(2),
      total: price.total.toFixed(2),
      breakdown: price.breakdown as any,
    })
    .returning();

  return { ...created, ...price };
}
