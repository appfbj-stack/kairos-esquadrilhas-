'use client';

import dynamic from 'next/dynamic';
import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Colors, Glasses } from '@/components/viewer3d/Materials';
import type { ProductKind } from '@/components/viewer3d';

const ProductViewer = dynamic(
  () => import('@/components/viewer3d/ProductViewer').then((m) => m.ProductViewer),
  { ssr: false, loading: () => <div className="grid h-full place-items-center text-sm text-muted-foreground">Carregando 3D...</div> }
);

type DemoOption = { label: string; value: string };

type ProductDef = {
  kind: ProductKind;
  title: string;
  desc: string;
  defaults: {
    widthMm: number;
    heightMm: number;
    depthMm?: number;
    modules?: number;
    floors?: number;
    leaves?: number;
    subtype?: string;
  };
  controls: { field: string; label: string; options: DemoOption[] }[];
};

const PRODUCTS: ProductDef[] = [
  {
    kind: 'janela',
    title: 'Janela de correr',
    desc: '2 a 4 folhas, vidro temperado opcional',
    defaults: { widthMm: 2000, heightMm: 1200, leaves: 2, subtype: 'correr' },
    controls: [
      { field: 'widthMm', label: 'Largura (mm)', options: [{ label: '1.5m', value: '1500' }, { label: '2.0m', value: '2000' }, { label: '2.5m', value: '2500' }, { label: '3.0m', value: '3000' }] },
      { field: 'heightMm', label: 'Altura (mm)', options: [{ label: '1.0m', value: '1000' }, { label: '1.2m', value: '1200' }, { label: '1.5m', value: '1500' }] },
      { field: 'leaves', label: 'Folhas', options: [{ label: '2', value: '2' }, { label: '3', value: '3' }, { label: '4', value: '4' }] },
      { field: 'subtype', label: 'Abertura', options: [{ label: 'Correr', value: 'correr' }, { label: 'Maxim-ar', value: 'maxim-ar' }, { label: 'Basculante', value: 'basculante' }] },
    ],
  },
  {
    kind: 'porta',
    title: 'Porta de abrir',
    desc: '1 ou 2 folhas, com ou sem vidro',
    defaults: { widthMm: 900, heightMm: 2100, leaves: 1, subtype: 'abrir' },
    controls: [
      { field: 'widthMm', label: 'Largura (mm)', options: [{ label: '0.80m', value: '800' }, { label: '0.90m', value: '900' }, { label: '1.20m', value: '1200' }, { label: '1.60m', value: '1600' }] },
      { field: 'leaves', label: 'Folhas', options: [{ label: '1', value: '1' }, { label: '2', value: '2' }] },
      { field: 'subtype', label: 'Tipo', options: [{ label: 'Abrir', value: 'abrir' }, { label: 'Correr', value: 'correr' }, { label: 'Pivotante', value: 'pivotante' }] },
    ],
  },
  {
    kind: 'box',
    title: 'Box de banheiro',
    desc: 'Frontal, canto ou ate o teto',
    defaults: { widthMm: 1800, heightMm: 2000, depthMm: 800, subtype: 'frontal' },
    controls: [
      { field: 'subtype', label: 'Tipo', options: [{ label: 'Frontal', value: 'frontal' }, { label: 'Canto', value: 'canto' }, { label: 'Ate o teto', value: 'teto' }] },
      { field: 'widthMm', label: 'Largura (mm)', options: [{ label: '1.4m', value: '1400' }, { label: '1.8m', value: '1800' }, { label: '2.2m', value: '2200' }] },
    ],
  },
  {
    kind: 'guarda_corpo',
    title: 'Guarda-corpo',
    desc: 'Vidro com perfis de aluminio',
    defaults: { widthMm: 3000, heightMm: 1100, subtype: 'vidro-aluminio', modules: 0 },
    controls: [
      { field: 'subtype', label: 'Tipo', options: [{ label: 'Vidro + Alum.', value: 'vidro-aluminio' }, { label: 'Vidro + Estrutura', value: 'vidro-estrutura' }, { label: 'Aluminio (sem vidro)', value: 'aluminio' }] },
      { field: 'widthMm', label: 'Comprimento (mm)', options: [{ label: '2.0m', value: '2000' }, { label: '3.0m', value: '3000' }, { label: '4.0m', value: '4000' }] },
    ],
  },
  {
    kind: 'corrimao',
    title: 'Corrimao',
    desc: 'Tubo com suportes',
    defaults: { widthMm: 3000, heightMm: 900, subtype: 'tubular' },
    controls: [
      { field: 'subtype', label: 'Perfil', options: [{ label: 'Tubular', value: 'tubular' }, { label: 'Retangular', value: 'retangular' }] },
      { field: 'widthMm', label: 'Comprimento (mm)', options: [{ label: '1.5m', value: '1500' }, { label: '3.0m', value: '3000' }, { label: '5.0m', value: '5000' }] },
    ],
  },
  {
    kind: 'fechamento',
    title: 'Fechamento de sacada',
    desc: 'Vidro temperado full-glass',
    defaults: { widthMm: 4000, heightMm: 2500, modules: 4 },
    controls: [
      { field: 'modules', label: 'Modulos', options: [{ label: '3', value: '3' }, { label: '4', value: '4' }, { label: '5', value: '5' }, { label: '6', value: '6' }] },
      { field: 'widthMm', label: 'Largura total (mm)', options: [{ label: '3.0m', value: '3000' }, { label: '4.0m', value: '4000' }, { label: '5.0m', value: '5000' }] },
    ],
  },
  {
    kind: 'fachada',
    title: 'Fachada (curtain wall)',
    desc: 'Multiplos paineis em grade',
    defaults: { widthMm: 5000, heightMm: 3000, modules: 5, floors: 2 },
    controls: [
      { field: 'modules', label: 'Paineis (horizontal)', options: [{ label: '3', value: '3' }, { label: '5', value: '5' }, { label: '7', value: '7' }] },
      { field: 'floors', label: 'Pavimentos', options: [{ label: '1', value: '1' }, { label: '2', value: '2' }, { label: '3', value: '3' }] },
    ],
  },
];

