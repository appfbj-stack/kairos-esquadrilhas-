'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials, Glasses, type GlassKey } from './Materials';

export type Fachada3DProps = {
  widthMm: number;
  heightMm: number;
  /** numero de modulos horizontais */
  panelsH?: number;
  /** numero de pavimentos/linhas verticais */
  floors?: number;
  colorHex?: string;
  glassKey?: GlassKey;
};

/**
 * Fachada (curtain wall). Multiplos paineis de vidro em grade,
 * com perfis estruturais. Representa uma fachada inteira de edificio.
 */
export function Fachada3D({
  widthMm,
  heightMm,
  panelsH = 5,
  floors = 2,
  colorHex = '#6b7280',
  glassKey = 'reflectivo',
}: Fachada3DProps) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const profile = 0.05;
  const glassT = 0.012;

  const mat = useMemo(() => Materials.aluminium(colorHex, 0.85, 0.3), [colorHex]);
  const glass = Glasses[glassKey] ?? Glasses.incolor;
  const glassMat = useMemo(() => Materials.glass(glass.transmission, glass.color, glassT), [glass, glassT]);

  const colW = w / Math.max(panelsH, 1);
  const floorH = h / Math.max(floors, 1);

  return (
    <group>
      {/* Frame externo */}
      <mesh position={[0, h / 2, 0]} material={mat} castShadow>
        <boxGeometry args={[w, profile, profile * 1.5]} />
      </mesh>
      <mesh position={[0, -h / 2, 0]} material={mat} castShadow>
        <boxGeometry args={[w, profile, profile * 1.5]} />
      </mesh>
      <mesh position={[-w / 2, 0, 0]} material={mat} castShadow>
        <boxGeometry args={[profile, h, profile * 1.5]} />
      </mesh>
      <mesh position={[w / 2, 0, 0]} material={mat} castShadow>
        <boxGeometry args={[profile, h, profile * 1.5]} />
      </mesh>

      {/* Montantes verticais (entre paineis) */}
      {Array.from({ length: panelsH + 1 }).map((_, i) => {
        const x = -w / 2 + i * colW;
        return (
          <mesh key={`v${i}`} position={[x, 0, 0]} material={mat} castShadow>
            <boxGeometry args={[profile * 0.6, h, profile * 0.6]} />
          </mesh>
        );
      })}

      {/* Travessas horizontais (entre pavimentos) */}
      {Array.from({ length: floors + 1 }).map((_, i) => {
        const y = -h / 2 + i * floorH;
        return (
          <mesh key={`h${i}`} position={[0, y, 0]} material={mat} castShadow>
            <boxGeometry args={[w, profile * 0.6, profile * 0.6]} />
          </mesh>
        );
      })}

      {/* Paineis de vidro em cada celula */}
      {Array.from({ length: panelsH }).map((_, ci) =>
        Array.from({ length: floors }).map((_, fi) => {
          const x = -w / 2 + colW * ci + colW / 2;
          const y = -h / 2 + floorH * fi + floorH / 2;
          return (
            <mesh key={`g${ci}-${fi}`} position={[x, y, 0]} material={glassMat} castShadow>
              <boxGeometry args={[colW * 0.9, floorH * 0.9, glassT]} />
            </mesh>
          );
        })
      )}
    </group>
  );
}
