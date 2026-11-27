import { useEffect, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useSceneStore } from '../store/useSceneStore';
import { cameraState } from '../cameraState';
import { duoSessionManager } from './duoSessionManager';
import { getDuoAnimationDef } from '../animations/duoAnimations';
import { getDuoAnimationTransformOverride, resolveAnimationId, subscribeAnimationOverrides } from '../animations/animationResolver';
import { architectureObstacles } from './navigation/architecture';
import { getObstacleRevision } from './navigation/obstacles';
import { doorKeys } from './navigation/service';
import { doorCollisionState } from '../doorObstacles';
import {
  computeAnimationHeatmap,
  evaluateHeatmapCollisions,
  type AnimationHeatmapData,
  type HeatmapCollisionResult,
  type HeatmapParticipantSpec,
} from '../animations/animationHeatmap';
import { AnimationHeatmapMesh } from '../animations/AnimationHeatmapMesh';
import { useAnimationHeatmapStore } from './animationHeatmapStore';

interface ResolvedTarget {
  specKey: string;
  participants: HeatmapParticipantSpec[];
  duoDuration?: number;
  anchorPos: [number, number, number];
  anchorRotY: number;
  label: string;
}

function buildSpecKey(participants: HeatmapParticipantSpec[], overrideTick: number): string {
  return JSON.stringify({
    overrideTick,
    participants: participants.map((p) => ({
      c: p.characterId,
      a: resolveAnimationId(p.animationId || 'idle'),
      p: p.localPos.map((n) => Math.round(n * 100) / 100),
      r: Math.round(p.localRotY * 10000) / 10000,
    })),
  });
}

function resolveHeatmapTarget(overrideTick: number): ResolvedTarget | null {
  const store = useAnimationHeatmapStore.getState();
  const activeCharacterId = useSceneStore.getState().activeCharacterId;

  if (store.mode === 'live') {
    if (store.pinnedAnchor) {
      const { pos, rotY, participants, label } = store.pinnedAnchor;
      return {
        specKey: buildSpecKey(participants, overrideTick),
        participants,
        anchorPos: pos,
        anchorRotY: rotY,
        label,
      };
    }
    const targetId = store.liveNpcId === 'active' ? activeCharacterId : store.liveNpcId;
    const session = duoSessionManager.getSessionFor(targetId);
    if (session && session.isSessionPlaying && session.participantA && session.participantB) {
      const animState = duoSessionManager.getCurrentAnimState(targetId);
      if (animState) {
        const override = getDuoAnimationTransformOverride(animState.def.id);
        const offsetB = override?.offsetB ?? animState.def.offsetB ?? [0, 0, 0];
        const rotB = override?.rotB !== undefined ? override.rotB : (animState.def.rotB ?? 0);
        const participants: HeatmapParticipantSpec[] = [
          { characterId: session.participantA.characterId, animationId: animState.clipA, localPos: [0, 0, 0], localRotY: 0 },
          { characterId: session.participantB.characterId, animationId: animState.clipB, localPos: offsetB, localRotY: rotB },
        ];
        return {
          specKey: buildSpecKey(participants, overrideTick),
          participants,
          duoDuration: animState.def.duration,
          anchorPos: session.location.anchorPos,
          anchorRotY: session.location.anchorRotY,
          label: `Duo : ${animState.def.label} (${session.participantA.characterId} + ${session.participantB.characterId})`,
        };
      }
    }

    const pose = cameraState.positions[targetId];
    if (!pose) return null;
    const animId = pose.anim || 'idle';
    const participants: HeatmapParticipantSpec[] = [
      { characterId: targetId, animationId: animId, localPos: [0, 0, 0], localRotY: 0 },
    ];
    return {
      specKey: buildSpecKey(participants, overrideTick),
      participants,
      anchorPos: [pose.x, pose.y, pose.z],
      anchorRotY: pose.yaw,
      label: `${targetId} · ${resolveAnimationId(animId)}`,
    };
  }

  const anchorRotY = (store.customRotDeg * Math.PI) / 180;
  if (store.customKind === 'duo') {
    const def = getDuoAnimationDef(store.customDuoId);
    if (!def) return null;
    const override = getDuoAnimationTransformOverride(def.id);
    const offsetB = override?.offsetB ?? def.offsetB ?? [0, 0, 0];
    const rotB = override?.rotB !== undefined ? override.rotB : (def.rotB ?? 0);
    const participants: HeatmapParticipantSpec[] = [
      { characterId: store.customCharA, animationId: def.animA, localPos: [0, 0, 0], localRotY: 0 },
      { characterId: store.customCharB, animationId: def.animB, localPos: offsetB, localRotY: rotB },
    ];
    return {
      specKey: buildSpecKey(participants, overrideTick),
      participants,
      duoDuration: def.duration,
      anchorPos: store.customPos,
      anchorRotY,
      label: `Test Duo : ${def.label}`,
    };
  }

  const participants: HeatmapParticipantSpec[] = [
    { characterId: store.customCharA, animationId: store.customAnimId, localPos: [0, 0, 0], localRotY: 0 },
  ];
  return {
    specKey: buildSpecKey(participants, overrideTick),
    participants,
    anchorPos: store.customPos,
    anchorRotY,
    label: `Test Solo : ${store.customCharA} · ${resolveAnimationId(store.customAnimId)}`,
  };
}

