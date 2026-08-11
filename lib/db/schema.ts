import {
  pgTable,
  text,
  timestamp,
  pgEnum,
  uuid,
  integer,
  numeric,
  boolean,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// ============================================================
// Enums
// ============================================================

export const userRole = pgEnum('user_role', ['admin', 'vendedor', 'producao']);
export const projectStatus = pgEnum('project_status', [
  'rascunho',
  'orcamento',
  'enviado',
  'aguardando_cliente',
  'aprovado',
  'em_producao',
  'instalacao',
  'concluido',
  'cancelado',
]);
export const productCategory = pgEnum('product_category', [
  'janela',
  'porta',
  'box',
  'guarda_corpo',
  'corrimao',
  'fechamento',
  'fachada',
  'divisoria',
  'outro',
]);
export const priceRuleType = pgEnum('price_rule_type', [
  'por_m2',
  'por_metro_linear',
  'por_unidade',
  'custom',
]);

// ============================================================
// Tenants
// ============================================================

export const tenants = pgTable(
  'tenants',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    slug: text('slug').notNull(),
    name: text('name').notNull(),
    legalName: text('legal_name'),
    cnpj: text('cnpj'),
    phone: text('phone'),
    whatsapp: text('whatsapp'),
    email: text('email'),
    address: text('address'),
    logoUrl: text('logo_url'),
    primaryColor: text('primary_color').default('#0f172a'),
    paymentTerms: text('payment_terms'),
    warranty: text('warranty'),
    proposalValidityDays: integer('proposal_validity_days').default(15),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    slugIdx: uniqueIndex('tenants_slug_idx').on(t.slug),
  })
);

// ============================================================
// Users
// ============================================================

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    name: text('name').notNull(),
    passwordHash: text('password_hash'),
    role: userRole('role').notNull().default('vendedor'),
    avatarUrl: text('avatar_url'),
    isDemo: boolean('is_demo').notNull().default(false),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    emailIdx: uniqueIndex('users_tenant_email_idx').on(t.tenantId, t.email),
  })
);

// ============================================================
// Customers (clientes da empresa)
// ============================================================

export const customers = pgTable(
  'customers',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    phone: text('phone'),
    whatsapp: text('whatsapp'),
    email: text('email'),
    address: text('address'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameIdx: index('customers_tenant_name_idx').on(t.tenantId, t.name),
  })
);

// ============================================================
// Products (catalogo)
// ============================================================

export const products = pgTable(
  'products',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    category: productCategory('category').notNull(),
    name: text('name').notNull(),
    description: text('description'),
    imageUrl: text('image_url'),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('products_tenant_idx').on(t.tenantId),
  })
);

export const productModels = pgTable(
  'product_models',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    productId: uuid('product_id')
      .notNull()
      .references(() => products.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    description: text('description'),
    minWidthMm: integer('min_width_mm').default(200),
    maxWidthMm: integer('max_width_mm').default(6000),
    minHeightMm: integer('min_height_mm').default(200),
    maxHeightMm: integer('max_height_mm').default(6000),
    defaultLeaves: integer('default_leaves').default(2),
    active: boolean('active').notNull().default(true),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    productIdx: index('product_models_product_idx').on(t.productId),
  })
);

// ============================================================
// Opcoes (cores, vidros, acessorios)
// ============================================================

export const colors = pgTable('colors', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  hex: text('hex').notNull(),
  active: boolean('active').notNull().default(true),
});

export const glasses = pgTable('glasses', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  type: text('type').notNull(), // incolor, fume, verde, bronze, reflectivo, temperado, laminado
  transmission: numeric('transmission', { precision: 4, scale: 2 }), // 0-1
  thickness: numeric('thickness', { precision: 4, scale: 1 }), // mm
  pricePerM2: numeric('price_per_m2', { precision: 12, scale: 2 }),
  active: boolean('active').notNull().default(true),
});

export const accessories = pgTable('accessories', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  category: text('category').notNull(), // puxador, fechadura, roldana, ferragem
  unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull().default('0'),
  active: boolean('active').notNull().default(true),
});

// ============================================================
// Regras de preco (motor de orcamento)
// ============================================================

export const priceRules = pgTable('price_rules', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  productId: uuid('product_id')
    .notNull()
    .references(() => products.id, { onDelete: 'cascade' }),
  modelId: uuid('model_id').references(() => productModels.id, { onDelete: 'cascade' }),
  ruleType: priceRuleType('rule_type').notNull().default('por_m2'),
  basePrice: numeric('base_price', { precision: 12, scale: 2 }).notNull().default('0'),
  glassPricePerM2: numeric('glass_price_per_m2', { precision: 12, scale: 2 }).default('0'),
  hardwareCost: numeric('hardware_cost', { precision: 12, scale: 2 }).default('0'),
  laborCost: numeric('labor_cost', { precision: 12, scale: 2 }).default('0'),
  installationCost: numeric('installation_cost', { precision: 12, scale: 2 }).default('0'),
  wastePercent: numeric('waste_percent', { precision: 5, scale: 2 }).default('5'),
  marginPercent: numeric('margin_percent', { precision: 5, scale: 2 }).default('30'),
  extras: jsonb('extras').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Projetos
// ============================================================

export const projects = pgTable(
  'projects',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    customerId: uuid('customer_id').references(() => customers.id, { onDelete: 'set null' }),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    code: text('code').notNull(),
    title: text('title').notNull(),
    status: projectStatus('status').notNull().default('rascunho'),
    productId: uuid('product_id').references(() => products.id, { onDelete: 'set null' }),
    modelId: uuid('model_id').references(() => productModels.id, { onDelete: 'set null' }),
    widthMm: integer('width_mm'),
    heightMm: integer('height_mm'),
    depthMm: integer('depth_mm'),
    modulesCount: integer('modules_count'),
    leavesCount: integer('leaves_count'),
    colorId: uuid('color_id').references(() => colors.id, { onDelete: 'set null' }),
    glassId: uuid('glass_id').references(() => glasses.id, { onDelete: 'set null' }),
    opening: text('opening'),
    notes: text('notes'),
    config: jsonb('config').default(sql`'{}'::jsonb`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index('projects_tenant_idx').on(t.tenantId),
    codeIdx: uniqueIndex('projects_tenant_code_idx').on(t.tenantId, t.code),
  })
);

