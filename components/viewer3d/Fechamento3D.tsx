'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials, Glasses, type GlassKey } from './Materials';

export type Fechamento3DProps = {
  widthMm: number;
  heightMm: number;
  /** numero de modulos/paineis */
  modules?: number;
  colorHex?: string;
  glassKey?: GlassKey;
};

/**
 * Fechamento de sacada/varanda full glass.
 * Paineis de vidro temperado do chao ao teto com perfis minimos.
 */
export function Fechamento3D({
  widthMm,
  heightMm,
  modules = 4,
  colorHex = '#0a0a0a',
  glassKey = 'incolor',
}: Fechamento3DProps) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const profile = 0.04;
  const glassT = 0.01;

  const mat = useMemo(() => Materials.aluminium(colorHex, 0.85, 0.3), [colorHex]);
  const glass = Glasses[glassKey] ?? Glasses.incolor;
  const glassMat = useMemo(() => Materials.glass(glass.transmission, glass.color, glassT), [glass, glassT]);

  const segCount = Math.max(1, modules);
  const segLen = w / segCount;
  const segments = Array.from({ length: segCount });

  return (
    <group>
      {/* Trilho inferior (no chao) */}
      <mesh position={[0, profile / 2, 0]} material={mat} castShadow>
        <boxGeometry args={[w, profile, profile]} />
      </mesh>
      {/* Trilho superior (no teto) */}
      <mesh position={[0, h - profile / 2, 0]} material={mat} castShadow>
        <boxGeometry args={[w, profile, profile]} />
      </mesh>

      {/* Paineis de vidro entre modulos */}
      {segments.map((_, i) => {
        const x = -w / 2 + segLen * i + segLen / 2;
        return (
          <mesh key={i} position={[x, h / 2, 0]} material={glassMat} castShadow>
            <boxGeometry args={[segLen * 0.95, h - profile * 2.2, glassT]} />
          </mesh>
        );
      })}

      {/* Pilares/montantes entre modulos */}
      {Array.from({ length: segCount + 1 }).map((_, i) => {
        const x = -w / 2 + i * segLen;
        return (
          <mesh key={i} position={[x, h / 2, 0]} material={mat} castShadow>
            <boxGeometry args={[profile * 0.8, h, profile * 0.8]} />
          </mesh>
        );
      })}
    </group>
  );
}