const COLOR_OPTIONS = [
  { label: 'Preto', value: Colors.preto },
  { label: 'Branco', value: Colors.branco },
  { label: 'Bronze', value: Colors.bronze },
  { label: 'Natural', value: Colors.natural },
  { label: 'Cinza', value: Colors.cinza },
];

const GLASS_OPTIONS = [
  { label: 'Incolor', value: 'incolor' as const },
  { label: 'Fume', value: 'fume' as const },
  { label: 'Verde', value: 'verde' as const },
  { label: 'Bronze', value: 'bronze' as const },
  { label: 'Temperado', value: 'temperado' as const },
  { label: 'Reflectivo', value: 'reflectivo' as const },
];

export default function Demo3DPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const active = PRODUCTS[activeIdx];

  // Estado dos parametros
  const [params, setParams] = useState<Record<string, string | number>>(() => ({ ...active.defaults }));
  const [colorHex, setColorHex] = useState<string>(Colors.preto);
  const [glassKey, setGlassKey] = useState<keyof typeof Glasses>('incolor');

  function setParam(field: string, value: string) {
    setParams((p) => ({ ...p, [field]: Number.isNaN(+value) ? value : +value }));
  }

  function switchProduct(idx: number) {
    setActiveIdx(idx);
    setParams({ ...PRODUCTS[idx].defaults });
  }

  const props: any = {
    kind: active.kind,
    widthMm: params.widthMm,
    heightMm: params.heightMm,
    depthMm: params.depthMm,
    modules: params.modules,
    floors: params.floors,
    leaves: params.leaves,
    subtype: params.subtype,
    colorHex,
    glassKey,
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="text-muted-foreground hover:text-foreground">
          <ChevronLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Demo 3D</h1>
          <p className="text-sm text-muted-foreground">Todos os produtos do catalogo em tempo real</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {PRODUCTS.map((p, i) => (
          <Button
            key={p.kind}
            variant={i === activeIdx ? 'default' : 'outline'}
            size="sm"
            onClick={() => switchProduct(i)}
          >
            {p.title}
          </Button>
        ))}
      </div>

      <div className="aspect-square w-full sm:aspect-[16/10]">
        <ProductViewer {...props} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">{active.title}</CardTitle>
          <p className="text-sm text-muted-foreground">{active.desc}</p>
        </CardHeader>
        <CardContent className="space-y-5">
          {active.controls.map((c) => (
            <div key={c.field} className="space-y-2">
              <label className="text-sm font-medium">{c.label}</label>
              <div className="flex flex-wrap gap-2">
                {c.options.map((o) => {
                  const current = String(params[c.field] ?? '');
                  return (
                    <Button
                      key={o.value}
                      variant={current === o.value ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setParam(c.field, o.value)}
                    >
                      {o.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="space-y-2">
            <label className="text-sm font-medium">Cor do perfil</label>
            <div className="flex flex-wrap gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColorHex(c.value)}
                  className={`flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm ${
                    colorHex === c.value ? 'border-primary bg-primary/5' : 'border-input'
                  }`}
                  aria-pressed={colorHex === c.value}
                >
                  <span className="inline-block h-4 w-4 rounded-full border" style={{ background: c.value }} />
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Vidro</label>
            <div className="flex flex-wrap gap-2">
              {GLASS_OPTIONS.map((g) => (
                <Button
                  key={g.value}
                  variant={glassKey === g.value ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setGlassKey(g.value)}
                >
                  {g.label}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
