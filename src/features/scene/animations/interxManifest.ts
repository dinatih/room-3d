import data from './interx_manifest.json';
import type { AnimationCategory, AnimationDefinition } from './animationRegistry';
import type { DuoAnimationDef } from './duoAnimations';

export interface InterXManifest {
  schemaVersion: number;
  dataset: string;
  conversion: {
    revision: number;
    sourceFps: number;
    targetFps: number;
    upAxis: string;
    rootMotionMode: string;
    translationUnit: string;
  };
  actions: Array<{
    code: string;
    key: string;
    label: string;
    category: AnimationCategory;
    icon: string;
    isCombat: boolean;
    tags: string[];
  }>;
  duos: Array<{
    id: string;
    actionCode: string;
    variation: string;
    source: {
      recording: string;
      group: string;
      take: string;
      p1: string;
      p2: string;
      frameCount: number;
      sha256: { p1: string; p2: string };
    };
    clips: Record<'p1' | 'p2', {
      path: string;
      frameCount: number;
      durationSeconds: number;
      sizeBytes: number;
      sha256: string;
    }>;
    rootMotion: { mode: string; translationUnit: string; upAxis: string };
    start_offset: [number, number, number];
    placement?: { verticalOrigin: 'soles-preserve-hands' } | {
      verticalOrigin: 'source-support-preserve-hands';
      initialSoleHeightMeters: [number, number];
      sourceInitialSolesMeters: [number, number];
      sourceReferencePlaneMeters: number;
    };
    handMotion?: 'full-axis-angle';
    footSupport?: 'heel-support-envelope-v1';
    tags: string[];
  }>;
}

// JSON inference widens tuples and discriminants; validate the external data
// below before using it as the manifest contract.
export const INTERX_MANIFEST = data as unknown as InterXManifest;
if (data.schemaVersion !== 1 || data.dataset !== 'inter-x' || data.conversion.sourceFps !== 120 || data.conversion.targetFps !== 30) {
  throw new Error('Manifest Inter-X incompatible avec le pipeline de conversion');
}

const actionByCode = new Map(INTERX_MANIFEST.actions.map(action => [action.code, action]));
const ids = new Set<string>();
const paths = new Set<string>();
for (const duo of INTERX_MANIFEST.duos) {
  if (ids.has(duo.id) || !actionByCode.has(duo.actionCode)
    || duo.start_offset.length !== 3 || !duo.start_offset.every(Number.isFinite)
    || (duo.placement !== undefined && !['soles-preserve-hands', 'source-support-preserve-hands'].includes(duo.placement.verticalOrigin))
    || (duo.placement?.verticalOrigin === 'source-support-preserve-hands' &&
      (duo.placement.initialSoleHeightMeters.length !== 2 || !duo.placement.initialSoleHeightMeters.every(value => Number.isFinite(value) && value >= 0)))
    || (duo.handMotion !== undefined && duo.handMotion !== 'full-axis-angle')
    || (duo.footSupport !== undefined && duo.footSupport !== 'heel-support-envelope-v1')
    || duo.rootMotion.mode !== 'relative-to-first-frame'
    || duo.rootMotion.translationUnit !== 'meters' || duo.rootMotion.upAxis !== 'Y') {
    throw new Error(`Métadonnées Inter-X invalides : ${duo.id}`);
  }
  ids.add(duo.id);
  if (duo.placement?.verticalOrigin === 'source-support-preserve-hands') {
    const placement = duo.placement;
    if (placement.sourceInitialSolesMeters.length !== 2 || !placement.sourceInitialSolesMeters.every(Number.isFinite)
      || !Number.isFinite(placement.sourceReferencePlaneMeters)) {
      throw new Error(`Appuis SMPL-X invalides : ${duo.id}`);
    }
  }
  for (const clip of Object.values(duo.clips)) {
    if (paths.has(clip.path) || !/^animations\/npz\/interx\/g\d{3}t\d{3}a\d{3}r\d{3}-p[12]\.glb$/.test(clip.path)
      || !Number.isInteger(clip.frameCount) || clip.frameCount < 1
      || !Number.isFinite(clip.durationSeconds) || clip.durationSeconds < 0) {
      throw new Error(`Clip Inter-X invalide : ${clip.path}`);
    }
    paths.add(clip.path);
  }
  if (duo.clips.p1.frameCount !== duo.clips.p2.frameCount || duo.clips.p1.durationSeconds !== duo.clips.p2.durationSeconds) {
    throw new Error(`Participants Inter-X désynchronisés : ${duo.id}`);
  }
}

export const INTERX_ANIMATION_DEFINITIONS: AnimationDefinition[] = INTERX_MANIFEST.duos.flatMap(duo => {
  const action = actionByCode.get(duo.actionCode)!;
  return (['p1', 'p2'] as const).map(participant => ({
    id: `${duo.id}-${participant}`,
    category: action.category,
    path: duo.clips[participant].path,
    label: `Inter-X · ${action.label} (${duo.source.group}, ${duo.variation}, ${duo.source.take}, ${participant.toUpperCase()})`,
    tags: participant === 'p1' && duo.tags.includes('seated-front')
      ? [...duo.tags, 'sitting'] : duo.tags.filter(tag => participant === 'p1' || !['seated-front', 'with-seated-action'].includes(tag)),
    duration: duo.clips[participant].durationSeconds,
    rootMotionSpace: 'world-meters' as const,
  }));
});

export const INTERX_DUO_ANIMATIONS: DuoAnimationDef[] = INTERX_MANIFEST.duos.map(duo => {
  const action = actionByCode.get(duo.actionCode)!;
  return {
    id: duo.id,
    label: `Inter-X · ${action.label} (${duo.source.group}, ${duo.variation}, ${duo.source.take})`,
    icon: action.icon,
    isCombat: action.isCombat,
    animA: `${duo.id}-p1`,
    animB: `${duo.id}-p2`,
    offsetB: [
      duo.start_offset[0] * 100,
      0,
      duo.start_offset[2] * 100,
    ],
    rotB: 0,
    duration: duo.clips.p1.durationSeconds,
    tags: duo.tags,
  };
});
