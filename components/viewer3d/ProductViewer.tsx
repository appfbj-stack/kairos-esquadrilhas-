'use client';

import { Canvas } from '@react-three/fiber';
import { Suspense } from 'react';
import { Window3D } from './Window3D';
import { Door3D } from './Door3D';
import { Box3D } from './Box3D';
import { Railing3D } from './Railing3D';
import { Handrail3D } from './Handrail3D';
import { Fechamento3D } from './Fechamento3D';
import { Fachada3D } from './Fachada3D';
import { SceneCommon } from './Common';
import type { GlassKey } from './Materials';

export type ProductKind =
  | 'janela'
  | 'porta'
  | 'box'
  | 'guarda_corpo'
  | 'corrimao'
  | 'fechamento'
  | 'fachada'
  | 'divisoria';

export type ProductViewerProps = {
  kind: ProductKind;
  widthMm: number;
  heightMm: number;
  depthMm?: number;
  modules?: number;
  floors?: number;
  leaves?: number;
  colorHex?: string;
  glassKey?: GlassKey;
  /** sub-tipo (ex: 'canto' para box, 'pivotante' para porta) */
  subtype?: string;
};

/**
 * Switcher 3D do Kairos Esquadrilhas. Cada `kind` tem seu componente dedicado.
 * Dimensoes em milimetros (convertidas para metros dentro de cada componente).
 */
export function ProductViewer(props: ProductViewerProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border bg-gradient-to-b from-slate-100 to-slate-200">
      <Canvas shadows camera={{ position: [2.5, 1.6, 3], fov: 45 }}>
        <Suspense fallback={null}>
          <SceneCommon>
            {props.kind === 'janela' && (
              <Window3D
                widthMm={props.widthMm}
                heightMm={props.heightMm}
                leaves={props.leaves ?? 2}
                colorHex={props.colorHex}
                glassKey={props.glassKey}
                opening={(props.subtype as 'correr' | 'maxim-ar' | 'basculante' | 'fixa') ?? 'correr'}
              />
            )}
            {props.kind === 'porta' && (
              <Door3D
                widthMm={props.widthMm}
                heightMm={props.heightMm}
                leaves={(props.leaves === 2 ? 2 : 1) as 1 | 2}
                colorHex={props.colorHex}
                glassKey={props.glassKey}
                opening={(props.subtype as 'abrir' | 'correr' | 'pivotante') ?? 'abrir'}
              />
            )}
            {props.kind === 'box' && (
              <Box3D
                widthMm={props.widthMm}
                heightMm={props.heightMm}
                depthMm={props.depthMm ?? 800}
                type={(props.subtype as 'frontal' | 'canto' | 'teto') ?? 'frontal'}
                colorHex={props.colorHex}
                glassKey={props.glassKey}
              />
            )}
            {props.kind === 'guarda_corpo' && (
              <Railing3D
                lengthMm={props.widthMm}
                heightMm={props.heightMm}
                type={(props.subtype as 'vidro-aluminio' | 'vidro-estrutura' | 'aluminio') ?? 'vidro-aluminio'}
                colorHex={props.colorHex}
                glassKey={props.glassKey}
                modules={props.modules ?? 0}
              />
            )}
            {props.kind === 'corrimao' && (
              <Handrail3D
                lengthMm={props.widthMm}
                heightMm={props.heightMm}
                colorHex={props.colorHex}
                profile={(props.subtype as 'tubular' | 'retangular') ?? 'tubular'}
              />
            )}
            {props.kind === 'fechamento' && (
              <Fechamento3D
                widthMm={props.widthMm}
                heightMm={props.heightMm}
                modules={props.modules ?? 4}
                colorHex={props.colorHex}
                glassKey={props.glassKey}
              />
            )}
            {props.kind === 'fachada' && (
              <Fachada3D
                widthMm={props.widthMm}
                heightMm={props.heightMm}
                panelsH={props.modules ?? 5}
                floors={props.floors ?? 2}
                colorHex={props.colorHex}
                glassKey={props.glassKey}
              />
            )}
          </SceneCommon>
        </Suspense>
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-muted-foreground">
        <span>
          {props.widthMm}mm × {props.heightMm}mm
          {props.depthMm ? ` × ${props.depthMm}mm` : ''}
        </span>
        <span>1 dedo gira · 2 dedos zoom</span>
      </div>
    </div>
  );
}
