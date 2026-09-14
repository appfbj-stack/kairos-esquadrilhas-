/**
 * Cria 3 orcamentos demo com clientes, projetos e produtos variados.
 * Rodar com: docker exec -e DATABASE_URL=... <container> npx tsx lib/db/seed-orders.ts
 */
import { db, pool } from './index';
import {
  tenants,
  users,
  customers,
  products,
  productModels,
  colors,
  glasses,
  projects,
  quotes,
  priceRules,
} from './schema';
import { and, eq } from 'drizzle-orm';
import { calculatePrice } from '../pricing';

async function main() {
  console.log('[seed-orders] Iniciando...');

  // Tenant demo
  const [tenant] = await db
    .select()
    .from(tenants)
    .where(eq(tenants.slug, 'demo'))
    .limit(1);
  if (!tenant) {
    console.error('[seed-orders] Tenant demo nao encontrado. Rode o seed principal primeiro.');
    process.exit(1);
  }

  // User demo
  const [demoUser] = await db
    .select()
    .from(users)
    .where(eq(users.email, 'demo@kairos.app'))
    .limit(1);
  if (!demoUser) {
    console.error('[seed-orders] Usuario demo nao encontrado.');
    process.exit(1);
  }

  // Refs
  const [portaProd] = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenant.id), eq(products.category, 'porta')))
    .limit(1);
  const [boxProd] = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenant.id), eq(products.category, 'box')))
    .limit(1);
  const [janelaProd] = await db
    .select()
    .from(products)
    .where(and(eq(products.tenantId, tenant.id), eq(products.category, 'janela')))
    .limit(1);

  if (!portaProd || !boxProd || !janelaProd) {
    console.error('[seed-orders] Produtos nao encontrados. Rode o seed principal primeiro.');
    process.exit(1);
  }

  const [portaModel] = await db
    .select()
    .from(productModels)
    .where(and(eq(productModels.productId, portaProd.id), eq(productModels.name, '1 folha')))
    .limit(1);
  const [boxModel] = await db
    .select()
    .from(productModels)
    .where(and(eq(productModels.productId, boxProd.id), eq(productModels.name, 'Frontal')))
    .limit(1);
  const [janelaModel] = await db
    .select()
    .from(productModels)
    .where(and(eq(productModels.productId, janelaProd.id), eq(productModels.name, '4 folhas')))
    .limit(1);

  // Cores
  const allColors = await db.select().from(colors).where(eq(colors.tenantId, tenant.id));
  const cBranco = allColors.find((c) => c.name.toLowerCase().includes('branco'));
  const cNatural = allColors.find((c) => c.name.toLowerCase().includes('natural'));
  const cPreto = allColors.find((c) => c.name.toLowerCase().includes('preto'));

  // Vidros
  const allGlasses = await db.select().from(glasses).where(eq(glasses.tenantId, tenant.id));
  const gIncolor = allGlasses.find((g) => g.type === 'incolor');
  const gFume = allGlasses.find((g) => g.type === 'fume');
  const gTemperado = allGlasses.find((g) => g.type === 'temperado');

  // 3 clientes
  const clientesData = [
    { name: 'Maria Silva', phone: '(11) 98765-4321', whatsapp: '(11) 98765-4321', email: 'maria@email.com', address: 'Rua das Flores, 123 - Sao Paulo/SP' },
    { name: 'Joao Santos', phone: '(11) 91234-5678', whatsapp: '(11) 91234-5678', email: 'joao@email.com', address: 'Av. Brasil, 456 - Guarulhos/SP' },
    { name: 'Ana Pereira', phone: '(11) 99999-1111', whatsapp: '(11) 99999-1111', email: 'ana@email.com', address: 'Rua das Acacias, 789 - Osasco/SP' },
  ];

  const clientesCriados = [];
  for (const c of clientesData) {
    const [row] = await db
      .insert(customers)
      .values({ tenantId: tenant.id, ...c })
      .returning();
    clientesCriados.push(row);
    console.log(`[seed-orders] Cliente criado: ${row.name}`);
  }

  // Helper: pega price rule
  async function getRule(productId: string, modelId?: string) {
    if (modelId) {
      const [r] = await db
        .select()
        .from(priceRules)
        .where(and(eq(priceRules.modelId, modelId), eq(priceRules.tenantId, tenant.id)))
        .limit(1);
      if (r) return r;
    }
    const [r] = await db
      .select()
      .from(priceRules)
      .where(
        and(
          eq(priceRules.productId, productId),
          eq(priceRules.tenantId, tenant.id)
        )
      )
      .limit(1);
    return r;
  }

  // 3 projetos/orcamentos
  const ordersData = [
    {
      cliente: clientesCriados[0],
      title: 'Maria Silva - Porta de abrir',
      product: portaProd,
      model: portaModel,
      widthMm: 900,
      heightMm: 2100,
      depthMm: null,
      leaves: 1,
      colorId: cBranco?.id,
      glassId: gTemperado?.id,
      opening: 'abrir',
      notes: 'Porta de entrada principal. Cliente quer trocar a porta atual.',
    },
    {
      cliente: clientesCriados[1],
      title: 'Joao Santos - Box Frontal',
      product: boxProd,
      model: boxModel,
      widthMm: 1800,
      heightMm: 2000,
      depthMm: 800,
      leaves: 1,
      colorId: cNatural?.id,
      glassId: gIncolor?.id,
      opening: null,
      notes: 'Box do banheiro suite. Vidro temperado 8mm.',
    },
    {
      cliente: clientesCriados[2],
      title: 'Ana Pereira - Janela 4 folhas',
      product: janelaProd,
      model: janelaModel,
      widthMm: 3000,
      heightMm: 1500,
      depthMm: null,
      leaves: 4,
      colorId: cPreto?.id,
      glassId: gFume?.id,
      opening: 'correr',
      notes: 'Janela da sala. Quer 4 folhas de correr com vidro fume.',
    },
  ];

  for (const o of ordersData) {
    // 1. cria projeto
    const code = `P-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [proj] = await db
      .insert(projects)
      .values({
        tenantId: tenant.id,
        createdBy: demoUser.id,
        customerId: o.cliente.id,
        code,
        title: o.title,
        status: 'orcamento',
        productId: o.product.id,
        modelId: o.model?.id ?? null,
        widthMm: o.widthMm,
        heightMm: o.heightMm,
        depthMm: o.depthMm,
        leavesCount: o.leaves,
        colorId: o.colorId ?? null,
        glassId: o.glassId ?? null,
        opening: o.opening,
        notes: o.notes,
      })
      .returning();
    console.log(`[seed-orders] Projeto criado: ${proj.code} - ${proj.title}`);

    // 2. calcula preco
    const rule = await getRule(o.product.id, o.model?.id);
    const price = calculatePrice({
      widthMm: o.widthMm,
      heightMm: o.heightMm,
      depthMm: o.depthMm,
      leaves: o.leaves,
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
            extras: (rule.extras as any) ?? null,
          }
        : null,
    });

    // 3. cria quote
    const number = `O-2026-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    await db.insert(quotes).values({
      tenantId: tenant.id,
      projectId: proj.id,
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
    });
    console.log(
      `[seed-orders] Orcamento ${number}: R$ ${price.total.toFixed(2)} (${o.widthMm}x${o.heightMm}mm)`
    );
  }

  console.log('[seed-orders] OK - 3 orcamentos criados');
  await pool.end();
}

main().catch((err) => {
  console.error('[seed-orders] Falha:', err);
  process.exit(1);
});
