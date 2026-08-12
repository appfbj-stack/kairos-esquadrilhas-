'use client';

import dynamic from 'next/dynamic';
import type { ProductKind, GlassKey } from '@/components/viewer3d';

const ProductViewer = dynamic(
  () => import('@/components/viewer3d/ProductViewer').then((m) => m.ProductViewer),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-full w-full place-items-center rounded-lg border bg-slate-100 text-sm text-muted-foreground">
        Carregando 3D...
      </div>
    ),
  }
);

export function ProjectViewer3D(props: {
  kind: ProductKind;
  widthMm: number;
  heightMm: number;
  depthMm?: number | null;
  modules?: number | null;
  leaves?: number | null;
  opening?: string;
  colorHex?: string;
  glassKey?: GlassKey;
}) {
  return (
    <ProductViewer
      kind={props.kind}
      widthMm={props.widthMm}
      heightMm={props.heightMm}
      depthMm={props.depthMm ?? undefined}
      modules={props.modules ?? undefined}
      leaves={props.leaves ?? undefined}
      subtype={props.opening}
      colorHex={props.colorHex}
      glassKey={props.glassKey}
    />
  );
}