export function AnimationHeatmapHelper() {
  const showGround = useAnimationHeatmapStore((s) => s.showGround);
  const show3D = useAnimationHeatmapStore((s) => s.show3D);
  const clashOnly3D = useAnimationHeatmapStore((s) => s.clashOnly3D);
  const { invalidate } = useThree();

  const [overrideTick, setOverrideTick] = useState(0);
  useEffect(() => subscribeAnimationOverrides(() => setOverrideTick((t) => t + 1)), []);

  const [heatmapData, setHeatmapData] = useState<AnimationHeatmapData | null>(null);
  const [collisions, setCollisions] = useState<HeatmapCollisionResult | null>(null);
  const [renderAnchor, setRenderAnchor] = useState<{ pos: [number, number, number]; rotY: number }>({
    pos: [0, 0, 0],
    rotY: 0,
  });

  const lastSpecKeyRef = useRef('');
  const lastCollisionSigRef = useRef('');
  const requestIdRef = useRef(0);
  const currentLabelRef = useRef('');

  useEffect(() => {
    return () => {
      useAnimationHeatmapStore.getState().setStatus({ loading: false, error: null, summary: null });
    };
  }, []);

  useFrame(() => {
    const target = resolveHeatmapTarget(overrideTick);
    if (!target) {
      if (lastSpecKeyRef.current !== '') {
        lastSpecKeyRef.current = '';
        lastCollisionSigRef.current = '';
        setHeatmapData(null);
        setCollisions(null);
        useAnimationHeatmapStore.getState().setStatus({ loading: false, error: null, summary: null });
      }
      return;
    }

    currentLabelRef.current = target.label;

    if (target.specKey !== lastSpecKeyRef.current) {
      lastSpecKeyRef.current = target.specKey;
      lastCollisionSigRef.current = '';
      const reqId = ++requestIdRef.current;
      useAnimationHeatmapStore.getState().setStatus({ loading: true, error: null });
      computeAnimationHeatmap(target.participants, { duoDuration: target.duoDuration })
        .then((data) => {
          if (requestIdRef.current !== reqId) return;
          setHeatmapData(data);
          invalidate();
        })
        .catch((err) => {
          if (requestIdRef.current !== reqId) return;
          const msg = err instanceof Error ? err.message : String(err);
          useAnimationHeatmapStore.getState().setStatus({ loading: false, error: msg, summary: null });
        });
    }

    if (!heatmapData) return;

    const colSig = JSON.stringify([
      heatmapData.key,
      target.anchorPos.map((n) => Math.round(n * 10) / 10),
      Math.round(target.anchorRotY * 1000) / 1000,
      getObstacleRevision(),
      architectureObstacles.length,
      doorKeys.map((k) => Math.round(doorCollisionState[k].angle * 1000)),
      target.label,
    ]);

    if (colSig !== lastCollisionSigRef.current) {
      lastCollisionSigRef.current = colSig;
      const result = evaluateHeatmapCollisions(heatmapData, target.anchorPos, target.anchorRotY);
      setCollisions(result);
      setRenderAnchor({ pos: target.anchorPos, rotY: target.anchorRotY });
      const { minX, maxX, minY, maxY, minZ, maxZ } = heatmapData.bounds;
      useAnimationHeatmapStore.getState().setStatus({
        loading: false,
        error: null,
        summary: {
          width: Math.round(maxX - minX),
          depth: Math.round(maxZ - minZ),
          height: Math.round(maxY - minY),
          radius: Math.round(heatmapData.footprintRadius),
          sampleCount: heatmapData.sampleCount,
          duration: heatmapData.duration,
          voxelCount: heatmapData.voxels.length,
          clashCells: result.collidingCellIndices.size,
          clashVoxels: result.collidingVoxelIndices.size,
          collidingObstacles: result.collidingObstacles,
          activeLabel: target.label,
        },
      });
      invalidate();
    }
  });

  return (
    <AnimationHeatmapMesh
      data={heatmapData}
      collisions={collisions}
      anchorPos={renderAnchor.pos}
      anchorRotY={renderAnchor.rotY}
      showGround={showGround}
      show3D={show3D}
      clashOnly3D={clashOnly3D}
    />
  );
}
