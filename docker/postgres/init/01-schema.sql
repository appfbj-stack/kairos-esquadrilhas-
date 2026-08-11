-- ============================================================
-- Kairos Esquadrias 3D — Schema inicial multi-tenant
-- Sprint 0: tabelas tenants, users, customers, products,
-- product_models, colors, glasses, accessories, price_rules,
-- projects, project_photos, project_accessories, quotes,
-- proposals, files, settings.
--
-- IMPORTANTE: Este arquivo e executado APENAS na primeira
-- inicializacao do container postgres (volume limpo). Em
-- producao usamos migrations Drizzle (pnpm db:migrate).
-- ============================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Enums
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('admin', 'vendedor', 'producao');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'rascunho','orcamento','enviado','aguardando_cliente',
    'aprovado','em_producao','instalacao','concluido','cancelado'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE product_category AS ENUM (
    'janela','porta','box','guarda_corpo','corrimao',
    'fechamento','fachada','divisoria','outro'
  );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE price_rule_type AS ENUM ('por_m2','por_metro_linear','por_unidade','custom');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL,
  name text NOT NULL,
  legal_name text,
  cnpj text,
  phone text,
  whatsapp text,
  email text,
  address text,
  logo_url text,
  primary_color text DEFAULT '#0f172a',
  payment_terms text,
  warranty text,
  proposal_validity_days integer DEFAULT 15,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS tenants_slug_idx ON tenants(slug);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text NOT NULL,
  password_hash text,
  role user_role NOT NULL DEFAULT 'vendedor',
  avatar_url text,
  is_demo boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS users_tenant_email_idx ON users(tenant_id, email);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text,
  whatsapp text,
  email text,
  address text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS customers_tenant_name_idx ON customers(tenant_id, name);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  category product_category NOT NULL,
  name text NOT NULL,
  description text,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS products_tenant_idx ON products(tenant_id);

CREATE TABLE IF NOT EXISTS product_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  min_width_mm integer DEFAULT 200,
  max_width_mm integer DEFAULT 6000,
  min_height_mm integer DEFAULT 200,
  max_height_mm integer DEFAULT 6000,
  default_leaves integer DEFAULT 2,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_models_product_idx ON product_models(product_id);

-- Options
CREATE TABLE IF NOT EXISTS colors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  hex text NOT NULL,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS glasses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  type text NOT NULL,
  transmission numeric(4,2),
  thickness numeric(4,1),
  price_per_m2 numeric(12,2),
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS accessories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text NOT NULL,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS price_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  model_id uuid REFERENCES product_models(id) ON DELETE CASCADE,
  rule_type price_rule_type NOT NULL DEFAULT 'por_m2',
  base_price numeric(12,2) NOT NULL DEFAULT 0,
  glass_price_per_m2 numeric(12,2) DEFAULT 0,
  hardware_cost numeric(12,2) DEFAULT 0,
  labor_cost numeric(12,2) DEFAULT 0,
  installation_cost numeric(12,2) DEFAULT 0,
  waste_percent numeric(5,2) DEFAULT 5,
  margin_percent numeric(5,2) DEFAULT 30,
  extras jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Projects
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  created_by uuid REFERENCES users(id) ON DELETE SET NULL,
  code text NOT NULL,
  title text NOT NULL,
  status project_status NOT NULL DEFAULT 'rascunho',
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  model_id uuid REFERENCES product_models(id) ON DELETE SET NULL,
  width_mm integer,
  height_mm integer,
  depth_mm integer,
  modules_count integer,
  leaves_count integer,
  color_id uuid REFERENCES colors(id) ON DELETE SET NULL,
  glass_id uuid REFERENCES glasses(id) ON DELETE SET NULL,
  opening text,
  notes text,
  config jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS projects_tenant_idx ON projects(tenant_id);
CREATE UNIQUE INDEX IF NOT EXISTS projects_tenant_code_idx ON projects(tenant_id, code);

CREATE TABLE IF NOT EXISTS project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  url text NOT NULL,
  path text NOT NULL,
  kind text NOT NULL DEFAULT 'ambiente',
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS project_accessories (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  accessory_id uuid NOT NULL REFERENCES accessories(id) ON DELETE CASCADE,
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL,
  PRIMARY KEY (project_id, accessory_id)
);

-- Quotes / Proposals
CREATE TABLE IF NOT EXISTS quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  number text NOT NULL,
  materials_total numeric(12,2) NOT NULL DEFAULT 0,
  glass_total numeric(12,2) NOT NULL DEFAULT 0,
  hardware_total numeric(12,2) NOT NULL DEFAULT 0,
  labor_total numeric(12,2) NOT NULL DEFAULT 0,
  installation_total numeric(12,2) NOT NULL DEFAULT 0,
  waste_total numeric(12,2) NOT NULL DEFAULT 0,
  margin_total numeric(12,2) NOT NULL DEFAULT 0,
  extras_total numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  breakdown jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  quote_id uuid NOT NULL REFERENCES quotes(id) ON DELETE CASCADE,
  number text NOT NULL,
  pdf_url text,
  valid_until timestamptz,
  status text NOT NULL DEFAULT 'gerada',
  sent_via text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  path text NOT NULL,
  url text NOT NULL,
  mime text NOT NULL,
  size integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS settings (
  tenant_id uuid NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb DEFAULT '{}'::jsonb,
  PRIMARY KEY (tenant_id, key)
);

-- ============================================================
-- Row Level Security (multi-tenant)
-- Sessao do app seta: SET LOCAL app.tenant_id = '<uuid>';
-- ============================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE colors ENABLE ROW LEVEL SECURITY;
ALTER TABLE glasses ENABLE ROW LEVEL SECURITY;
ALTER TABLE accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_accessories ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Politica padrao: usuario so ve/alter dados do proprio tenant_id.
-- O tenant_id vem do JWT/claim (app.tenant_id) que sera setado
-- por uma funcao de sessao no app (Sprint 1).
--
-- Para o MVP, como o driver Drizzle ja filtra por tenant_id nas
-- queries, deixamos as policies como permissivas para o role
-- da aplicacao (owner do banco). Isso ainda isola via app.
-- Quando integrarmos Auth.js, trocaremos por policies estritas
-- baseadas em current_setting('app.tenant_id').

DO $$ BEGIN
  EXECUTE 'CREATE POLICY tenant_isolation ON tenants USING (true) WITH CHECK (true)';
EXCEPTION WHEN duplicate_object THEN null; END $$;
