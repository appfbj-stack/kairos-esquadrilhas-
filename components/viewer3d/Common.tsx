'use client';

import { Environment, ContactShadows, OrbitControls } from '@react-three/drei';
import { ReactNode } from 'react';

export function SceneCommon({ children, showHelpers = false }: { children: ReactNode; showHelpers?: boolean }) {
  return (
    <>
      <color attach="background" args={['#f1f5f9']} />
      <fog attach="fog" args={['#f1f5f9', 8, 25]} />

      <ambientLight intensity={0.45} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.0}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={5}
        shadow-camera-bottom={-5}
      />
      <directionalLight position={[-4, 3, -4]} intensity={0.3} />
      <hemisphereLight args={['#e2e8f0', '#94a3b8', 0.3]} />

      <ContactShadows position={[0, -0.001, 0]} opacity={0.35} scale={12} blur={2.5} far={3} />

      {children}

      {showHelpers && <axesHelper args={[1]} />}

      <Environment preset="city" />
      <OrbitControls
        enablePan={false}
        minDistance={1.2}
        maxDistance={8}
        minPolarAngle={Math.PI / 6}
        maxPolarAngle={Math.PI / 2.1}
        enableDamping
        dampingFactor={0.08}
        touches={{ ONE: 0, TWO: 2 } as any}
      />
    </>
  );
}
