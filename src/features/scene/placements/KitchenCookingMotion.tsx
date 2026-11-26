import { useRef, useMemo, useEffect, type ReactNode, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { DataTexture, RGBAFormat, Group, Vector3 } from 'three';
import { kitchenCooking, type CookingRecipe } from '../ai/kitchenCooking';
import { KALLAX_CUISINE_POSITION } from '../items/kallaxCuisineDrona';
import { KITCHEN_WEST_WALL, ROOM_D } from '../wallData';

const stove = new Vector3(KITCHEN_WEST_WALL + 65, 93, ROOM_D + 25);
const front = ROOM_D - 12;
const smooth = (t: number) => { const x = Math.max(0, Math.min(1, t)); return x * x * (3 - 2 * x); };

/** Pull clear of the shelf before lowering, then slide onto the worktop. */
export function KitchenCookingMotion({ children, recipe, vessel = false }: {
  children: ReactNode; recipe?: CookingRecipe; vessel?: boolean;
}) {
  const ref = useRef<Group>(null!);
  const origin = useRef(new Vector3());
  const point = useRef(new Vector3());
  useFrame(() => {
    const group = ref.current;
    const session = kitchenCooking.session;
    const active = session && (vessel ? (recipe === 'rice') === (session.recipe === 'rice') : recipe === session.recipe);
    group.position.set(0, 0, 0);
    group.rotation.set(0, 0, 0);
    if (!active) return;
    const parent = group.parent!;
    parent.localToWorld(origin.current.set(0, 0, 0));
    const t = session.elapsed;
    const travel = vessel ? (t < 13 ? Math.min(t / 3, 1) : (15 - t) / 2)
      : t < 5 ? Math.min(t / 3, 1) : Math.max(0, 1 - (t - 5) / 3);
    const path = [origin.current,
      vessel ? new Vector3(origin.current.x, origin.current.y, front)
        : new Vector3(KALLAX_CUISINE_POSITION[0] + 39 / 2 + 17, origin.current.y, origin.current.z),
      new Vector3(stove.x, vessel ? stove.y : stove.y + 38, front),
      vessel ? stove : new Vector3(stove.x, stove.y + 38, stove.z)];
    const segment = Math.min(2, Math.floor(travel * 3));
    point.current.copy(path[segment]).lerp(path[segment + 1], smooth(travel * 3 - segment));
    parent.worldToLocal(point.current);
    group.position.copy(point.current);
    if (!vessel) group.rotation.z = -Math.PI / 3 * smooth((t - 3) / 0.5) * (1 - smooth((t - 4.5) / 0.5));
  });
  return <group ref={ref} userData={{ skipMerge: true }}>{children}</group>;
}

/** Soft white puffs and a grain stream, both driven exclusively by the cooking clock. */
export function KitchenCookingEffects({ sizes }: { sizes: RefObject<{ rice: Vector3; pot: Vector3 }> }) {
  const puffTexture = useMemo(() => {
    const resolution = 32;
    const pixels = new Uint8Array(resolution * resolution * 4);
    for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
      const offset = (y * resolution + x) * 4;
      const radius = Math.hypot((x + 0.5) / resolution - 0.5, (y + 0.5) / resolution - 0.5) * 2;
      pixels.set([242, 250, 255, Math.round(255 * (1 - smooth(radius)))], offset);
    }
    const texture = new DataTexture(pixels, resolution, resolution, RGBAFormat);
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => puffTexture.dispose(), [puffTexture]);
  const steam = useRef<Group>(null!);
  const grains = useRef<Group>(null!);
  useFrame(() => {
    const session = kitchenCooking.session;
    const t = session?.elapsed ?? 0;
    const size = sizes.current[session?.recipe === 'rice' ? 'rice' : 'pot'];
    const radius = Math.min(size.x, size.z) / 2;
    steam.current.visible = !!session && t >= 5 && t < 15;
    grains.current.visible = !!session && t >= 3 && t < 5;
    steam.current.children.forEach((puff, i) => {
      const phase = ((t - 5) * 0.6 + i / steam.current.children.length) % 1;
      puff.position.set(Math.sin(i * 2.4 + t) * radius * phase, size.y + phase * size.y * 2, Math.cos(i * 2.4 + t) * radius * phase);
      puff.scale.setScalar((radius * (0.15 + phase * 0.4)) * smooth((t - 5) / 2) * (1 - smooth((t - 13) / 2)));
    });
    grains.current.children.forEach((grain, i) => {
      const phase = (t * 2 + i / grains.current.children.length) % 1;
      grain.position.set(Math.sin(i * 2.4) * 2, size.y + 20 * (1 - phase), Math.cos(i * 2.4) * 2);
    });
  });
  return <group position={stove} userData={{ skipMerge: true }}>
    <group ref={steam} visible={false}>
      {Array.from({ length: 12 }, (_, i) => <sprite key={i} raycast={() => {}}>
        <spriteMaterial map={puffTexture} transparent opacity={0.16} depthWrite={false} />
      </sprite>)}
    </group>
    <group ref={grains} visible={false}>
      {Array.from({ length: 20 }, (_, i) => <mesh key={i} raycast={() => {}}>
        <sphereGeometry args={[0.35, 4, 4]} /><meshBasicMaterial color="#ead6a2" />
      </mesh>)}
    </group>
  </group>;
}
