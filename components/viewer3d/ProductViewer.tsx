'use client';

import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, ContactShadows } from '@react-three/drei';
import { Suspense } from 'react';
import { Window3D } from './Window3D';

export type ProductViewerProps = {
  widthMm?: number;
  heightMm?: number;
  leaves?: number;
  colorHex?: string;
  glassKey?: 'incolor' | 'fume' | 'verde' | 'bronze' | 'temperado';
};

/**
 * Viewer 3D generico do Kairos Esquadrias.
 * Sprint 5: trocar para um switch de produtos (Window3D, Door3D, Box3D...).
 */
export function ProductViewer({
  widthMm = 2000,
  heightMm = 1200,
  leaves = 2,
  colorHex = '#0a0a0a',
  glassKey = 'incolor',
}: ProductViewerProps) {
  return (
    <div className="relative h-full w-full overflow-hidden rounded-lg border bg-gradient-to-b from-slate-100 to-slate-200">
      <Canvas shadows camera={{ position: [2.5, 1.5, 3], fov: 45 }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.4} />
          <directionalLight
            position={[5, 5, 5]}
            intensity={0.9}
            castShadow
            shadow-mapSize-width={1024}
            shadow-mapSize-height={1024}
          />
          <directionalLight position={[-5, 3, -5]} intensity={0.3} />

          <Window3D
            widthMm={widthMm}
            heightMm={heightMm}
            leaves={leaves}
            colorHex={colorHex}
            glassKey={glassKey}
          />

          <ContactShadows position={[0, -0.66, 0]} opacity={0.4} scale={5} blur={2.4} far={2} />
          <Environment preset="city" />
        </Suspense>
        <OrbitControls enablePan={false} minDistance={1.5} maxDistance={6} />
      </Canvas>
      <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex justify-between text-[10px] text-muted-foreground">
        <span>{widthMm}mm × {heightMm}mm</span>
        <span>Arraste para girar</span>
      </div>
    </div>
  );
}
