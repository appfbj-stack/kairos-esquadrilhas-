/**
 * Motor de preco do Kairos Esquadrilhas (Sprint 7 basico).
 *
 * Estrategia:
 *  - por m2: basePrice * area + glassArea * glassPricePerM2 + extras
 *  - por_metro_linear: basePrice * comprimento + glassArea * glassPricePerM2
 *  - por_unidade: basePrice * quantidade + extras
 *  - custom: soma de itens do JSON `extras`
 *
 * Aplica: desperdicio (wastePercent sobre materiais) + margem (marginPercent sobre subtotal).
 * Adiciona custos fixos: mao de obra (labor) + instalacao.
 */

export type PriceInput = {
  widthMm: number | null;
  heightMm: number | null;
  depthMm?: number | null;
  modules?: number | null;
  leaves?: number | null;
  rule: {
    ruleType: 'por_m2' | 'por_metro_linear' | 'por_unidade' | 'custom';
    basePrice: string | number;
    glassPricePerM2?: string | number | null;
    hardwareCost?: string | number | null;
    laborCost?: string | number | null;
    installationCost?: string | number | null;
    wastePercent?: string | number | null;
    marginPercent?: string | number | null;
    extras?: Record<string, any> | null;
  } | null;
};

export type PriceBreakdown = {
  areaM2: number;
  perimeterM: number;
  rule: string;
  baseMaterials: number;
  glass: number;
  hardware: number;
  labor: number;
  installation: number;
  waste: number;
  subtotal: number;
  margin: number;
  total: number;
  totalWithExtras: number;
};

export type PriceResult = {
  materialsTotal: number;
  glassTotal: number;
  hardwareTotal: number;
  laborTotal: number;
  installationTotal: number;
  wasteTotal: number;
  marginTotal: number;
  extrasTotal: number;
  total: number;
  breakdown: PriceBreakdown;
};

function n(v: string | number | null | undefined): number {
  if (v == null) return 0;
  const x = typeof v === 'string' ? Number(v) : v;
  return Number.isFinite(x) ? x : 0;
}

export function calculatePrice(input: PriceInput): PriceResult {
  const { widthMm, heightMm, depthMm, modules, leaves, rule } = input;
  const w = n(widthMm) / 1000;
  const h = n(heightMm) / 1000;
  const d = n(depthMm) / 1000;
  const areaM2 = w * h;
  const perimeterM = 2 * (w + h);

  // Sem regra definida, retorna zero
  if (!rule) {
    return {
      materialsTotal: 0,
      glassTotal: 0,
      hardwareTotal: 0,
      laborTotal: 0,
      installationTotal: 0,
      wasteTotal: 0,
      marginTotal: 0,
      extrasTotal: 0,
      total: 0,
      breakdown: {
        areaM2: round(areaM2, 2),
        perimeterM: round(perimeterM, 2),
        rule: 'sem-regra',
        baseMaterials: 0,
        glass: 0,
        hardware: 0,
        labor: 0,
        installation: 0,
        waste: 0,
        subtotal: 0,
        margin: 0,
        total: 0,
        totalWithExtras: 0,
      },
    };
  }

  const base = n(rule.basePrice);
  const glassPerM2 = n(rule.glassPricePerM2);
  const hardware = n(rule.hardwareCost);
  const labor = n(rule.laborCost);
  const installation = n(rule.installationCost);
  const wastePct = n(rule.wastePercent) || 0;
  const marginPct = n(rule.marginPercent) || 0;

  // Materiais base
  let baseMaterials = 0;
  if (rule.ruleType === 'por_m2') {
    baseMaterials = base * areaM2;
  } else if (rule.ruleType === 'por_metro_linear') {
    baseMaterials = base * Math.max(w, perimeterM);
  } else if (rule.ruleType === 'por_unidade') {
    const qty = n(leaves) || n(modules) || 1;
    baseMaterials = base * qty;
  } else {
    // custom: extras somam
    baseMaterials = 0;
  }

  // Vidro (m2 de area)
  const glass = glassPerM2 * areaM2;

  // Subtotal (materiais + vidro + hardware)
  const subtotalBeforeWaste = baseMaterials + glass + hardware;

  // Desperdicio (sobre materiais)
  const waste = subtotalBeforeWaste * (wastePct / 100);

  // Subtotal final (com mao de obra + instalacao)
  const subtotal = subtotalBeforeWaste + waste + labor + installation;

  // Margem
  const margin = subtotal * (marginPct / 100);

  // Extras (custom)
  let extrasTotal = 0;
  if (rule.extras && typeof rule.extras === 'object') {
    for (const v of Object.values(rule.extras)) {
      if (typeof v === 'number') extrasTotal += v;
      else if (typeof v === 'string') extrasTotal += n(v);
    }
  }

  const total = subtotal + margin + extrasTotal;

  return {
    materialsTotal: round(baseMaterials, 2),
    glassTotal: round(glass, 2),
    hardwareTotal: round(hardware, 2),
    laborTotal: round(labor, 2),
    installationTotal: round(installation, 2),
    wasteTotal: round(waste, 2),
    marginTotal: round(margin, 2),
    extrasTotal: round(extrasTotal, 2),
    total: round(total, 2),
    breakdown: {
      areaM2: round(areaM2, 2),
      perimeterM: round(perimeterM, 2),
      rule: rule.ruleType,
      baseMaterials: round(baseMaterials, 2),
      glass: round(glass, 2),
      hardware: round(hardware, 2),
      labor: round(labor, 2),
      installation: round(installation, 2),
      waste: round(waste, 2),
      subtotal: round(subtotal, 2),
      margin: round(margin, 2),
      total: round(total, 2),
      totalWithExtras: round(total + extrasTotal, 2),
    },
  };
}

function round(v: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(v * f) / f;
}
