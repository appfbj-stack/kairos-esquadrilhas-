import { db, pool } from './index';
import { tenants, users, colors, glasses, accessories, products, productModels, priceRules } from './schema';
import { hashPassword } from '../auth/password';
import { eq } from 'drizzle-orm';

const DEMO_TENANT_SLUG = 'demo';
const DEMO_USER_EMAIL = 'demo@kairos.app';
const DEMO_USER_PASSWORD = 'demo123456'; // apenas em modo demo

async function ensureDemoTenant() {
  const existing = await db.select().from(tenants).where(eq(tenants.slug, DEMO_TENANT_SLUG)).limit(1);

  if (existing.length > 0) {
    console.log('[seed] Tenant demo ja existe:', existing[0].id);
    return existing[0];
  }

  const [created] = await db
    .insert(tenants)
    .values({
      slug: DEMO_TENANT_SLUG,
      name: 'Esquadrias Demo',
      legalName: 'Esquadrias Demo LTDA',
      cnpj: '00.000.000/0001-00',
      phone: '(11) 99999-0000',
      whatsapp: '(11) 99999-0000',
      email: 'contato@esquadriasdemo.com.br',
      address: 'Rua das Esquadrias, 123 - Sao Paulo/SP',
      primaryColor: '#0f172a',
      paymentTerms: '50% entrada + 50% na entrega. PIX ou boleto.',
      warranty: '5 anos para perfis, 1 ano para instalacao.',
      proposalValidityDays: 15,
    })
    .returning();

  console.log('[seed] Tenant demo criado:', created.id);
  return created;
}

async function ensureDemoUser(tenantId: string) {
  const existing = await db
    .select()
    .from(users)
    .where(eq(users.email, DEMO_USER_EMAIL))
    .limit(1);

  if (existing.length > 0) {
    console.log('[seed] Usuario demo ja existe');
    return existing[0];
  }

  const passwordHash = await hashPassword(DEMO_USER_PASSWORD);

  const [created] = await db
    .insert(users)
    .values({
      tenantId,
      email: DEMO_USER_EMAIL,
      name: 'Pastor Demonstra',
      passwordHash,
      role: 'admin',
      isDemo: true,
    })
    .returning();

  console.log('[seed] Usuario demo criado:', created.email, '/ senha:', DEMO_USER_PASSWORD);
  return created;
}

async function ensureCatalog(tenantId: string) {
  const existingProducts = await db.select().from(products).where(eq(products.tenantId, tenantId));
  if (existingProducts.length > 0) {
    console.log('[seed] Catalogo ja populado');
    return;
  }

  // Cores basicas
  const colorData = [
    { tenantId, name: 'Branco', hex: '#ffffff' },
    { tenantId, name: 'Preto', hex: '#0a0a0a' },
    { tenantId, name: 'Bronze', hex: '#8c6b3f' },
    { tenantId, name: 'Natural', hex: '#c0c0c0' },
    { tenantId, name: 'Cinza', hex: '#6b7280' },
  ];
  const insertedColors = await db.insert(colors).values(colorData).returning();
  console.log('[seed] Cores inseridas:', insertedColors.length);

  // Vidros
  const glassData = [
    { tenantId, name: 'Incolor 4mm', type: 'incolor', transmission: '0.88', thickness: '4', pricePerM2: '120' },
    { tenantId, name: 'Fume 4mm', type: 'fume', transmission: '0.50', thickness: '4', pricePerM2: '180' },
    { tenantId, name: 'Verde 4mm', type: 'verde', transmission: '0.70', thickness: '4', pricePerM2: '160' },
    { tenantId, name: 'Bronze 4mm', type: 'bronze', transmission: '0.55', thickness: '4', pricePerM2: '180' },
    { tenantId, name: 'Temperado Incolor 8mm', type: 'temperado', transmission: '0.86', thickness: '8', pricePerM2: '320' },
  ];
  const insertedGlasses = await db.insert(glasses).values(glassData).returning();
  console.log('[seed] Vidros inseridos:', insertedGlasses.length);

  // Acessorios
  const accData = [
    { tenantId, name: 'Puxador simples', category: 'puxador', unitPrice: '35' },
    { tenantId, name: 'Puxador concha', category: 'puxador', unitPrice: '85' },
    { tenantId, name: 'Fechadura multiponto', category: 'fechadura', unitPrice: '420' },
    { tenantId, name: 'Roldana simples', category: 'roldana', unitPrice: '28' },
    { tenantId, name: 'Kit roldanas 4 unid.', category: 'roldana', unitPrice: '120' },
  ];
  await db.insert(accessories).values(accData);
  console.log('[seed] Acessorios inseridos: 5');

  // Produtos + modelos
  const productList = [
    {
      category: 'janela' as const,
      name: 'Janela de Correr',
      models: [
        { name: '2 folhas', defaultLeaves: 2 },
        { name: '3 folhas', defaultLeaves: 3 },
        { name: '4 folhas', defaultLeaves: 4 },
      ],
      baseRule: { ruleType: 'por_m2' as const, basePrice: '850', glassPricePerM2: '180' },
    },
    {
      category: 'porta' as const,
      name: 'Porta de Abrir',
      models: [
        { name: '1 folha', defaultLeaves: 1 },
        { name: '2 folhas', defaultLeaves: 2 },
      ],
      baseRule: { ruleType: 'por_m2' as const, basePrice: '1100', glassPricePerM2: '200' },
    },
    {
      category: 'box' as const,
      name: 'Box de Banheiro',
      models: [
        { name: 'Frontal', defaultLeaves: 1 },
        { name: 'Canto', defaultLeaves: 2 },
        { name: 'Ate o teto', defaultLeaves: 1 },
      ],
      baseRule: { ruleType: 'por_m2' as const, basePrice: '780', glassPricePerM2: '250' },
    },
    {
      category: 'guarda_corpo' as const,
      name: 'Guarda-corpo',
      models: [
        { name: 'Vidro com aluminio', defaultLeaves: 1 },
        { name: 'Vidro com estrutura', defaultLeaves: 1 },
      ],
      baseRule: { ruleType: 'por_metro_linear' as const, basePrice: '650', glassPricePerM2: '220' },
    },
  ];

  for (const p of productList) {
    const [prod] = await db
      .insert(products)
      .values({ tenantId, category: p.category, name: p.name })
      .returning();

    for (const m of p.models) {
      const [model] = await db
        .insert(productModels)
        .values({
          tenantId,
          productId: prod.id,
          name: m.name,
          defaultLeaves: m.defaultLeaves,
        })
        .returning();

      await db.insert(priceRules).values({
        tenantId,
        productId: prod.id,
        modelId: model.id,
        ruleType: p.baseRule.ruleType,
        basePrice: p.baseRule.basePrice,
        glassPricePerM2: p.baseRule.glassPricePerM2,
        laborCost: '120',
        installationCost: '180',
        wastePercent: '5',
        marginPercent: '30',
      });
    }
  }

  console.log('[seed] Produtos + modelos + regras inseridos');
}

async function main() {
  console.log('[seed] Iniciando seed demo...');
  const tenant = await ensureDemoTenant();
  await ensureDemoUser(tenant.id);
  await ensureCatalog(tenant.id);
  console.log('[seed] OK');
  await pool.end();
}

main().catch((err) => {
  console.error('[seed] Falha:', err);
  process.exit(1);
});
