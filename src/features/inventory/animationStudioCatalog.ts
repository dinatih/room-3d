import { ENHANCED_ANIM_OPTIONS, normalizeSearchStr, getAnimSources } from '@features/scene/CharacterAnimSelector';
import { getAnimationDef } from '@features/scene/animations/animationResolver';
import { DUO_ANIMATIONS, type DuoAnimationDef } from '@features/scene/animations/duoAnimations';
import type { ItemAnnotation, AnnotationStatus } from './useItemAnnotations';

export interface StudioAnimation {
  id: string;
  annotationId: string;
  label: string;
  category: string;
  sources: string[];
  duration?: number;
  searchIndex: string;
  duo?: DuoAnimationDef;
}

export const STUDIO_CATALOG: Record<'solo' | 'duo', StudioAnimation[]> = {
  solo: ENHANCED_ANIM_OPTIONS.map(a => ({
    id: a.value, annotationId: `anim:${a.value}`, label: a.label,
    category: a.category, sources: a.sources,
    duration: a.duration, searchIndex: a.searchIndex,
  })),
  duo: DUO_ANIMATIONS.map(a => ({
    id: a.id, annotationId: `duo:${a.id}`, label: a.label,
    category: a.isCombat ? 'combat' : 'social',
    sources: [...new Set([a.animA, a.animB].flatMap(id => getAnimSources(getAnimationDef(id)?.path)))],
    duration: a.duration,
    searchIndex: normalizeSearchStr([a.id, a.label, a.animA, a.animB, ...(a.tags ?? [])].join(' ')),
    duo: a,
  })),
};

export const SOURCE_LABELS: Record<string, string> = {
  interx: 'Inter-X', behave: 'BEHAVE', miley: 'Miley', mixamo: 'Mixamo',
  npz: 'NPZ', others: 'Autres', fab: 'Fab / ActorCore',
};

export interface StudioFilters {
  search: string;
  category: string;
  source: string;
  status: '' | AnnotationStatus | 'unannotated';
  tag: string;
  minDuration: string;
  maxDuration: string;
  sort: 'catalog' | 'name' | 'shortest' | 'longest';
}
export const EMPTY_STUDIO_FILTERS: StudioFilters = {
  search: '', category: '', source: '', status: '', tag: '',
  minDuration: '', maxDuration: '', sort: 'catalog',
};

export function filterStudioAnimations(catalog: StudioAnimation[], filters: StudioFilters, annotations: Record<string, ItemAnnotation>) {
  const tokens = normalizeSearchStr(filters.search).trim().split(/\s+/).map(token => token.replace(/^#/, '')).filter(Boolean);
  const result = catalog.filter(a => {
    const annotation = annotations[a.annotationId];
    if (filters.category && a.category !== filters.category) return false;
    if (filters.source && !a.sources.includes(filters.source)) return false;
    if (filters.status === 'unannotated' ? Boolean(annotation) : filters.status && annotation?.status !== filters.status) return false;
    if (filters.tag && !annotation?.tags.includes(filters.tag)) return false;
    if (filters.minDuration !== '' && (a.duration === undefined || a.duration < Number(filters.minDuration))) return false;
    if (filters.maxDuration !== '' && (a.duration === undefined || a.duration > Number(filters.maxDuration))) return false;
    const search = `${a.searchIndex} ${normalizeSearchStr([annotation?.notes, ...(annotation?.tags ?? [])].join(' '))}`;
    return tokens.every(token => search.includes(token));
  });
  if (filters.sort === 'name') result.sort((a, b) => a.label.localeCompare(b.label, 'fr'));
  if (filters.sort === 'shortest' || filters.sort === 'longest') result.sort((a, b) => {
    if (a.duration === undefined) return b.duration === undefined ? 0 : 1;
    if (b.duration === undefined) return -1;
    return (a.duration - b.duration) * (filters.sort === 'longest' ? -1 : 1);
  });
  return result;
}

export function adjacentStudioAnimation(results: StudioAnimation[], currentId: string | undefined, direction: 1 | -1) {
  if (!results.length) return undefined;
  const index = results.findIndex(a => a.id === currentId);
  return results[index < 0 ? (direction === 1 ? 0 : results.length - 1) : (index + direction + results.length) % results.length];
}
