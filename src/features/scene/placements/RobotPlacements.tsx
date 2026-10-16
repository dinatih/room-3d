import { Suspense, useCallback, useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import type { SceneItemProps } from '@shared/types';
import { INVENTORY } from '@features/inventory/inventoryData';
import { Jumper } from '../items/Jumper';
import { UnitreeG1, UnitreeGo2 } from '../items/Unitree';
import { getObjectActionIds } from '../objectActions';
import { getActionDef } from '../objectActionRegistry';
import { useNavigationEnabled } from '../ai/navigation/NavigationContext';
import { getNavigationGraph, createRouteState, followRoute, resetRoute } from '../ai/navigation/service';
import { setAgentProfile, getAgentProfile, removeAgentProfile, type AgentProfile } from '../ai/navigation/obstacles';
import { computeSteeringVector, computeRotYStep, isAgentDestinationFree, reserveAgentDestination } from '../ai/agent/agentAvoidance';
import type { Point } from '../ai/navigation/geometry';
import { cameraState } from '../cameraState';
import { isAppIdle } from '../idleState';
import { appLog } from '@features/ui/AppConsole';
import { WALL_DEFS, WALL_THICKNESS } from '../wallData';

// Extend patrols 2 metres beyond the studio's actual west/east exterior walls.
const PATROL = {
  minX: Math.min(...WALL_DEFS.map(wall => wall.axis === 'x' ? wall.x1 : wall.xc - (wall.t ?? WALL_THICKNESS) / 2)) - 200,
  maxX: Math.max(...WALL_DEFS.map(wall => wall.axis === 'x' ? wall.x2 : wall.xc + (wall.t ?? WALL_THICKNESS) / 2)) + 200,
  minZ: -620, maxZ: -420,
};
const ROBOTS = [
  { id: 'unitree-g1', Component: UnitreeG1, position: [50, 0, -450], walk: 'walk', speed: 30, pause: 2, radiusScale: 1 / 2 },
  { id: 'unitree-go2', Component: UnitreeGo2, position: [220, 0, -620], walk: 'trot', speed: 25.2, pause: 4, radiusScale: 2 / 3 },
  { id: 'jumper-robot', Component: Jumper, position: [430, 0, -450], walk: 'walk', speed: 28.8, pause: 6, radiusScale: 2 / 3 },
] satisfies { id: string; Component: ComponentType<SceneItemProps>; position: [number, number, number]; walk: string; speed: number; pause: number; radiusScale: number }[];

function Robot({ config }: { config: typeof ROBOTS[number] }) {
  const { id, Component } = config;
  const navigationEnabled = useNavigationEnabled();
  const group = useRef<Group>(null);
  const [profile, setProfile] = useState<AgentProfile | null>(null);
  const route = useRef(createRouteState());
  const life = useRef({ automatic: true, target: null as Point | null, wait: config.pause, searching: false });
  const [actions, setActions] = useState<Record<string, any>>({});
  const motionKey = id === 'jumper-robot' ? 'jumper-motion' : `${id}-motion`;
  const currentMotion = useRef('idle');
  const replayKey = id === 'jumper-robot' ? 'jumper-replay' : `${id}-replay`;
  const automaticKey = `${id}-autonomous`;
  const item = INVENTORY.find(item => item.id === id);
  if (!item) throw new Error(`Missing robot inventory item: ${id}`);
  const selectMotion = useCallback((motion: string) => {
    if (currentMotion.current === motion) return;
    currentMotion.current = motion;
    setActions(previous => ({ ...previous, [motionKey]: motion }));
  }, [motionKey]);
  const onSize = useCallback((size: Vector3) => {
    const measured = { radius: Math.hypot(size.x, size.z) / 2 * config.radiusScale, height: size.y };
    setProfile(previous => previous?.radius === measured.radius && previous.height === measured.height ? previous : measured);
  }, [config.radiusScale]);

  // Registration and removal belong to the same effect, including StrictMode/HMR remounts.
  useLayoutEffect(() => {
    if (!navigationEnabled || !profile) return;
    setAgentProfile(id, profile);
    const root = group.current!;
    cameraState.positions[id] = { x: root.position.x, y: root.position.y, z: root.position.z, yaw: root.rotation.y };
    return () => {
      resetRoute(route.current, id);
      removeAgentProfile(id);
      reserveAgentDestination(id, null);
      delete cameraState.positions[id];
    };
  }, [id, navigationEnabled, profile]);

  useEffect(() => {
    if (!navigationEnabled) return;
    const handler = (event: Event) => {
      const { key, value } = (event as CustomEvent<{ key: string; value?: string }>).detail;
      if (key !== automaticKey && key !== motionKey && key !== replayKey) return;
      resetRoute(route.current, id);
      reserveAgentDestination(id, null);
      life.current.target = null;
      life.current.searching = false;
      if (key === automaticKey) {
        life.current.automatic = true;
        life.current.wait = 2;
        selectMotion('idle');
      } else {
        life.current.automatic = false;
        if (key === motionKey) {
          if (!getActionDef(motionKey)?.options?.some(option => option.value === value)) throw new Error(`Unknown ${id} motion: ${value}`);
          selectMotion(value!);
        } else {
          setActions(previous => ({ ...previous, [replayKey]: (previous[replayKey] ?? 0) + 1 }));
        }
      }
    };
    document.addEventListener('furniture-toggle', handler);
    return () => {
      document.removeEventListener('furniture-toggle', handler);
    };
  }, [id, navigationEnabled, automaticKey, motionKey, replayKey, selectMotion]);

  // Run before each model's animation callback so placement and animation agree.
  useFrame((state, delta) => {
    const root = group.current;
    if (!root || !profile || !navigationEnabled || isAppIdle()) return;
    const ai = life.current;
    if (ai.automatic) {
      if (ai.target) {
        const before = { x: root.position.x, z: root.position.z };
        const corner = route.current.path[route.current.index] ?? ai.target;
        const heading = Math.atan2(corner.x - before.x, corner.z - before.z);
        // Turn before advancing when the next leg of the route is behind the body.
        const travel = config.speed * delta * Math.max(0, Math.cos(heading - root.rotation.y));
        const next = followRoute(route.current, id, before, ai.target, travel, (direction, remaining) => {
          const steer = computeSteeringVector(id, before.x, before.z, direction.x, direction.z, remaining);
          root.rotation.y = computeRotYStep(root.rotation.y, Math.atan2(steer.steerX, steer.steerZ), Math.PI, delta);
          return { x: steer.steerX, z: steer.steerZ };
        });
        const moved = next.x !== before.x || next.z !== before.z;
        root.position.x = next.x;
        root.position.z = next.z;
        selectMotion(moved ? config.walk : 'idle');
        if (route.current.error || (next.x === ai.target.x && next.z === ai.target.z)) {
          if (route.current.error) appLog(id, `Navigation : ${route.current.error}`);
          resetRoute(route.current, id);
          reserveAgentDestination(id, null);
          ai.target = null;
          ai.wait = 3 + Math.random() * 4;
          selectMotion('idle');
        }
      } else {
        ai.wait -= delta;
        if (ai.wait <= 0) {
          selectMotion('idle');
          if (ai.searching || Math.random() < 2 / 3) {
            ai.searching = true;
            const target = {
              x: PATROL.minX + Math.random() * (PATROL.maxX - PATROL.minX),
              z: PATROL.minZ + Math.random() * (PATROL.maxZ - PATROL.minZ),
            };
            const start = { x: root.position.x, z: root.position.z };
            if (Math.hypot(start.x - target.x, start.z - target.z) >= profile.radius * 2
              && isAgentDestinationFree(id, target) && getNavigationGraph(getAgentProfile(id)).canReach(start, target)) {
              ai.target = target;
              ai.searching = false;
              reserveAgentDestination(id, target);
            }
            ai.wait = ai.target ? 3 : 0;
          } else {
            const gestures = getActionDef(motionKey)!.options!.filter(option => !['idle', config.walk, 'turn-left', 'turn-right'].includes(option.value));
            selectMotion(gestures[Math.floor(Math.random() * gestures.length)].value);
            ai.wait = 10; // Leave time for the longest Jumper greeting clip to finish.
          }
        }
      }
    }
    cameraState.positions[id] = { x: root.position.x, y: root.position.y, z: root.position.z, yaw: root.rotation.y };
    state.invalidate();
  }, -1);

  return (
    <group ref={group} position={config.position} userData={{ animUnit: true, noAnim: true, skipMerge: true,
      itemName: item.name, hoverAction: { label: item.name, actions: getObjectActionIds(id) } }}>
      <Component item={item} actionState={actions} onSize={onSize} />
    </group>
  );
}

export function RobotPlacements() {
  return <>{ROBOTS.map(config => <Suspense key={config.id} fallback={null}><Robot config={config} /></Suspense>)}</>;
}
