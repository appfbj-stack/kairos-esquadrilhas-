'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials, Glasses, type GlassKey } from './Materials';

export type Railing3DProps = {
  lengthMm: number; // comprimento linear
  heightMm?: number; // padrao 1100mm (norma)
  type?: 'vidro-aluminio' | 'vidro-estrutura' | 'aluminio';
  colorHex?: string;
  glassKey?: GlassKey;
  /** quantidade de modulos (pilares intermediarios) */
  modules?: number;
};

/**
 * Guarda-corpo. Painel de vidro com perfis estruturais.
 * - vidro-aluminio: travessas superior/inferior em aluminio
 * - vidro-estrutura: estrutura mais robusta com pilares
 * - aluminio: tubo superior + montantes verticais (sem vidro)
 */
export function Railing3D({
  lengthMm,
  heightMm = 1100,
  type = 'vidro-aluminio',
  colorHex = '#c0c0c0',
  glassKey = 'incolor',
  modules = 0,
}: Railing3DProps) {
  const l = lengthMm / 1000;
  const h = heightMm / 1000;
  const profile = 0.04;
  const tubeR = 0.025;
  const glassT = 0.01;
  const segCount = Math.max(modules, type === 'vidro-estrutura' ? 3 : 1);

  const mat = useMemo(() => Materials.aluminium(colorHex, 0.85, 0.35), [colorHex]);
  const glass = Glasses[glassKey] ?? Glasses.incolor;
  const glassMat = useMemo(() => Materials.glass(glass.transmission, glass.color, glassT), [glass, glassT]);

  const segLen = l / segCount;
  const segments = Array.from({ length: segCount });

  return (
    <group>
      {/* Travessa superior (cabo ou perfil) */}
      <mesh position={[0, h - profile / 2, 0]} material={mat} castShadow>
        {type === 'aluminio' ? (
          <cylinderGeometry args={[tubeR, tubeR, l, 16]} />
        ) : (
          <boxGeometry args={[l, profile, profile]} />
        )}
        {/* cylinder default axis Y; rotate to X */}
      </mesh>
      {type === 'aluminio' && (
        <group rotation={[0, 0, Math.PI / 2]}>
          <mesh position={[0, h - profile / 2, 0]} material={mat} castShadow>
            <cylinderGeometry args={[tubeR, tubeR, l, 16]} />
          </mesh>
        </group>
      )}

      {/* Travessa inferior */}
      {type !== 'aluminio' && (
        <mesh position={[0, profile / 2, 0]} material={mat} castShadow>
          <boxGeometry args={[l, profile, profile]} />
        </mesh>
      )}

      {/* Pilares/pontos de fixacao (nas extremidades e entre modulos) */}
      {Array.from({ length: segCount + 1 }).map((_, i) => {
        const x = -l / 2 + i * segLen;
        return (
          <group key={i} position={[x, h / 2, 0]}>
            {/* Pilar */}
            <mesh material={mat} castShadow>
              <boxGeometry args={[profile * 1.2, h, profile * 1.2]} />
            </mesh>
          </group>
        );
      })}

      {/* Vidro (apenas nos tipos com vidro) */}
      {type !== 'aluminio' &&
        segments.map((_, i) => {
          const x = -l / 2 + segLen * i + segLen / 2;
          return (
            <mesh key={i} position={[x, h / 2, 0]} material={glassMat} castShadow>
              <boxGeometry args={[segLen * 0.92, h * 0.85, glassT]} />
            </mesh>
          );
        })}

      {/* Montantes verticais (para aluminio sem vidro) */}
      {type === 'aluminio' &&
        Array.from({ length: Math.max(2, Math.floor(l / 0.15)) }).map((_, i, arr) => {
          const x = -l / 2 + (i / (arr.length - 1)) * l;
          return (
            <mesh key={i} position={[x, h / 2, 0]} material={mat} castShadow>
              <boxGeometry args={[0.015, h - 0.05, 0.015]} />
            </mesh>
          );
        })}
    </group>
  );
}
