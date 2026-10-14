import { Suspense, useCallback, useEffect, useRef, useState, type ComponentType } from 'react';
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
import { setAgentProfile, removeAgentProfile, type AgentProfile } from '../ai/navigation/obstacles';
import { computeSteeringVector } from '../ai/agent/agentAvoidance';
import type { Point } from '../ai/navigation/geometry';
import { cameraState } from '../cameraState';
import { isAppIdle } from '../idleState';
import { appLog } from '@features/ui/AppConsole';

// A small shared patrol in the open garden, away from the furniture and statues.
const PATROL: Point[] = [{ x: 90, z: -480 }, { x: 200, z: -580 }, { x: 300, z: -480 }, { x: 200, z: -420 }];
const ROBOTS = [
  { id: 'unitree-g1', Component: UnitreeG1, position: [90, 0, -480], walk: 'walk', speed: 30, pause: 2 },
  { id: 'unitree-go2', Component: UnitreeGo2, position: [200, 0, -580], walk: 'trot', speed: 25.2, pause: 4 },
  { id: 'jumper-robot', Component: Jumper, position: [300, 0, -480], walk: 'walk', speed: 28.8, pause: 6 },
] satisfies { id: string; Component: ComponentType<SceneItemProps>; position: [number, number, number]; walk: string; speed: number; pause: number }[];

function Robot({ config }: { config: typeof ROBOTS[number] }) {
  const { id, Component } = config;
  const navigationEnabled = useNavigationEnabled();
  const group = useRef<Group>(null);
  const profile = useRef<AgentProfile | null>(null);
  const route = useRef(createRouteState());
  const life = useRef({ automatic: true, target: null as Point | null, wait: config.pause });
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
    profile.current = { radius: Math.hypot(size.x, size.z) / 2, height: size.y };
    if (navigationEnabled) setAgentProfile(id, profile.current);
  }, [id, navigationEnabled]);

  useEffect(() => {
    if (!navigationEnabled) return;
    const handler = (event: Event) => {
      const { key, value } = (event as CustomEvent<{ key: string; value?: string }>).detail;
      if (key !== automaticKey && key !== motionKey && key !== replayKey) return;
      resetRoute(route.current, id);
      life.current.target = null;
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
      resetRoute(route.current, id);
      removeAgentProfile(id);
      delete cameraState.positions[id];
    };
  }, [id, navigationEnabled, automaticKey, motionKey, replayKey, selectMotion]);

  // Run before each model's animation callback so placement and animation agree.
  useFrame((state, delta) => {
    const root = group.current;
    if (!root || !profile.current || !navigationEnabled || isAppIdle()) return;
    const ai = life.current;
    if (ai.automatic) {
      if (ai.target) {
        const before = { x: root.position.x, z: root.position.z };
        const next = followRoute(route.current, id, before, ai.target, config.speed * delta, (direction, remaining) => {
          const steer = computeSteeringVector(id, before.x, before.z, direction.x, direction.z, remaining);
          return { x: steer.steerX, z: steer.steerZ };
        });
        const moved = next.x !== before.x || next.z !== before.z;
        root.position.x = next.x;
        root.position.z = next.z;
        if (moved) root.rotation.y = Math.atan2(next.x - before.x, next.z - before.z);
        selectMotion(moved ? config.walk : 'idle');
        if (route.current.error || (next.x === ai.target.x && next.z === ai.target.z)) {
          if (route.current.error) appLog(id, `Navigation : ${route.current.error}`);
          resetRoute(route.current, id);
          ai.target = null;
          ai.wait = 3 + Math.random() * 4;
          selectMotion('idle');
        }
      } else {
        ai.wait -= delta;
        if (ai.wait <= 0) {
          selectMotion('idle');
          if (Math.random() < 2 / 3) {
            const target = PATROL[Math.floor(Math.random() * PATROL.length)];
            const start = { x: root.position.x, z: root.position.z };
            if ((start.x !== target.x || start.z !== target.z) && getNavigationGraph(profile.current).find(start, target)) ai.target = target;
            ai.wait = 3;
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
