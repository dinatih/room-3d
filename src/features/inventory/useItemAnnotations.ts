/**
 * useItemAnnotations.ts
 * Gestion des annotations et métadonnées dev stockées dans le LocalStorage.
 * Permet d'annoter n'importe quel élément : items 3D, SpatialZones, PNJ, meubles,
 * ainsi que les animations solo et duo.
 */
import { useState, useEffect, useCallback } from 'react';

export type AnnotationStatus = 'ok' | 'issue' | 'wip' | 'favorite' | 'delete';

export const ANNOTATION_STATUSES: Record<AnnotationStatus, { label: string; color: string }> = {
  ok: { label: '✅ OK', color: 'success' },
  issue: { label: '⚠️ Problème', color: 'danger' },
  wip: { label: '🚧 À revoir', color: 'warning' },
  favorite: { label: '⭐ Favori', color: 'primary' },
  delete: { label: '🗑️ À supprimer', color: 'danger' },
};
export const DEFAULT_QUICK_TAGS = ['top', 'glitch-pied', 'offset', 'wip', 'favori', 'cut', 'loop', 'sync'];
const RECENT_CUSTOM_TAGS_KEY = 'room3d_dev_recent_custom_tags';
const RECENT_CUSTOM_TAGS_COUNT = 5;

function loadRecentCustomTags(): string[] {
  return JSON.parse(localStorage.getItem(RECENT_CUSTOM_TAGS_KEY) ?? '[]');
}

export interface ItemAnnotation {
  tags: string[];
  status?: AnnotationStatus;
  notes?: string;
  customOffsets?: { x?: number; y?: number; z?: number; rotY?: number };
  duoPartner?: string;
  updatedAt: number;
}

const STORAGE_KEY = 'room3d_dev_annotations_v1';
const EVENT_NAME = 'room3d_dev_annotations_changed';

function loadAllAnnotations(): Record<string, ItemAnnotation> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch (e) {
    console.warn('[useItemAnnotations] Failed to parse local storage annotations', e);
    return {};
  }
}

function saveAllAnnotations(data: Record<string, ItemAnnotation>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch (e) {
    console.error('[useItemAnnotations] Failed to save annotations', e);
  }
}

export function updateAnnotation(id: string, partial: Partial<ItemAnnotation>): void {
  const all = loadAllAnnotations();
  const current = all[id] || { tags: [], updatedAt: Date.now() };
  all[id] = {
    ...current,
    ...partial,
    updatedAt: Date.now(),
  };
  saveAllAnnotations(all);
}

function clearAnnotation(id: string): void {
  const all = loadAllAnnotations();
  if (all[id]) {
    delete all[id];
    saveAllAnnotations(all);
  }
}

export function exportAnnotationsJson(): string {
  return JSON.stringify(loadAllAnnotations(), null, 2);
}

export function useItemAnnotations(targetId?: string) {
  const [annotations, setAnnotations] = useState<Record<string, ItemAnnotation>>(loadAllAnnotations);
  const [recentCustomTags, setRecentCustomTags] = useState<string[]>(loadRecentCustomTags);

  useEffect(() => {
    const handler = () => {
      setAnnotations(loadAllAnnotations());
      setRecentCustomTags(loadRecentCustomTags());
    };
    window.addEventListener(EVENT_NAME, handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener(EVENT_NAME, handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  const currentAnnotation = targetId ? annotations[targetId] : undefined;

  const update = useCallback(
    (partial: Partial<ItemAnnotation>) => {
      if (!targetId) return;
      updateAnnotation(targetId, partial);
    },
    [targetId]
  );

  const setStatus = useCallback(
    (status?: AnnotationStatus) => {
      if (!targetId) return;
      update({ status });
    },
    [targetId, update]
  );

  const setNotes = useCallback(
    (notes: string) => {
      if (!targetId) return;
      update({ notes });
    },
    [targetId, update]
  );

  const addTag = useCallback(
    (tag: string) => {
      if (!targetId) return;
      const clean = tag.trim().toLowerCase().replace(/^#/, '');
      if (!clean) return;
      const tags = currentAnnotation?.tags || [];
      if (!tags.includes(clean)) {
        update({ tags: [...tags, clean] });
      }
    },
    [targetId, currentAnnotation, update]
  );

  const removeTag = useCallback(
    (tagToRemove: string) => {
      if (!targetId) return;
      const tags = (currentAnnotation?.tags || []).filter(t => t !== tagToRemove);
      update({ tags });
    },
    [targetId, currentAnnotation, update]
  );

  const addCustomTag = useCallback((tag: string) => {
    if (!targetId) return;
    const clean = tag.trim().toLowerCase().replace(/^#/, '');
    if (!clean) return;
    addTag(clean);
    if (DEFAULT_QUICK_TAGS.includes(clean)) return;
    const recent = [clean, ...loadRecentCustomTags().filter(previous => previous !== clean)]
      .slice(0, RECENT_CUSTOM_TAGS_COUNT);
    localStorage.setItem(RECENT_CUSTOM_TAGS_KEY, JSON.stringify(recent));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }, [targetId, addTag]);

  const setCustomOffsets = useCallback(
    (offsets?: { x?: number; y?: number; z?: number; rotY?: number }) => {
      if (!targetId) return;
      update({ customOffsets: offsets });
    },
    [targetId, update]
  );

  const clear = useCallback(() => {
    if (!targetId) return;
    clearAnnotation(targetId);
  }, [targetId]);

  return {
    allAnnotations: annotations,
    annotation: currentAnnotation,
    update,
    setStatus,
    setNotes,
    addTag,
    addCustomTag,
    recentCustomTags,
    removeTag,
    setCustomOffsets,
    clear,
  };
}
