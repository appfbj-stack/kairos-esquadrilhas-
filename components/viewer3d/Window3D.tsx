'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials, Glasses } from './Materiais';

export type Window3DProps = {
  widthMm: number;
  heightMm: number;
  leaves?: number;
  colorHex?: string;
  glassKey?: keyof typeof Glasses;
};

/**
 * Janela 3D parametrica. Dimensoes em milimetros (convertidas para metros).
 * Estrutura: Frame externo + folhas internas + vidro.
 * Evoluir nas proximas sprints para incluir trilhhos, puxadores, roldanas.
 */
export function Window3D({
  widthMm,
  heightMm,
  leaves = 2,
  colorHex = '#0a0a0a',
  glassKey = 'incolor',
}: Window3DProps) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const profile = 0.05; // 5cm de perfil
  const glassT = 0.02; // 2cm de espessura do vidro

  const frameMat = useMemo(() => Materials.aluminium(colorHex), [colorHex]);
  const glass = Glasses[glassKey] ?? Glasses.incolor;
  const glassMat = useMemo(() => Materials.glass(glass.transmission, glass.color, glassT), [glass, glassT]);

  // Area util interna (descontando perfis)
  const innerW = w - profile * 2;
  const innerH = h - profile * 2;
  const leafW = innerW / leaves;

  return (
    <group>
      {/* Frame externo: 4 perfis */}
      {/* Top */}
      <mesh position={[0, h / 2 - profile / 2, 0]} material={frameMat}>
        <boxGeometry args={[w, profile, profile]} />
      </mesh>
      {/* Bottom */}
      <mesh position={[0, -h / 2 + profile / 2, 0]} material={frameMat}>
        <boxGeometry args={[w, profile, profile]} />
      </mesh>
      {/* Left */}
      <mesh position={[-w / 2 + profile / 2, 0, 0]} material={frameMat}>
        <boxGeometry args={[profile, h, profile]} />
      </mesh>
      {/* Right */}
      <mesh position={[w / 2 - profile / 2, 0, 0]} material={frameMat}>
        <boxGeometry args={[profile, h, profile]} />
      </mesh>

      {/* Folhas + vidro */}
      {Array.from({ length: leaves }).map((_, i) => {
        const x = -w / 2 + profile + leafW * i + leafW / 2;
        return (
          <group key={i} position={[x, 0, 0]}>
            {/* Perfil da folha */}
            <mesh material={frameMat}>
              <boxGeometry args={[leafW * 0.95, innerH * 0.98, profile * 0.6]} />
            </mesh>
            {/* Vidro da folha */}
            <mesh position={[0, 0, profile * 0.3]} material={glassMat}>
              <boxGeometry args={[leafW * 0.85, innerH * 0.9, glassT]} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
