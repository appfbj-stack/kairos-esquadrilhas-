'use client';

import * as THREE from 'three';

/**
 * Materiais reutilizaveis do motor 3D do Kairos Esquadrias.
 * Sprint 5: crescer para incluir BronzeMaterial, NaturalMaterial, etc.
 */
export const Materials = {
  aluminium: (color: string = '#0a0a0a', metalness = 0.85, roughness = 0.35) =>
    new THREE.MeshStandardMaterial({
      color,
      metalness,
      roughness,
    }),

  glass: (transmission = 0.9, color = '#a8dadc', thickness = 0.5) =>
    new THREE.MeshPhysicalMaterial({
      color,
      metalness: 0,
      roughness: 0.05,
      transmission,
      thickness,
      transparent: true,
      opacity: 0.55,
      ior: 1.5,
    }),

  black: () => Materials.aluminium('#0a0a0a'),
  white: () => Materials.aluminium('#f5f5f5', 0.5, 0.5),
  bronze: () => Materials.aluminium('#8c6b3f'),
  natural: () => Materials.aluminium('#c0c0c0', 0.7, 0.4),
  gray: () => Materials.aluminium('#6b7280'),
};

export const Colors = {
  preto: '#0a0a0a',
  branco: '#f5f5f5',
  bronze: '#8c6b3f',
  natural: '#c0c0c0',
  cinza: '#6b7280',
};

export const Glasses = {
  incolor: { color: '#cfeefb', transmission: 0.92 },
  fume: { color: '#5a5040', transmission: 0.5 },
  verde: { color: '#7fa68a', transmission: 0.7 },
  bronze: { color: '#a88060', transmission: 0.55 },
  temperado: { color: '#cfeefb', transmission: 0.88 },
  reflectivo: { color: '#9ca3af', transmission: 0.4 },
  laminado: { color: '#dbeafe', transmission: 0.7 },
};

export type ColorKey = keyof typeof Colors;
export type GlassKey = keyof typeof Glasses;
