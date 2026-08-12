'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials, Glasses, type ColorKey, type GlassKey } from './Materials';

export type Window3DProps = {
  widthMm: number;
  heightMm: number;
  leaves?: number; // 2 | 3 | 4
  colorHex?: string;
  glassKey?: GlassKey;
  /** tipo de abertura: 'correr' | 'maxim-ar' | 'basculante' | 'fixa' */
  opening?: 'correr' | 'maxim-ar' | 'basculante' | 'fixa';
  /** mostra trilho inferior (correr) ou nao */
  showTrack?: boolean;
};

/**
 * Janela de aluminio parametrizada. Estrutura:
 *  - Frame externo (4 perfis)
 *  - N folhas internas com perfil proprio + vidro
 *  - Puxador central em cada folha
 *  - Trilho inferior (correr) ou frame duplo (maxim-ar/basculante)
 */
export function Window3D({
  widthMm,
  heightMm,
  leaves = 2,
  colorHex = '#0a0a0a',
  glassKey = 'incolor',
  opening = 'correr',
  showTrack = true,
}: Window3DProps) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const profile = 0.05;
  const glassT = 0.02;
  const innerW = w - profile * 2;
  const innerH = h - profile * 2;
  const leafW = innerW / Math.max(leaves, 1);

  const frameMat = useMemo(() => Materials.aluminium(colorHex), [colorHex]);
  const handleMat = useMemo(() => Materials.aluminium('#c0c0c0', 0.9, 0.2), []);
  const glass = Glasses[glassKey] ?? Glasses.incolor;
  const glassMat = useMemo(() => Materials.glass(glass.transmission, glass.color, glassT), [glass, glassT]);

  return (
    <group>
      {/* Frame externo: 4 perfis */}
      <mesh position={[0, h / 2 - profile / 2, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[w, profile, profile]} />
      </mesh>
      <mesh position={[0, -h / 2 + profile / 2, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[w, profile, profile]} />
      </mesh>
      <mesh position={[-w / 2 + profile / 2, 0, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[profile, h, profile]} />
      </mesh>
      <mesh position={[w / 2 - profile / 2, 0, 0]} material={frameMat} castShadow receiveShadow>
        <boxGeometry args={[profile, h, profile]} />
      </mesh>

      {/* Trilho inferior (correr) */}
      {showTrack && opening === 'correr' && (
        <mesh position={[0, -h / 2 + 0.01, 0]} material={frameMat}>
          <boxGeometry args={[w * 0.95, 0.02, profile * 1.4]} />
        </mesh>
      )}

      {/* Folhas */}
      {Array.from({ length: leaves }).map((_, i) => {
        const x = -w / 2 + profile + leafW * i + leafW / 2;
        return (
          <group key={i} position={[x, 0, 0]}>
            <mesh material={frameMat} castShadow>
              <boxGeometry args={[leafW * 0.96, innerH * 0.98, profile * 0.7]} />
            </mesh>
            <mesh position={[0, 0, profile * 0.4]} material={glassMat}>
              <boxGeometry args={[leafW * 0.86, innerH * 0.9, glassT]} />
            </mesh>
            {/* Puxador */}
            <mesh position={[0, 0, profile * 0.8]} material={handleMat}>
              <boxGeometry args={[0.04, innerH * 0.18, 0.02]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
