import React, { Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { KitchenEquipment, KitchenFurniture, KitchenFurnishings } from '../../src/features/scene/placements/KitchenPlacements';
import { kitchenCooking, type CookingRecipe } from '../../src/features/scene/ai/kitchenCooking';
import { KITCHEN_WEST_WALL, ROOM_D } from '../../src/features/scene/wallData';
import { OrbitControls } from '@react-three/drei';

Object.assign(window, { setCooking: (recipe: CookingRecipe | null, elapsed: number) => {
  kitchenCooking.session = recipe ? { owner: 'visual-test', recipe, elapsed } : null;
} });
createRoot(document.getElementById('root')!).render(<Canvas style={{ height: '100vh' }} camera={{ position: [KITCHEN_WEST_WALL + 300, 245, ROOM_D - 260], near: 1, far: 1500 }}>
  <color attach="background" args={['#79838d']} />
  <ambientLight intensity={2} /><directionalLight position={[100, 300, 100]} intensity={3} />
  <Suspense fallback={null}><KitchenEquipment /><KitchenFurniture /><KitchenFurnishings /></Suspense>
  <OrbitControls target={[KITCHEN_WEST_WALL + 55, 115, ROOM_D + 10]} />
</Canvas>);
