'use client';

import { useMemo } from 'react';
import * as THREE from 'three';
import { Materials, Glasses, type GlassKey } from './Materials';

export type Box3DProps = {
  widthMm: number; // largura total
  heightMm: number;
  depthMm?: number; // profundidade (padrao 80cm)
  type?: 'frontal' | 'canto' | 'teto';
  colorHex?: string;
  glassKey?: GlassKey;
};

/**
 * Box de banheiro. Painel de vidro temperado fixo + porta(s) de correr.
 * - frontal: 1 painel de vidro + 1 porta de correr
 * - canto: 2 paineis em L + 1 porta de correr
 * - teto: frontal ate o teto (mais alto)
 */
export function Box3D({
  widthMm,
  heightMm,
  depthMm = 800,
  type = 'frontal',
  colorHex = '#c0c0c0',
  glassKey = 'incolor',
}: Box3DProps) {
  const w = widthMm / 1000;
  const h = heightMm / 1000;
  const d = depthMm / 1000;
  const profile = 0.03;
  const glassT = 0.008; // vidro temperado 8mm
  const doorW = w * 0.5; // porta ocupa metade

  const profileMat = useMemo(() => Materials.aluminium(colorHex, 0.85, 0.35), [colorHex]);
  const glass = Glasses[glassKey] ?? Glasses.incolor;
  const glassMat = useMemo(
    () => Materials.glass(glass.transmission, glass.color, glassT),
    [glass, glassT]
  );

  return (
    <group>
      {/* Trilho superior (correr) */}
      <mesh position={[0, h - 0.015, 0]} material={profileMat} castShadow>
        <boxGeometry args={[w, 0.03, profile * 1.5]} />
      </mesh>
      {/* Trilho inferior */}
      <mesh position={[0, 0.01, 0]} material={profileMat} castShadow>
        <boxGeometry args={[w, 0.02, profile * 1.5]} />
      </mesh>

      {/* Painel fixo (metade esquerda) */}
      <mesh position={[-doorW / 2, h / 2, 0]} material={glassMat} castShadow>
        <boxGeometry args={[doorW * 0.95, h - 0.05, glassT]} />
      </mesh>
      {/* Perfil vertical do painel fixo */}
      <mesh position={[-doorW, h / 2, 0]} material={profileMat}>
        <boxGeometry args={[profile, h, profile * 0.6]} />
      </mesh>
      <mesh position={[0, h / 2, 0]} material={profileMat}>
        <boxGeometry args={[profile, h, profile * 0.6]} />
      </mesh>

      {/* Porta de correr (metade direita) */}
      <group position={[doorW / 2, h / 2, 0]}>
        <mesh material={glassMat} castShadow>
          <boxGeometry args={[doorW * 0.95, h - 0.05, glassT]} />
        </mesh>
        {/* Puxador da porta */}
        <mesh position={[doorW * 0.4, 0, glassT / 2 + 0.02]} material={profileMat}>
          <cylinderGeometry args={[0.015, 0.015, 0.08, 12]} />
        </mesh>
      </group>

      {/* Para box de canto: parede lateral em vidro */}
      {type === 'canto' && (
        <>
          <mesh
            position={[w / 2 - profile / 2, h / 2, -d / 2]}
            material={glassMat}
            castShadow
            rotation={[0, Math.PI / 2, 0]}
          >
            <boxGeometry args={[d * 0.95, h - 0.05, glassT]} />
          </mesh>
          <mesh position={[w / 2 - profile / 2, h / 2, 0]} material={profileMat}>
            <boxGeometry args={[profile, h, profile * 0.6]} />
          </mesh>
        </>
      )}
    </group>
  );
}
