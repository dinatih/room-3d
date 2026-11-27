import { useEffect, useState } from 'react';
import { useThree } from '@react-three/fiber';
import type { DuoAnimationDef } from '@features/scene/animations/duoAnimations';
import { resolveDuoPreviewParticipants } from '@features/scene/animations/duoAnimations';
import { getDuoAnimationTransformOverride, subscribeAnimationOverrides } from '@features/scene/animations/animationResolver';
import {
  computeAnimationHeatmap,
  type AnimationHeatmapData,
  type HeatmapParticipantSpec,
} from '@features/scene/animations/animationHeatmap';
import { AnimationHeatmapMesh } from '@features/scene/animations/AnimationHeatmapMesh';
import { useAnimPreviewStore } from './useAnimPreviewStore';

export function AnimationHeatmapPreview({
  characterId,
  characterAnim,
  duoAnimDef,
  duoPartnerId,
}: {
  characterId: string;
  characterAnim?: string;
  duoAnimDef?: DuoAnimationDef;
  duoPartnerId?: string;
}) {
  const showGround = useAnimPreviewStore((s) => s.heatmapShowGround);
  const show3D = useAnimPreviewStore((s) => s.heatmapShow3D);
  const lockHipsXZ = useAnimPreviewStore((s) => s.lockHipsXZ);
  const { invalidate } = useThree();

  const [overrideTick, setOverrideTick] = useState(0);
  useEffect(() => subscribeAnimationOverrides(() => setOverrideTick((t) => t + 1)), []);

  const [data, setData] = useState<AnimationHeatmapData | null>(null);

  useEffect(() => {
    let cancelled = false;
    let participants: HeatmapParticipantSpec[];
    let duoDuration: number | undefined;

    if (duoAnimDef) {
      const { leaderId, partnerId } = resolveDuoPreviewParticipants(characterId, duoPartnerId);
      const override = getDuoAnimationTransformOverride(duoAnimDef.id);
      const offsetB = override?.offsetB ?? duoAnimDef.offsetB ?? [0, 0, 0];
      const rotB = override?.rotB !== undefined ? override.rotB : (duoAnimDef.rotB ?? 0);
      duoDuration = duoAnimDef.duration;
      participants = [
        { characterId: leaderId, animationId: duoAnimDef.animA, localPos: [0, 0, 0], localRotY: 0 },
        { characterId: partnerId, animationId: duoAnimDef.animB, localPos: offsetB, localRotY: rotB },
      ];
    } else {
      participants = [
        { characterId, animationId: characterAnim || 'idle', localPos: [0, 0, 0], localRotY: 0 },
      ];
    }

    computeAnimationHeatmap(participants, { lockHipsXZ, duoDuration })
      .then((result) => {
        if (cancelled) return;
        setData(result);
        const { minX, maxX, minY, maxY, minZ, maxZ } = result.bounds;
        useAnimPreviewStore.setState({
          heatmapStats: {
            width: Math.round(maxX - minX),
            depth: Math.round(maxZ - minZ),
            height: Math.round(maxY - minY),
            radius: Math.round(result.footprintRadius),
            sampleCount: result.sampleCount,
            duration: result.duration,
            voxelCount: result.voxels.length,
          },
        });
        invalidate();
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('[AnimationHeatmapPreview]', err);
        useAnimPreviewStore.setState({ heatmapStats: null });
      });

    return () => {
      cancelled = true;
    };
  }, [characterId, characterAnim, duoAnimDef, duoPartnerId, lockHipsXZ, overrideTick, invalidate]);

  useEffect(() => {
    return () => {
      useAnimPreviewStore.setState({ heatmapStats: null });
    };
  }, []);

  return <AnimationHeatmapMesh data={data} showGround={showGround} show3D={show3D} />;
}
