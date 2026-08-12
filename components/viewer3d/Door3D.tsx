'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials, Glasses, type GlassKey } from './Materials';

export type Door3DProps = {
  widthMm: number;
  heightMm: number;
  leaves?: 1 | 2;
  colorHex?: string;
  glassKey?: GlassKey;
  /** tipo de abertura: 'abrir' | 'correr' | 'pivotante' */
  opening?: 'abrir' | 'correr' | 'pivotante';
  showHandle?: boolean;
};

/**
 * Porta de aluminio parametrizada. 1 ou 2 folhas, com ou sem vidro.
 * Inclui batente externo, fechadura (puxador) e dobradicas representadas.
 */
export function Door3D({
  widthMm,
  heightMm,
  leaves = 1,
  colorHex = '#0a0a0a',
  glassKey = 'incolor',
  opening = 'abrir',
  showHandle = true,
}: Door3DProps) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const profile = 0.06;
  const glassT = 0.02;
  const innerW = w - profile * 2;
  const innerH = h - profile * 2;
  const leafW = innerW / Math.max(leaves, 1);

  const frameMat = useMemo(() => Materials.aluminium(colorHex), [colorHex]);
  const handleMat = useMemo(() => Materials.aluminium('#c0c0c0', 0.9, 0.2), []);
  const lockMat = useMemo(() => Materials.aluminium('#3f3f46', 0.5, 0.6), []);
  const glass = Glasses[glassKey] ?? Glasses.incolor;
  const glassMat = useMemo(() => Materials.glass(glass.transmission, glass.color, glassT), [glass, glassT]);

  return (
    <group>
      {/* Batente externo (frame fixo ao redor) */}
      <mesh position={[0, h / 2 - profile / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[w + profile, profile, profile * 1.5]} />
      </mesh>
      <mesh position={[0, -h / 2 + profile / 2, 0]} material={frameMat} castShadow>
        <boxGeometry args={[w + profile, profile, profile * 1.5]} />
      </mesh>
      <mesh position={[-w / 2 - profile / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[profile, h, profile * 1.5]} />
      </mesh>
      <mesh position={[w / 2 + profile / 2, 0, 0]} material={frameMat} castShadow>
        <boxGeometry args={[profile, h, profile * 1.5]} />
      </mesh>

      {/* Trilho (correr) */}
      {opening === 'correr' && (
        <mesh position={[0, -h / 2 + 0.005, 0]} material={frameMat}>
          <boxGeometry args={[w * 0.95, 0.01, profile * 1.2]} />
        </mesh>
      )}

      {/* Folhas */}
      {Array.from({ length: leaves }).map((_, i) => {
        const x = -w / 2 + profile + leafW * i + leafW / 2;
        return (
          <group key={i} position={[x, 0, 0]}>
            {/* Perfil da folha (mais robusto que janela) */}
            <mesh material={frameMat} castShadow>
              <boxGeometry args={[leafW * 0.95, innerH * 0.98, profile * 0.9]} />
            </mesh>
            {/* Vidro grande (tipico de porta) */}
            <mesh position={[0, innerH * 0.05, profile * 0.5]} material={glassMat}>
              <boxGeometry args={[leafW * 0.82, innerH * 0.8, glassT]} />
            </mesh>
            {/* Painel inferior (solid) para privacidade */}
            <mesh position={[0, -innerH * 0.35, profile * 0.5]} material={frameMat}>
              <boxGeometry args={[leafW * 0.85, innerH * 0.2, 0.01]} />
            </mesh>

            {/* Puxador / fechadura */}
            {showHandle && (
              <>
                <mesh position={[leafW * 0.3, 0, profile * 0.95]} material={handleMat}>
                  <boxGeometry args={[0.04, 0.18, 0.025]} />
                </mesh>
                <mesh position={[leafW * 0.3, 0, profile * 1.1]} material={lockMat}>
                  <cylinderGeometry args={[0.025, 0.025, 0.04, 16]} />
                </mesh>
              </>
            )}

            {/* Dobradicas representadas (3 pontos) */}
            <mesh position={[-leafW * 0.42, innerH * 0.32, profile * 1.05]} material={lockMat}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
            </mesh>
            <mesh position={[-leafW * 0.42, 0, profile * 1.05]} material={lockMat}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
            </mesh>
            <mesh position={[-leafW * 0.42, -innerH * 0.32, profile * 1.05]} material={lockMat}>
              <cylinderGeometry args={[0.02, 0.02, 0.08, 8]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
