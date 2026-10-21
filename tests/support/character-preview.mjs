import React, { useEffect, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Canvas, useThree } from '@react-three/fiber';
import { CharacterGroup } from '/src/features/scene/character/CharacterGroup.tsx';
import { NavigationEnabledContext } from '/src/features/scene/ai/navigation/NavigationContext.ts';
import { cameraState } from '/src/features/scene/cameraState.ts';
import { animationLibraryStats } from '/src/features/scene/character/animationLibrary.ts';

export async function verifyCharacterPreview() {
  const host = document.createElement('div');
  host.style.width = '320px'; host.style.height = '320px';
  document.body.append(host);
  const root = createRoot(host), mainStats = window.__CHARACTER_RUNTIME_STATS__;
  const originalPositions = cameraState.positions, originalHeads = cameraState.headPositions;
  const usersBefore = animationLibraryStats().users;
  let ready;
  const mounted = new Promise(resolve => { ready = resolve; });
  function Loaded() {
    const { scene } = useThree();
    useEffect(() => {
      const timer = setInterval(() => {
        let skin = false;
        scene.traverse(node => { if (node.isSkinnedMesh) skin = true; });
        if (skin) { clearInterval(timer); ready(); }
      }, 50);
      return () => clearInterval(timer);
    }, [scene]);
    return null;
  }
  try {
    flushSync(() => root.render(React.createElement(Canvas, { camera: { position: [0, 120, 400] } },
      React.createElement(NavigationEnabledContext.Provider, { value: false },
        React.createElement(Suspense, { fallback: null }, React.createElement(CharacterGroup, { isPreview: true, previewCharacterId: 'native', characterAnim: 'idle' })),
        React.createElement(Loaded)))));
    await mounted;
    if (window.__CHARACTER_RUNTIME_STATS__ !== mainStats) throw Error('Preview replaced main runtime statistics');
    const before = JSON.stringify({ positions: cameraState.positions, headPositions: cameraState.headPositions, x: cameraState.characterX, z: cameraState.characterZ, head: cameraState.activeHeadPos });
    const removed = [];
    cameraState.positions = new Proxy(originalPositions, { deleteProperty(target, key) { if (key === 'native') removed.push('position'); return Reflect.deleteProperty(target, key); } });
    cameraState.headPositions = new Proxy(originalHeads, { deleteProperty(target, key) { if (key === 'native') removed.push('head'); return Reflect.deleteProperty(target, key); } });
    flushSync(() => root.unmount());
    const after = JSON.stringify({ positions: cameraState.positions, headPositions: cameraState.headPositions, x: cameraState.characterX, z: cameraState.characterZ, head: cameraState.activeHeadPos });
    if (before !== after) throw Error('Preview cleanup changed main character state');
    const deadline = performance.now() + 5000;
    while (animationLibraryStats().users !== usersBefore && performance.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50));
    if (animationLibraryStats().users !== usersBefore) throw Error('Preview retained its animation library after disposal');
    if (removed.length) throw Error('Preview cleanup deleted the main actor: '+removed.join(','));
    return { isolated: true, resourcesAfterUnmount: animationLibraryStats() };
  } finally { root.unmount(); host.remove(); cameraState.positions = originalPositions; cameraState.headPositions = originalHeads; }
}