export const projectPhotos = pgTable('project_photos', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  url: text('url').notNull(),
  path: text('path').notNull(),
  kind: text('kind').notNull().default('ambiente'), // ambiente, produto, montagem
  position: integer('position').notNull().default(0),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const projectAccessories = pgTable(
  'project_accessories',
  {
    projectId: uuid('project_id')
      .notNull()
      .references(() => projects.id, { onDelete: 'cascade' }),
    accessoryId: uuid('accessory_id')
      .notNull()
      .references(() => accessories.id, { onDelete: 'cascade' }),
    quantity: integer('quantity').notNull().default(1),
    unitPrice: numeric('unit_price', { precision: 12, scale: 2 }).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.projectId, t.accessoryId] }),
  })
);

// ============================================================
// Orcamentos / Propostas
// ============================================================

export const quotes = pgTable('quotes', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  projectId: uuid('project_id')
    .notNull()
    .references(() => projects.id, { onDelete: 'cascade' }),
  number: text('number').notNull(),
  materialsTotal: numeric('materials_total', { precision: 12, scale: 2 }).notNull().default('0'),
  glassTotal: numeric('glass_total', { precision: 12, scale: 2 }).notNull().default('0'),
  hardwareTotal: numeric('hardware_total', { precision: 12, scale: 2 }).notNull().default('0'),
  laborTotal: numeric('labor_total', { precision: 12, scale: 2 }).notNull().default('0'),
  installationTotal: numeric('installation_total', { precision: 12, scale: 2 }).notNull().default('0'),
  wasteTotal: numeric('waste_total', { precision: 12, scale: 2 }).notNull().default('0'),
  marginTotal: numeric('margin_total', { precision: 12, scale: 2 }).notNull().default('0'),
  extrasTotal: numeric('extras_total', { precision: 12, scale: 2 }).notNull().default('0'),
  discount: numeric('discount', { precision: 12, scale: 2 }).notNull().default('0'),
  total: numeric('total', { precision: 12, scale: 2 }).notNull().default('0'),
  breakdown: jsonb('breakdown').default(sql`'{}'::jsonb`),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const proposals = pgTable('proposals', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  quoteId: uuid('quote_id')
    .notNull()
    .references(() => quotes.id, { onDelete: 'cascade' }),
  number: text('number').notNull(),
  pdfUrl: text('pdf_url'),
  validUntil: timestamp('valid_until', { withTimezone: true }),
  status: text('status').notNull().default('gerada'), // gerada, enviada, aprovada, recusada
  sentVia: text('sent_via'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Files (storage simples)
// ============================================================

export const files = pgTable('files', {
  id: uuid('id').defaultRandom().primaryKey(),
  tenantId: uuid('tenant_id')
    .notNull()
    .references(() => tenants.id, { onDelete: 'cascade' }),
  path: text('path').notNull(),
  url: text('url').notNull(),
  mime: text('mime').notNull(),
  size: integer('size').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// Settings (chave/valor por tenant)
// ============================================================

export const settings = pgTable(
  'settings',
  {
    tenantId: uuid('tenant_id')
      .notNull()
      .references(() => tenants.id, { onDelete: 'cascade' }),
    key: text('key').notNull(),
    value: jsonb('value').default(sql`'{}'::jsonb`),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.tenantId, t.key] }),
  })
);

// ============================================================
// Relations
// ============================================================

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  customers: many(customers),
  products: many(products),
  projects: many(projects),
  quotes: many(quotes),
}));

export const usersRelations = relations(users, ({ one }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [customers.tenantId], references: [tenants.id] }),
  projects: many(projects),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  tenant: one(tenants, { fields: [products.tenantId], references: [tenants.id] }),
  models: many(productModels),
  priceRules: many(priceRules),
}));

export const productModelsRelations = relations(productModels, ({ one }) => ({
  product: one(products, { fields: [productModels.productId], references: [products.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  tenant: one(tenants, { fields: [projects.tenantId], references: [tenants.id] }),
  customer: one(customers, { fields: [projects.customerId], references: [customers.id] }),
  product: one(products, { fields: [projects.productId], references: [products.id] }),
  model: one(productModels, { fields: [projects.modelId], references: [productModels.id] }),
  color: one(colors, { fields: [projects.colorId], references: [colors.id] }),
  glass: one(glasses, { fields: [projects.glassId], references: [glasses.id] }),
  photos: many(projectPhotos),
  quote: many(quotes),
}));

export const projectPhotosRelations = relations(projectPhotos, ({ one }) => ({
  project: one(projects, { fields: [projectPhotos.projectId], references: [projects.id] }),
}));

export const quotesRelations = relations(quotes, ({ one }) => ({
  project: one(projects, { fields: [quotes.projectId], references: [projects.id] }),
  proposal: one(proposals, { fields: [quotes.id], references: [proposals.quoteId] }),
}));
