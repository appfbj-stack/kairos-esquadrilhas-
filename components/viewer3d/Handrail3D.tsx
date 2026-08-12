'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials } from './Materials';

export type Handrail3DProps = {
  lengthMm: number;
  heightMm?: number; // padrao 900mm
  colorHex?: string;
  /** 'tubular' | 'retangular' */
  profile?: 'tubular' | 'retangular';
  showBrackets?: boolean;
};

/**
 * Corrimao simples. Tubo horizontal fixado por suportes na parede.
 */
export function Handrail3D({
  lengthMm,
  heightMm = 900,
  colorHex = '#c0c0c0',
  profile = 'tubular',
  showBrackets = true,
}: Handrail3DProps) {
  const l = lengthMm / 1000;
  const h = heightMm / 1000;
  const tubeR = 0.03;
  const profileW = 0.04;
  const profileD = 0.025;

  const mat = useMemo(() => Materials.aluminium(colorHex, 0.85, 0.3), [colorHex]);
  const bracketMat = useMemo(() => Materials.aluminium('#6b7280', 0.7, 0.4), []);

  return (
    <group>
      {/* Barra principal (cilindro ou retangulo) ao longo do eixo X */}
      <group position={[0, h, 0]} rotation={[0, 0, Math.PI / 2]}>
        <mesh material={mat} castShadow>
          {profile === 'tubular' ? (
            <cylinderGeometry args={[tubeR, tubeR, l, 20]} />
          ) : (
            <boxGeometry args={[l, profileW, profileD]} />
          )}
        </mesh>
      </group>

      {/* Suportes (brackets) */}
      {showBrackets &&
        Array.from({ length: Math.max(2, Math.floor(l / 0.6) + 1) }).map((_, i, arr) => {
          const x = -l / 2 + (i / (arr.length - 1)) * l;
          return (
            <group key={i} position={[x, h - 0.08, 0]}>
              {/* Haste do suporte */}
              <mesh material={bracketMat}>
                <boxGeometry args={[0.02, 0.16, 0.1]} />
              </mesh>
              {/* Coneccao com a parede (fundo) */}
              <mesh position={[0, -0.06, -0.04]} material={bracketMat}>
                <cylinderGeometry args={[0.02, 0.02, 0.04, 12]} />
              </mesh>
            </group>
          );
        })}
    </group>
  );
}
