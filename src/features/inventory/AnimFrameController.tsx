import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { useAnimPreviewStore } from './useAnimPreviewStore';
import {
  getAnimationDef,
  resolveAnimationId,
  subscribeAnimationOverrides,
  getAnimationTransformOverride,
  setAnimationTransformOverride,
  getDuoAnimationTransformOverride,
  setDuoAnimationTransformOverride,
  getAnimationSegmentsOverride,
  setAnimationSegmentsOverride,
} from '@features/scene/animations/animationResolver';
import { ANIMATION_DEFINITIONS, type AnimationDefinition } from '@features/scene/animations/animationRegistry';
import { CharacterAnimSelector, ANIM_CATEGORIES, getAnimCategory, getFilteredAnimOptions } from '@features/scene/CharacterAnimSelector';
import { DuoAnimSelector } from '@features/scene/DuoAnimSelector';
import { DuoPartnerSelector } from '@features/scene/DuoPartnerSelector';
import { DUO_ANIMATIONS, canCharacterPerformDuo, resolveDuoPreviewParticipants, type DuoAnimationDef } from '@features/scene/animations/duoAnimations';
import { CHARACTERS, isExtraCharacter } from '@features/scene/characterConfig';
import { useSceneStore } from '@features/scene/store/useSceneStore';

const SPEED_OPTIONS = [0.25, 0.5, 1, 1.5, 2];

export interface AnimFrameControllerProps {
  animName?: string;
  animKey?: string;
  animDef?: AnimationDefinition;
  onSelectAnim?: (animValue: string) => void;
  bottom?: number | string;
  className?: string;
  compact?: boolean;
  style?: React.CSSProperties;

  // Support Animations Duo
  keyboardEnabled?: boolean;
  allowSamePartner?: boolean;
  isHumanCharacter?: boolean;
  characterId?: string;
  duoAnimDef?: DuoAnimationDef;
  duoPartnerId?: string;
  onSelectDuoAnim?: (def: DuoAnimationDef | undefined) => void;
  onSelectDuoPartner?: (partnerId: string) => void;
  animalAnimOptions?: { value: string; label: string }[];
}

export function AnimFrameController({
  animName,
  animKey,
  animDef,
  onSelectAnim,
  bottom = 8,
  className = '',
  compact = false,
  style = {},
  keyboardEnabled = true,
  allowSamePartner = false,
  isHumanCharacter = false,
  characterId,
  duoAnimDef,
  duoPartnerId,
  onSelectDuoAnim,
  onSelectDuoPartner,
  animalAnimOptions,
}: AnimFrameControllerProps) {
  const {
    isPlaying,
    currentTime,
    duration,
    fps,
    speed,
    isTPose,
    clipName,
    animSearch,
    selectedCategories,
    sortByDuration,
    lockHipsXZ,
    togglePlay,
    toggleLockHipsXZ,
    setSpeed,
    setScrubbing,
    seekToFrame,
    stepFrame,
  } = useAnimPreviewStore();

  const [inputFrame, setInputFrame] = useState<string>('');
  const [isEditingFrame, setIsEditingFrame] = useState<boolean>(false);
  const [showMeta, setShowMeta] = useState<boolean>(false);
  const [showAnimSelector, setShowAnimSelector] = useState<boolean>(false);
  const [showDuoSelector, setShowDuoSelector] = useState<boolean>(false);
  const [showPartnerSelector, setShowPartnerSelector] = useState<boolean>(false);
  const [selectorPosition, setSelectorPosition] = useState({ left: 0, bottom: 0, maxHeight: '70vh' });
  const [duoSelectorPosition, setDuoSelectorPosition] = useState({ left: 0, bottom: 0, maxHeight: '70vh' });
  const [partnerSelectorPosition, setPartnerSelectorPosition] = useState({ left: 0, bottom: 0 });
  const controllerRef = useRef<HTMLDivElement>(null);
  const sliderRef = useRef<HTMLInputElement>(null);
  const selectorRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLButtonElement>(null);
  const duoBadgeRef = useRef<HTMLButtonElement>(null);
  const duoSelectorRef = useRef<HTMLDivElement>(null);
  const partnerBadgeRef = useRef<HTMLButtonElement>(null);
  const partnerSelectorRef = useRef<HTMLDivElement>(null);

  const totalFrames = duration > 0 ? Math.max(1, Math.round(duration * fps)) : 0;
  const currentFrame = duration > 0 ? Math.min(totalFrames, Math.round(currentTime * fps)) : 0;

  useEffect(() => {
    if (!isEditingFrame) {
      setInputFrame(currentFrame.toString());
    }
  }, [currentFrame, isEditingFrame]);

  // Résolution de la définition complète de l'animation
  const targetKey = animKey || animName || clipName;
  const def = useMemo(() => {
    if (animDef) return animDef;
    if (!targetKey) return undefined;
    const direct = getAnimationDef(targetKey);
    if (direct) return direct;
    const clean = targetKey.trim().toLowerCase();
    return ANIMATION_DEFINITIONS.find(
      d =>
        d.id.toLowerCase() === clean ||
        d.label?.toLowerCase() === clean ||
        d.path.toLowerCase().includes(clean) ||
        d.aliases?.some(a => a.toLowerCase() === clean)
    );
  }, [animDef, animKey, animName, clipName, targetKey]);

  const catKey = def?.path ? getAnimCategory(def.path) : undefined;
  const catObj = catKey ? ANIM_CATEGORIES.find(c => c.key === catKey) : undefined;

  const extraCharacters = useSceneStore(state => state.layers.extraCharacters ?? false);
  const effectiveLeaderId = duoAnimDef && characterId
    ? resolveDuoPreviewParticipants(duoAnimDef, characterId, duoPartnerId).leaderId
    : characterId;
  const availablePartners = useMemo(() => {
    return CHARACTERS.filter(c => (allowSamePartner || c.id !== effectiveLeaderId) && (!duoAnimDef || canCharacterPerformDuo(c.id, duoAnimDef)) && (extraCharacters || !isExtraCharacter(c.id)));
  }, [effectiveLeaderId, extraCharacters, allowSamePartner, duoAnimDef]);

  useEffect(() => {
    if (duoAnimDef && duoPartnerId && !canCharacterPerformDuo(duoPartnerId, duoAnimDef)) {
      const replacement = availablePartners[0];
      if (replacement) onSelectDuoPartner?.(replacement.id);
    }
  }, [duoAnimDef, duoPartnerId, availablePartners, onSelectDuoPartner]);

  const defA = useMemo(() => {
    if (!duoAnimDef) return undefined;
    return getAnimationDef(duoAnimDef.animA);
  }, [duoAnimDef]);

  const defB = useMemo(() => {
    if (!duoAnimDef) return undefined;
    return getAnimationDef(duoAnimDef.animB);
  }, [duoAnimDef]);

  const charAName = useMemo(() => {
    return CHARACTERS.find(c => c.id === effectiveLeaderId)?.name || effectiveLeaderId || 'Personnage A';
  }, [effectiveLeaderId]);

  const charBName = useMemo(() => {
    const pId = duoPartnerId || availablePartners[0]?.id;
    return CHARACTERS.find(c => c.id === pId)?.name || pId || 'Personnage B';
  }, [duoPartnerId, availablePartners]);

  const displayName = useMemo(() => {
    if (duoAnimDef) {
      return duoAnimDef.label;
    }
    if (animName && !animName.includes('/') && !animName.endsWith('.glb')) {
      return animName;
    }
    return def?.label || animName || clipName || def?.id || 'Animation';
  }, [duoAnimDef, animName, def, clipName]);

  const hasMeta = Boolean(def || isTPose || duoAnimDef);
  const activeAnimValue = animKey || def?.id || 'idle';

  // State local d'invalidation pour refléter immédiatement les modifications d'offset
  const [, setOverrideTick] = useState(0);
  const [copiedSoloTs, setCopiedSoloTs] = useState(false);
  const [copiedDuoTs, setCopiedDuoTs] = useState(false);
  const [showTrimPanel, setShowTrimPanel] = useState<boolean>(false);
  const [copiedTrimTs, setCopiedTrimTs] = useState<boolean>(false);

  useEffect(() => {
    return subscribeAnimationOverrides(() => {
      setOverrideTick(t => t + 1);
    });
  }, []);

  // Découpes / segments effectifs (registre + overrides live)
  const segmentsOverride = def ? getAnimationSegmentsOverride(def.id) : undefined;
  const hasSegmentsOverride = segmentsOverride !== undefined;
  const effectiveSegments = useMemo<Array<[number, number]>>(() => {
    if (segmentsOverride !== undefined) return segmentsOverride;
    if (def?.segments && def.segments.length > 0) return def.segments;
    return [];
  }, [segmentsOverride, def]);

  // Synchronisation des segments actifs dans le store pour la lecture
  const setActiveSegments = useAnimPreviewStore(state => state.setActiveSegments);
  useEffect(() => {
    setActiveSegments(effectiveSegments);
  }, [effectiveSegments, setActiveSegments]);

  const handleUpdateSegments = useCallback((nextSegs: Array<[number, number]> | null) => {
    if (!def) return;
    setAnimationSegmentsOverride(def.id, nextSegs);
  }, [def]);

  const handleResetSegments = useCallback(() => {
    if (!def) return;
    setAnimationSegmentsOverride(def.id, null);
  }, [def]);

  const handleCopyTrimTs = useCallback(() => {
    if (!def) return;
    if (!effectiveSegments || effectiveSegments.length === 0) {
      navigator.clipboard.writeText('// Aucun segment / trim (animation entière)');
    } else {
      const formatted = effectiveSegments
        .map(([s, e]) => `    [${s.toFixed(2)}, ${e.toFixed(2)}],`)
        .join('\n');
      const snippet = `  segments: [\n${formatted}\n  ],`;
      navigator.clipboard.writeText(snippet);
    }
    setCopiedTrimTs(true);
    setTimeout(() => setCopiedTrimTs(false), 2000);
  }, [def, effectiveSegments]);

  // Décalages effectifs (registre + overrides live)
  const soloOverride = def ? getAnimationTransformOverride(def.id) : undefined;
  const hasSoloOverride = Boolean(soloOverride && (soloOverride.offset !== undefined || soloOverride.rotY !== undefined));
  const effectiveSoloOffset = useMemo<[number, number, number]>(() => {
    if (soloOverride?.offset) return soloOverride.offset;
    if (def?.defaultOffset) return [def.defaultOffset[0], def.defaultOffset[1], def.defaultOffset[2]];
    return [0, 0, 0];
  }, [soloOverride, def]);

  const effectiveSoloRotYRad = soloOverride?.rotY !== undefined ? soloOverride.rotY : (def?.defaultRotYOffset ?? 0);
  const effectiveSoloRotYDeg = (effectiveSoloRotYRad * 180) / Math.PI;

  const handleUpdateSoloOffset = useCallback((axis: 0 | 1 | 2, val: number) => {
    if (!def) return;
    const nextOffset: [number, number, number] = [...effectiveSoloOffset];
    nextOffset[axis] = val;
    setAnimationTransformOverride(def.id, { offset: nextOffset });
  }, [def, effectiveSoloOffset]);

  const handleUpdateSoloRotDeg = useCallback((deg: number) => {
    if (!def) return;
    const rad = (deg * Math.PI) / 180;
    setAnimationTransformOverride(def.id, { rotY: rad });
  }, [def]);

  const handleResetSoloTransform = useCallback(() => {
    if (!def) return;
    setAnimationTransformOverride(def.id, null);
  }, [def]);

  const handleCopySoloTs = useCallback(() => {
    if (!def) return;
    const lines: string[] = [];
    if (effectiveSoloOffset[0] !== 0 || effectiveSoloOffset[1] !== 0 || effectiveSoloOffset[2] !== 0) {
      lines.push(`defaultOffset: [${effectiveSoloOffset.join(', ')}],`);
    }
    if (effectiveSoloRotYRad !== 0) {
      const rotExp = Math.abs(effectiveSoloRotYRad - Math.PI) < 0.001
        ? 'Math.PI'
        : Math.abs(effectiveSoloRotYRad - Math.PI / 2) < 0.001
        ? 'Math.PI / 2'
        : Math.abs(effectiveSoloRotYRad + Math.PI / 2) < 0.001
        ? '-Math.PI / 2'
        : `${(effectiveSoloRotYRad).toFixed(3)}`;
      lines.push(`defaultRotYOffset: ${rotExp},`);
    }
    const snippet = lines.join('\n');
    navigator.clipboard.writeText(snippet || '// Aucun offset (0, 0, 0 / 0°)');
    setCopiedSoloTs(true);
    setTimeout(() => setCopiedSoloTs(false), 2000);
  }, [def, effectiveSoloOffset, effectiveSoloRotYRad]);

  // Duo transforms
  const duoOverride = duoAnimDef ? getDuoAnimationTransformOverride(duoAnimDef.id) : undefined;
  const hasDuoOverride = Boolean(duoOverride && (duoOverride.offsetB !== undefined || duoOverride.rotB !== undefined));
  const effectiveOffsetB = useMemo<[number, number, number]>(() => {
    if (duoOverride?.offsetB) return duoOverride.offsetB;
    if (duoAnimDef?.offsetB) return [duoAnimDef.offsetB[0], duoAnimDef.offsetB[1], duoAnimDef.offsetB[2]];
    return [0, 0, 0];
  }, [duoOverride, duoAnimDef]);

  const effectiveRotBRad = duoOverride?.rotB !== undefined ? duoOverride.rotB : (duoAnimDef?.rotB ?? 0);
  const effectiveRotBDeg = (effectiveRotBRad * 180) / Math.PI;

  const handleUpdateDuoOffset = useCallback((axis: 0 | 1 | 2, val: number) => {
    if (!duoAnimDef) return;
    const nextOffset: [number, number, number] = [...effectiveOffsetB];
    nextOffset[axis] = val;
    setDuoAnimationTransformOverride(duoAnimDef.id, { offsetB: nextOffset });
  }, [duoAnimDef, effectiveOffsetB]);

  const handleUpdateDuoRotDeg = useCallback((deg: number) => {
    if (!duoAnimDef) return;
    const rad = (deg * Math.PI) / 180;
    setDuoAnimationTransformOverride(duoAnimDef.id, { rotB: rad });
  }, [duoAnimDef]);

  const handleResetDuoTransform = useCallback(() => {
    if (!duoAnimDef) return;
    setDuoAnimationTransformOverride(duoAnimDef.id, null);
  }, [duoAnimDef]);

  const handleCopyDuoTs = useCallback(() => {
    if (!duoAnimDef) return;
    const lines: string[] = [];
    if (effectiveOffsetB[0] !== 0 || effectiveOffsetB[1] !== 0 || effectiveOffsetB[2] !== 0) {
      lines.push(`offsetB: [${effectiveOffsetB.join(', ')}],`);
    }
    if (effectiveRotBRad !== 0) {
      const rotExp = Math.abs(effectiveRotBRad - Math.PI) < 0.001
        ? 'Math.PI'
        : Math.abs(effectiveRotBRad - Math.PI / 2) < 0.001
        ? 'Math.PI / 2'
        : Math.abs(effectiveRotBRad + Math.PI / 2) < 0.001
        ? '-Math.PI / 2'
        : `${(effectiveRotBRad).toFixed(3)}`;
      lines.push(`rotB: ${rotExp},`);
    }
    const snippet = lines.join('\n');
    navigator.clipboard.writeText(snippet || '// Aucun offset B (0, 0, 0 / 0°)');
    setCopiedDuoTs(true);
    setTimeout(() => setCopiedDuoTs(false), 2000);
  }, [duoAnimDef, effectiveOffsetB, effectiveRotBRad]);

  const handleSelectAnim = useCallback((val: string, keepOpen = false) => {
    if (onSelectAnim) {
      onSelectAnim(val);
    } else {
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'character-anim-lara', value: val } }));
      document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key: 'character-anim-xbot', value: val } }));
      useAnimPreviewStore.getState().play();
    }
    if (!keepOpen) setShowAnimSelector(false);
  }, [onSelectAnim]);

  const currentPartnerId = duoPartnerId || availablePartners[0]?.id;
  const currentPartnerObj = useMemo(() => {
    return CHARACTERS.find(c => c.id === currentPartnerId);
  }, [currentPartnerId]);

  const handleSelectDuoAnim = useCallback((selectedDef: DuoAnimationDef | undefined, keepOpen = false) => {
    if (onSelectDuoAnim) {
      onSelectDuoAnim(selectedDef);
    }
    if (selectedDef) {
      useAnimPreviewStore.getState().seekToTime(0);
      useAnimPreviewStore.getState().play();
    }
    if (!keepOpen) setShowDuoSelector(false);
  }, [onSelectDuoAnim]);

  const handleRandomPartner = useCallback(() => {
    if (!availablePartners.length) return;
    const currentPartner = duoPartnerId || availablePartners[0]?.id;
    const pool = availablePartners.filter(p => p.id !== currentPartner);
    const list = pool.length > 0 ? pool : availablePartners;
    const rand = list[Math.floor(Math.random() * list.length)];
    if (rand) {
      onSelectDuoPartner?.(rand.id);
    }
  }, [availablePartners, duoPartnerId, onSelectDuoPartner]);

  const handleRandomDuoAnim = useCallback(() => {
    if (!onSelectDuoAnim || !availablePartners.length) return;
    const pool = DUO_ANIMATIONS.filter(anim => anim.id !== duoAnimDef?.id);
    const choices = pool.length ? pool : DUO_ANIMATIONS;
    const randomAnim = choices[Math.floor(Math.random() * choices.length)];
    if (!randomAnim) return;
    onSelectDuoAnim(randomAnim);
    const leaderId = characterId
      ? resolveDuoPreviewParticipants(randomAnim, characterId, duoPartnerId).leaderId
      : undefined;
    const partners = CHARACTERS.filter(c => (allowSamePartner || c.id !== leaderId) && canCharacterPerformDuo(c.id, randomAnim) && (extraCharacters || !isExtraCharacter(c.id)));
    const partner = partners[Math.floor(Math.random() * partners.length)];
    if (partner) onSelectDuoPartner?.(partner.id);
    useAnimPreviewStore.getState().seekToTime(0);
    useAnimPreviewStore.getState().play();
  }, [onSelectDuoAnim, availablePartners, duoAnimDef, characterId, duoPartnerId, allowSamePartner, extraCharacters, onSelectDuoPartner]);

  // Animations filtrées selon la recherche et catégories de CharacterAnimSelector
  const filteredAnims = useMemo(() => {
    return animalAnimOptions ?? getFilteredAnimOptions(animSearch, selectedCategories, sortByDuration);
  }, [animSearch, selectedCategories, sortByDuration, animalAnimOptions]);

  // Navigation précédente / suivante limitée strictement aux résultats filtrés
  const cycleFilteredAnim = useCallback((direction: 'next' | 'prev') => {
    if (!filteredAnims.length) return;
    const currentVal = activeAnimValue;
    const targetId = resolveAnimationId(currentVal);
    const currIdx = filteredAnims.findIndex(a => a.value === targetId || a.value === currentVal);
    let nextIdx = 0;
    if (currIdx === -1) {
      nextIdx = direction === 'next' ? 0 : filteredAnims.length - 1;
    } else {
      nextIdx = direction === 'next'
        ? (currIdx + 1) % filteredAnims.length
        : (currIdx - 1 + filteredAnims.length) % filteredAnims.length;
    }
    const nextVal = filteredAnims[nextIdx].value;
    handleSelectAnim(nextVal);
  }, [filteredAnims, activeAnimValue, handleSelectAnim]);

  // Navigation précédente / suivante pour les animations duo
  const cycleFilteredDuoAnim = useCallback((direction: 'next' | 'prev') => {
    if (!onSelectDuoAnim || !DUO_ANIMATIONS.length) return;
    const currentId = duoAnimDef?.id;
    const currIdx = DUO_ANIMATIONS.findIndex(a => a.id === currentId);
    let nextIdx = 0;
    if (currIdx === -1) {
      nextIdx = direction === 'next' ? 0 : DUO_ANIMATIONS.length - 1;
    } else {
      nextIdx = direction === 'next'
        ? (currIdx + 1) % DUO_ANIMATIONS.length
        : (currIdx - 1 + DUO_ANIMATIONS.length) % DUO_ANIMATIONS.length;
    }
    const nextAnim = DUO_ANIMATIONS[nextIdx];
    handleSelectDuoAnim(nextAnim, showDuoSelector);
    if (nextAnim && characterId) {
      const leaderId = resolveDuoPreviewParticipants(nextAnim, characterId, duoPartnerId).leaderId;
      const validPartners = CHARACTERS.filter(
        c => (allowSamePartner || c.id !== leaderId) && canCharacterPerformDuo(c.id, nextAnim) && (extraCharacters || !isExtraCharacter(c.id))
      );
      if (validPartners.length > 0 && (!duoPartnerId || !canCharacterPerformDuo(duoPartnerId, nextAnim))) {
        onSelectDuoPartner?.(validPartners[0].id);
      }
    }
  }, [onSelectDuoAnim, duoAnimDef, showDuoSelector, characterId, duoPartnerId, allowSamePartner, extraCharacters, handleSelectDuoAnim, onSelectDuoPartner]);

  // Sélection aléatoire d'une animation parmi la liste filtrée
  const handleRandomAnim = useCallback(() => {
    if (!filteredAnims.length) return;
    const currentVal = activeAnimValue;
    const targetId = resolveAnimationId(currentVal);
    let pool = filteredAnims.filter(a => a.value !== targetId && a.value !== currentVal);
    if (!pool.length) pool = filteredAnims;
    const randomIndex = Math.floor(Math.random() * pool.length);
    handleSelectAnim(pool[randomIndex].value);
    useAnimPreviewStore.getState().seekToTime(0);
    useAnimPreviewStore.getState().play();
  }, [filteredAnims, activeAnimValue, handleSelectAnim]);

  // Raccourcis clavier : Espace (Play/Pause), Flèches Gauche/Droite (-1/+1 frame), Début (Frame 0), Flèches Haut/Bas (Cycle Anim filtré)
  useEffect(() => {
    if (!keyboardEnabled) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      const targetEl = e.target as HTMLElement | null;
      if (
        targetEl &&
        (targetEl.tagName === 'INPUT' ||
          targetEl.tagName === 'TEXTAREA' ||
          targetEl.tagName === 'SELECT' ||
          targetEl.isContentEditable)
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'a' || e.key.toLowerCase() === 'z') {
        if (e.defaultPrevented) return;
        if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || !isHumanCharacter) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key.toLowerCase() === 'a') {
          setShowAnimSelector(v => !v);
          setShowDuoSelector(false);
          setShowPartnerSelector(false);
        } else if (e.key.toLowerCase() === 'z' && onSelectDuoAnim) {
          setShowDuoSelector(v => !v);
          setShowAnimSelector(false);
          setShowPartnerSelector(false);
        }
        return;
      }

      if (e.key.toLowerCase() === 'd' || e.key.toLowerCase() === 'c') {
        if (e.defaultPrevented) return;
        if (e.repeat || e.ctrlKey || e.altKey || e.metaKey || !isHumanCharacter) return;
        if (e.key.toLowerCase() === 'c' && !onSelectDuoAnim) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        if (e.key.toLowerCase() === 'd') handleRandomAnim();
        else handleRandomDuoAnim();
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        e.stopPropagation();
        togglePlay();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        stepFrame(e.shiftKey ? -5 : -1);
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        stepFrame(e.shiftKey ? 5 : 1);
        return;
      }

      if (e.key === 'Home' || e.key === '0') {
        e.preventDefault();
        e.stopPropagation();
        seekToFrame(0);
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        e.stopPropagation();
        if (duoAnimDef || showDuoSelector) {
          cycleFilteredDuoAnim('prev');
        } else {
          cycleFilteredAnim('prev');
        }
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        e.stopPropagation();
        if (duoAnimDef || showDuoSelector) {
          cycleFilteredDuoAnim('next');
        } else {
          cycleFilteredAnim('next');
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyboardEnabled, isHumanCharacter, onSelectDuoAnim, duoAnimDef, showDuoSelector, togglePlay, stepFrame, seekToFrame, cycleFilteredAnim, cycleFilteredDuoAnim, handleRandomAnim, handleRandomDuoAnim]);

  const handleFrameCommit = () => {
    setIsEditingFrame(false);
    const parsed = parseInt(inputFrame, 10);
    if (!isNaN(parsed)) {
      seekToFrame(parsed);
    } else {
      setInputFrame(currentFrame.toString());
    }
  };

  // Fermer les sélecteurs d'animation lors d'un clic extérieur
  useEffect(() => {
    if (!showAnimSelector && !showDuoSelector && !showPartnerSelector) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        showAnimSelector &&
        selectorRef.current &&
        !selectorRef.current.contains(target) &&
        badgeRef.current &&
        !badgeRef.current.contains(target)
      ) {
        setShowAnimSelector(false);
      }
      if (
        showDuoSelector &&
        duoSelectorRef.current &&
        !duoSelectorRef.current.contains(target) &&
        duoBadgeRef.current &&
        !duoBadgeRef.current.contains(target)
      ) {
        setShowDuoSelector(false);
      }
      if (
        showPartnerSelector &&
        partnerSelectorRef.current &&
        !partnerSelectorRef.current.contains(target) &&
        partnerBadgeRef.current &&
        !partnerBadgeRef.current.contains(target)
      ) {
        setShowPartnerSelector(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [showAnimSelector, showDuoSelector, showPartnerSelector]);

  useLayoutEffect(() => {
    if (!showAnimSelector) return;
    const controller = controllerRef.current!;
    const selector = selectorRef.current!;
    const badge = badgeRef.current!;
    const alignSelector = () => {
      const buttonRect = badge.getBoundingClientRect();
      const controllerRect = controller.getBoundingClientRect();
      const buttonLeft = buttonRect.left - controllerRect.left - controller.clientLeft;
      setSelectorPosition({
        maxHeight: `min(70vh, ${Math.max(0, buttonRect.top)}px)`,
        left: Math.max(0, Math.min(buttonLeft, controller.clientWidth - selector.offsetWidth)),
        bottom: controller.clientHeight - (buttonRect.top - controllerRect.top - controller.clientTop),
      });
    };
    alignSelector();
    const observer = new ResizeObserver(alignSelector);
    observer.observe(controller);
    observer.observe(badge);
    window.addEventListener('resize', alignSelector);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', alignSelector);
    };
  }, [showAnimSelector]);

  useLayoutEffect(() => {
    if (!showDuoSelector) return;
    const controller = controllerRef.current;
    const selector = duoSelectorRef.current;
    const badge = duoBadgeRef.current;
    if (!controller || !selector || !badge) return;
    const alignSelector = () => {
      const buttonRect = badge.getBoundingClientRect();
      const controllerRect = controller.getBoundingClientRect();
      const buttonLeft = buttonRect.left - controllerRect.left - controller.clientLeft;
      setDuoSelectorPosition({
        maxHeight: `min(70vh, ${Math.max(0, buttonRect.top)}px)`,
        left: Math.max(0, Math.min(buttonLeft, controller.clientWidth - selector.offsetWidth)),
        bottom: controller.clientHeight - (buttonRect.top - controllerRect.top - controller.clientTop),
      });
    };
    alignSelector();
    const observer = new ResizeObserver(alignSelector);
    observer.observe(controller);
    observer.observe(badge);
    window.addEventListener('resize', alignSelector);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', alignSelector);
    };
  }, [showDuoSelector]);

  useLayoutEffect(() => {
    if (!showPartnerSelector) return;
    const controller = controllerRef.current;
    const selector = partnerSelectorRef.current;
    const badge = partnerBadgeRef.current;
    if (!controller || !selector || !badge) return;
    const alignSelector = () => {
      const buttonRect = badge.getBoundingClientRect();
      const controllerRect = controller.getBoundingClientRect();
      const buttonLeft = buttonRect.left - controllerRect.left - controller.clientLeft;
      setPartnerSelectorPosition({
        left: Math.max(0, Math.min(buttonLeft, controller.clientWidth - selector.offsetWidth)),
        bottom: controller.clientHeight - (buttonRect.top - controllerRect.top - controller.clientTop),
      });
    };
    alignSelector();
    const observer = new ResizeObserver(alignSelector);
    observer.observe(controller);
    observer.observe(badge);
    return () => observer.disconnect();
  }, [showPartnerSelector]);

  return (
    <div
      ref={controllerRef}
      className={`card glass-card rounded-3 shadow-sm ${compact ? 'p-1 small' : 'p-2'} text-dark user-select-none ${className}`}
      onClick={e => e.stopPropagation()}
      onMouseDown={e => e.stopPropagation()}
      style={{
        position: 'absolute',
        bottom,
        left: 10,
        right: 10,
        zIndex: 90,
        ...style,
        ...(style?.position && style.position !== 'absolute' ? { bottom: undefined, left: undefined, right: undefined } : {}),
      }}
    >
      {/* Popover Sélecteur d'animation CharacterAnimSelector */}
      {showAnimSelector && (
        <div
          ref={selectorRef}
          className="view-control-bar__character-popover view-control-bar__animation-popover glass-card rounded-2 border shadow-lg d-flex flex-column"
          style={{
            position: 'absolute',
            ...selectorPosition,
            maxWidth: '100%',
            zIndex: 1000,
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <CharacterAnimSelector
            activeAnimValue={activeAnimValue}
            maxHeight={selectorPosition.maxHeight}
            onSelectAnim={handleSelectAnim}
            onClose={() => setShowAnimSelector(false)}
            title="Animations Personnage"
            autoFocus={true}
          />
        </div>
      )}

      {/* Popover Sélecteur d'animation Duo DuoAnimSelector */}
      {showDuoSelector && (
        <div
          ref={duoSelectorRef}
          className="view-control-bar__character-popover view-control-bar__animation-popover glass-card rounded-2 border shadow-lg d-flex flex-column"
          style={{
            position: 'absolute',
            ...duoSelectorPosition,
            maxWidth: '100%',
            zIndex: 1000,
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <DuoAnimSelector
            activeDuoId={duoAnimDef?.id}
            maxHeight={duoSelectorPosition.maxHeight}
            onSelectDuoAnim={handleSelectDuoAnim}
            onClose={() => setShowDuoSelector(false)}
            title="Animations Duo"
            autoFocus={true}
          />
        </div>
      )}

      {/* Popover Sélecteur de partenaire Duo DuoPartnerSelector */}
      {showPartnerSelector && (
        <div
          ref={partnerSelectorRef}
          className="view-control-bar__character-popover glass-card rounded-2 border shadow-lg d-flex flex-column"
          style={{
            position: 'absolute',
            ...partnerSelectorPosition,
            maxWidth: '100%',
            zIndex: 1000,
          }}
          onClick={e => e.stopPropagation()}
          onMouseDown={e => e.stopPropagation()}
        >
          <DuoPartnerSelector
            availablePartners={availablePartners}
            activePartnerId={currentPartnerId}
            onSelectPartner={(pId) => {
              onSelectDuoPartner?.(pId);
              setShowPartnerSelector(false);
            }}
            onClose={() => setShowPartnerSelector(false)}
            title="Partenaire Duo (Rôle B)"
            autoFocus={true}
          />
        </div>
      )}

      {/* ── Ligne 1 : Timeline Slider ── */}
      <div className="d-flex align-items-center gap-2 w-100 mb-1">
        <span className="text-muted font-monospace small">0</span>
        <input
          ref={sliderRef}
          type="range"
          className="form-range form-range-sm flex-grow-1"
          min={0}
          max={totalFrames}
          step={1}
          value={currentFrame}
          disabled={isTPose || totalFrames === 0}
          onPointerDown={() => setScrubbing(true)}
          onPointerUp={() => setScrubbing(false)}
          onChange={e => seekToFrame(parseInt(e.target.value, 10))}
          style={{ cursor: isTPose ? 'not-allowed' : 'pointer' }}
          title={
            isTPose
              ? 'T-Pose (Pose statique sans frame)'
              : `Frame ${currentFrame} / ${totalFrames} (${currentTime.toFixed(2)}s)`
          }
        />
        <span className="text-muted font-monospace small">{totalFrames}</span>
      </div>

      {/* ── Ligne 2 : Transport, Compteurs, Sélecteur & Actions ── */}
      <div className="anim-frame-controller__controls align-items-center justify-content-between flex-wrap gap-1">
        {/* Gauche : Transport, Vitesse et Compteurs groupés ensemble */}
        <div className="d-flex align-items-center flex-wrap gap-1">
          {/* Groupe boutons de lecture */}
          <div className="btn-group btn-group-sm" role="group">
            <button
              type="button"
              className="btn py-0 px-2 btn-outline-secondary text-dark"
              onClick={() => seekToFrame(0)}
              disabled={isTPose}
              title="Début (Frame 0 — Début / 0)"
            >
              <i className="bi bi-skip-backward-fill" />
            </button>
            <button
              type="button"
              className="btn py-0 px-2 btn-outline-secondary text-dark"
              onClick={() => stepFrame(-1)}
              disabled={isTPose}
              title="Frame précédente (-1f — Flèche Gauche, Maj: -5f)"
            >
              <i className="bi bi-caret-left-fill" />
            </button>
            <button
              type="button"
              className={`btn py-0 px-2 fw-bold d-inline-flex align-items-center gap-1 ${
                isPlaying ? 'btn-danger text-white shadow-sm' : 'btn-warning text-dark shadow-sm'
              }`}
              onClick={togglePlay}
              disabled={isTPose}
              title={isPlaying ? 'Pause (Espace)' : 'Play (Espace)'}
            >
              <i className={isPlaying ? 'bi bi-pause-fill' : 'bi bi-play-fill'} />
              <span>{isPlaying ? 'Pause' : 'Play'}</span>
            </button>
            <button
              type="button"
              className="btn py-0 px-2 btn-outline-secondary text-dark"
              onClick={() => stepFrame(1)}
              disabled={isTPose}
              title="Frame suivante (+1f — Flèche Droite, Maj: +5f)"
            >
              <i className="bi bi-caret-right-fill" />
            </button>
          </div>

          {/* Vitesse de lecture */}
          <div className="d-flex align-items-center gap-1">
            <i className="bi bi-lightning-charge text-muted small" aria-hidden="true" />
            <select
              className="form-select form-select-sm py-0 ps-1.5 pe-4 bg-transparent text-dark w-auto"
              value={speed}
              onChange={e => setSpeed(parseFloat(e.target.value))}
              title="Vitesse de lecture"
            >
              {SPEED_OPTIONS.map(s => (
                <option key={s} value={s}>
                  {s}x
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Lock Hips XZ (Sur place / In-place vs Déplacement réel) */}
          <button
            type="button"
            className={`btn btn-sm py-0 px-2 d-inline-flex align-items-center gap-1 ${
              lockHipsXZ
                ? 'btn-danger text-white shadow-sm'
                : 'btn-outline-secondary text-dark'
            }`}
            onClick={toggleLockHipsXZ}
            title={
              lockHipsXZ
                ? 'Hips-Lock ACTIF : Déplacement horizontal X/Z bloqué au centre (cliquer pour libérer)'
                : 'Hips-Lock INACTIF : Déplacement horizontal X/Z libre dans l\'espace (cliquer pour verrouiller sur place)'
            }
          >
            <i className={`bi ${lockHipsXZ ? 'bi-pin-fill' : 'bi-arrows-move'}`} aria-hidden="true" />
            <span className="small">{lockHipsXZ ? 'Hips-Lock (Fixe)' : 'Trajectoire libre'}</span>
          </button>

          {/* Compteur précis de Frame & Temps */}
          <div className="d-flex align-items-center gap-1">
            {isTPose ? (
              <span className="badge bg-success-subtle text-success border border-success-subtle">
                <i className="bi bi-person-standing" aria-hidden="true" /> T-Pose (Rest)
              </span>
            ) : (
              <>
                <div className="input-group input-group-sm font-monospace w-auto" title="Cliquer pour entrer une frame précise">
                  <span className="input-group-text py-0 px-1 bg-transparent text-muted border-end-0 small">
                    Frame:
                  </span>
                  <input
                    type="number"
                    min={0}
                    max={totalFrames}
                    value={inputFrame}
                    onFocus={() => setIsEditingFrame(true)}
                    onChange={e => setInputFrame(e.target.value)}
                    onBlur={handleFrameCommit}
                    onKeyDown={e => e.key === 'Enter' && handleFrameCommit()}
                    className="form-control py-0 bg-transparent text-dark border-start-0 border-end-0 text-center fw-bold px-1"
                    style={{ width: '3.2rem' }}
                  />
                  <span className="input-group-text py-0 px-1 bg-transparent text-muted border-start-0 small">
                    /{totalFrames}
                  </span>
                </div>
                <span
                  className="badge bg-transparent text-dark border shadow-sm font-monospace py-1 px-1.5 text-center"
                  style={{ minWidth: '7.5rem', fontVariantNumeric: 'tabular-nums' }}
                >
                  {currentTime.toFixed(2)}s/{duration.toFixed(2)}s
                </span>
              </>
            )}
          </div>
        </div>

        {/* Droite : Sélecteurs d'animation (Solo & Duo), Vitesse & Meta */}
        <div className="d-flex align-items-center flex-wrap gap-1">
          {/* Groupe Solo Anim (ou select pour quadrupèdes/oiseaux) */}
          {animalAnimOptions && animalAnimOptions.length > 0 ? (
            <select
              className="form-select form-select-sm py-0 ps-2 bg-transparent text-dark w-auto small"
              value={activeAnimValue}
              onChange={e => handleSelectAnim(e.target.value)}
            >
              {animalAnimOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          ) : (
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className="btn py-0 px-2 btn-outline-secondary text-dark"
                onClick={() => cycleFilteredAnim('prev')}
                disabled={filteredAnims.length <= 1 || !!duoAnimDef}
                title={`Animation précédente (${filteredAnims.length} dans le filtre / Flèche Haut)`}
              >
                <i className="bi bi-chevron-up" />
              </button>

              <button
                ref={badgeRef}
                type="button"
                className={`btn py-0 px-2 d-inline-flex align-items-center gap-1 text-truncate ${
                  duoAnimDef
                    ? 'btn-primary text-white shadow-sm'
                    : showAnimSelector
                    ? 'btn-danger text-white shadow-sm'
                    : 'btn-outline-secondary text-dark'
                }`}
                style={{ maxWidth: '360px' }}
                onClick={() => {
                  setShowAnimSelector(v => !v);
                  setShowDuoSelector(false);
                  setShowPartnerSelector(false);
                }}
                title={
                  duoAnimDef
                    ? `Duo : ${duoAnimDef.label} (Cliquer ou A pour changer d'animation solo)`
                    : showAnimSelector
                    ? "Fermer le sélecteur d'animations (A)"
                    : `Animation : ${displayName} (${filteredAnims.length} filtrée(s) — A pour ouvrir)`
                }
              >
                <i className={`bi ${duoAnimDef ? 'bi-people-fill' : 'bi-film'}`} aria-hidden="true" />
                <span className="text-truncate">{displayName}</span>
                <i className={`bi ${showAnimSelector ? 'bi-chevron-up' : 'bi-chevron-down'} opacity-75 small`} aria-hidden="true" />
              </button>

              <button
                type="button"
                className="btn py-0 px-2 btn-outline-secondary text-dark"
                onClick={() => cycleFilteredAnim('next')}
                disabled={filteredAnims.length <= 1 || !!duoAnimDef}
                title={`Animation suivante (${filteredAnims.length} dans le filtre / Flèche Bas)`}
              >
                <i className="bi bi-chevron-down" />
              </button>

              <button
                type="button"
                className="btn py-0 px-2 btn-warning text-dark fw-bold"
                onClick={handleRandomAnim}
                disabled={!filteredAnims.length}
                title="Animation solo aléatoire (D)"
              >
                <i className="bi bi-shuffle" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Contrôles Animations Duo (humains uniquement) */}
          {isHumanCharacter && (
            <div className="d-flex align-items-center flex-wrap gap-1">
              {/* Sélecteur Duo + Précédent / Suivant + Dé */}
              <div className="btn-group btn-group-sm" role="group">
                <button
                  type="button"
                  className="btn py-0 px-2 btn-outline-secondary text-dark"
                  onClick={() => cycleFilteredDuoAnim('prev')}
                  disabled={!onSelectDuoAnim}
                  title="Animation duo précédente (Flèche Haut quand duo actif)"
                >
                  <i className="bi bi-chevron-up" />
                </button>

                <button
                  ref={duoBadgeRef}
                  type="button"
                  className={`btn py-0 px-2 d-inline-flex align-items-center gap-1 text-truncate ${
                    duoAnimDef
                      ? 'btn-primary text-white shadow-sm'
                      : showDuoSelector
                      ? 'btn-danger text-white shadow-sm'
                      : 'btn-outline-secondary text-dark'
                  }`}
                  style={{ maxWidth: '280px' }}
                  onClick={() => {
                    setShowDuoSelector(v => !v);
                    setShowAnimSelector(false);
                    setShowPartnerSelector(false);
                  }}
                  title={
                    duoAnimDef
                      ? `Duo : ${duoAnimDef.label} (Cliquer ou Z pour changer)`
                      : "Choisir une animation Duo (Z)"
                  }
                >
                  <i className={`bi ${duoAnimDef ? 'bi-people-fill' : 'bi-people'}`} aria-hidden="true" />
                  <span className="text-truncate">
                    {duoAnimDef ? `${duoAnimDef.icon} ${duoAnimDef.label}` : 'Mode Duo...'}
                  </span>
                  <i className={`bi ${showDuoSelector ? 'bi-chevron-up' : 'bi-chevron-down'} opacity-75 small`} aria-hidden="true" />
                </button>

                <button
                  type="button"
                  className="btn py-0 px-2 btn-outline-secondary text-dark"
                  onClick={() => cycleFilteredDuoAnim('next')}
                  disabled={!onSelectDuoAnim}
                  title="Animation duo suivante (Flèche Bas quand duo actif)"
                >
                  <i className="bi bi-chevron-down" />
                </button>

                <button
                  type="button"
                  className="btn py-0 px-2 btn-warning text-dark fw-bold"
                  onClick={handleRandomDuoAnim}
                  title="Animation Duo et partenaire aléatoires (C)"
                >
                  <i className="bi bi-shuffle" aria-hidden="true" />
                </button>
              </div>

              {/* Contrôles Partenaire B si Duo actif */}
              {duoAnimDef && (
                <div className="btn-group btn-group-sm" role="group">
                  <button
                    ref={partnerBadgeRef}
                    type="button"
                    className={`btn py-0 px-2 d-inline-flex align-items-center gap-1 text-truncate ${
                      showPartnerSelector
                        ? 'btn-danger text-white shadow-sm'
                        : 'btn-outline-primary text-primary fw-semibold'
                    }`}
                    style={{ maxWidth: '165px' }}
                    onClick={() => {
                      setShowPartnerSelector(v => !v);
                      setShowDuoSelector(false);
                      setShowAnimSelector(false);
                    }}
                    title="Changer le partenaire (Rôle B)"
                  >
                    <i className="bi bi-person-badge" aria-hidden="true" />
                    <span className="text-truncate">
                      {currentPartnerObj ? `${currentPartnerObj.emoji} B: ${currentPartnerObj.name}` : `B: ${charBName}`}
                    </span>
                    <i className={`bi ${showPartnerSelector ? 'bi-chevron-up' : 'bi-chevron-down'} opacity-75 small`} aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn py-0 px-2 btn-outline-secondary text-dark"
                    onClick={handleRandomPartner}
                    title="Changer de partenaire au hasard"
                  >
                    <i className="bi bi-person-fill" aria-hidden="true" /><i className="bi bi-shuffle" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    className="btn py-0 px-2 btn-secondary text-white"
                    onClick={() => {
                      onSelectDuoAnim?.(undefined);
                      setShowDuoSelector(false);
                      setShowPartnerSelector(false);
                    }}
                    title="Quitter le mode duo"
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Bouton Toggle Outil de Coupe / Trimming (Dev Only) */}
          {def && (
            <button
              type="button"
              className={`btn py-0 px-2 btn-sm d-inline-flex align-items-center justify-content-center ${
                showTrimPanel
                  ? 'btn-danger text-white shadow-sm'
                  : effectiveSegments.length > 0
                  ? 'btn-warning text-dark border-warning'
                  : 'btn-outline-secondary text-dark'
              }`}
              onClick={() => {
                setShowTrimPanel(v => !v);
              }}
              title={
                showTrimPanel
                  ? 'Fermer l\'outil de découpe'
                  : effectiveSegments.length > 0
                  ? `Outil de découpe (${effectiveSegments.length} segment(s) actif(s))`
                  : 'Outil de découpe d\'animation (Trimming & Cuts)'
              }
              aria-label="Outil de découpe d'animation"
            >
              <i className="bi bi-scissors" aria-hidden="true" />
              {effectiveSegments.length > 0 && (
                <span className="badge bg-dark text-white rounded-pill ms-1 py-0 px-1" style={{ fontSize: '9px' }}>
                  {effectiveSegments.length}
                </span>
              )}
            </button>
          )}

          {/* Bouton Toggle Métadonnées */}
          {hasMeta && (
            <button
              type="button"
              className={`btn py-0 px-2 btn-sm d-inline-flex align-items-center justify-content-center ${
                showMeta
                  ? 'btn-secondary text-white shadow-sm'
                  : 'btn-outline-secondary text-dark'
              }`}
              onClick={() => setShowMeta(v => !v)}
              title={showMeta ? 'Masquer le volet métadonnées' : 'Afficher le volet métadonnées'}
              aria-label={showMeta ? 'Masquer le volet métadonnées' : 'Afficher le volet métadonnées'}
            >
              <i className="bi bi-info-circle" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* ── Ligne 3 : Métadonnées (Solo ou Duo) ── */}
      {showMeta && hasMeta && (
        <div className="card bg-white bg-opacity-75 border-0 shadow-sm p-2 mt-2 text-dark user-select-text small" style={{ cursor: 'text', contain: 'inline-size' }}>
          {duoAnimDef ? (
            <div className="d-flex flex-column gap-2">
              {/* Entête Duo */}
              <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-2">
                <div className="d-flex align-items-center gap-2">
                  <i className="bi bi-people-fill fs-5" aria-hidden="true" />
                  <div>
                    <strong className="text-primary fs-6">{duoAnimDef.label}</strong>
                    <code className="ms-2 text-dark bg-light px-1.5 py-0.5 rounded border small user-select-all" title="Double-cliquer pour tout sélectionner">{duoAnimDef.id}</code>
                  </div>
                </div>
                <div className="d-flex flex-wrap align-items-center gap-2 font-monospace small">
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    <i className="bi bi-stopwatch" aria-hidden="true" /> {(duoAnimDef.duration ?? duration).toFixed(2)}s ({totalFrames}f @ {fps}fps)
                  </span>
                  {duoAnimDef.offsetB && (
                    <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
                      <i className="bi bi-geo-alt" aria-hidden="true" /> Offset B: [{duoAnimDef.offsetB.map(v => `${v}cm`).join(', ')}]
                    </span>
                  )}
                  {duoAnimDef.rotB !== undefined && (
                    <span className="badge bg-warning-subtle text-dark border border-warning-subtle">
                      <i className="bi bi-arrow-repeat" aria-hidden="true" /> Rot B: {(duoAnimDef.rotB * 180 / Math.PI).toFixed(0)}°
                    </span>
                  )}
                </div>
              </div>

              {/* Cartes détaillées des deux animations : Rôle A et Rôle B */}
              <div className="row g-2">
                {/* Rôle A */}
                <div className="col-12 col-md-6">
                  <div className="card bg-light border p-2 h-100">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-primary text-white">Rôle A : {charAName}</span>
                      <span className="text-muted font-monospace small">
                        {defA?.duration ? `${defA.duration.toFixed(2)}s` : ''}
                      </span>
                    </div>
                    <div className="fw-semibold text-truncate small">{defA?.label || duoAnimDef.animA}</div>
                    <div className="text-muted small mt-1 d-flex flex-column gap-0.5 font-monospace">
                      <div><strong className="text-secondary">ID:</strong> <code className="user-select-all" title="Double-cliquer pour tout sélectionner">{duoAnimDef.animA}</code></div>
                      {defA?.path && (
                        <div className="text-truncate" title={defA.path}>
                          <strong className="text-secondary">Fichier:</strong> <span className="user-select-all"><i className="bi bi-folder" aria-hidden="true" /> {defA.path.split('/').pop()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Rôle B */}
                <div className="col-12 col-md-6">
                  <div className="card bg-light border p-2 h-100">
                    <div className="d-flex align-items-center justify-content-between mb-1">
                      <span className="badge bg-info text-dark">Rôle B : {charBName}</span>
                      <span className="text-muted font-monospace small">
                        {defB?.duration ? `${defB.duration.toFixed(2)}s` : ''}
                      </span>
                    </div>
                    <div className="fw-semibold text-truncate small">{defB?.label || duoAnimDef.animB}</div>
                    <div className="text-muted small mt-1 d-flex flex-column gap-0.5 font-monospace">
                      <div><strong className="text-secondary">ID:</strong> <code className="user-select-all" title="Double-cliquer pour tout sélectionner">{duoAnimDef.animB}</code></div>
                      {defB?.path && (
                        <div className="text-truncate" title={defB.path}>
                          <strong className="text-secondary">Fichier:</strong> <span className="user-select-all"><i className="bi bi-folder" aria-hidden="true" /> {defB.path.split('/').pop()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Editeur en direct Offset Pos & Rot (Duo B) */}
              <div className="card bg-white border p-2 mt-1">
                <div className="d-flex align-items-center justify-content-between mb-2">
                  <div className="d-flex align-items-center gap-1.5 fw-bold text-dark small">
                    <i className="bi bi-sliders text-primary" aria-hidden="true" />
                    <span>Ajustement live Offset &amp; Rotation B</span>
                    {hasDuoOverride && (
                      <span className="badge bg-primary text-white" style={{ fontSize: '10px' }}>Modifié</span>
                    )}
                  </div>
                  <div className="d-flex align-items-center gap-1">
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm py-0 px-2"
                      style={{ fontSize: '11px' }}
                      onClick={handleCopyDuoTs}
                      title="Copier au format TypeScript pour duoAnimations.ts"
                    >
                      <i className={`bi ${copiedDuoTs ? 'bi-check-lg text-success' : 'bi-clipboard'}`} aria-hidden="true" />
                      <span className="ms-1">{copiedDuoTs ? 'Copié !' : 'Copier TS'}</span>
                    </button>
                    {hasDuoOverride && (
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm py-0 px-2"
                        style={{ fontSize: '11px' }}
                        onClick={handleResetDuoTransform}
                        title="Réinitialiser aux valeurs d'origine"
                      >
                        <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                        <span className="ms-1">Reset</span>
                      </button>
                    )}
                  </div>
                </div>

                <div className="row g-2 align-items-center">
                  <div className="col-6 col-md-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text font-monospace fw-bold text-danger bg-light py-0 px-1.5">X</span>
                      <input
                        type="number"
                        step="1"
                        className="form-control form-control-sm text-end font-monospace py-0 px-1"
                        value={effectiveOffsetB[0]}
                        onChange={e => handleUpdateDuoOffset(0, parseFloat(e.target.value) || 0)}
                        title="Décalage X en cm"
                      />
                      <span className="input-group-text small bg-light py-0 px-1 text-muted">cm</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text font-monospace fw-bold text-success bg-light py-0 px-1.5">Y</span>
                      <input
                        type="number"
                        step="1"
                        className="form-control form-control-sm text-end font-monospace py-0 px-1"
                        value={effectiveOffsetB[1]}
                        onChange={e => handleUpdateDuoOffset(1, parseFloat(e.target.value) || 0)}
                        title="Décalage Y en cm"
                      />
                      <span className="input-group-text small bg-light py-0 px-1 text-muted">cm</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text font-monospace fw-bold text-primary bg-light py-0 px-1.5">Z</span>
                      <input
                        type="number"
                        step="1"
                        className="form-control form-control-sm text-end font-monospace py-0 px-1"
                        value={effectiveOffsetB[2]}
                        onChange={e => handleUpdateDuoOffset(2, parseFloat(e.target.value) || 0)}
                        title="Décalage Z en cm"
                      />
                      <span className="input-group-text small bg-light py-0 px-1 text-muted">cm</span>
                    </div>
                  </div>
                  <div className="col-6 col-md-3">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text font-monospace fw-bold text-warning bg-light py-0 px-1.5">Rot</span>
                      <input
                        type="number"
                        step="5"
                        className="form-control form-control-sm text-end font-monospace py-0 px-1"
                        value={Math.round(effectiveRotBDeg)}
                        onChange={e => handleUpdateDuoRotDeg(parseFloat(e.target.value) || 0)}
                        title="Rotation Y en degrés"
                      />
                      <span className="input-group-text small bg-light py-0 px-1 text-muted">°</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="d-flex flex-column gap-2">
              <div className="d-flex flex-wrap align-items-center gap-2">
                <div>
                  <strong className="text-muted text-uppercase me-1 small">ID:</strong>
                  <code className="text-dark bg-light px-1.5 py-0.5 rounded border user-select-all" title="Double-cliquer pour tout sélectionner">
                    {def?.id || (isTPose ? 't-pose' : displayName)}
                  </code>
                </div>
                {catObj && (
                  <div>
                    <strong className="text-muted text-uppercase me-1 small">Catégorie:</strong>
                    <span className="badge bg-light text-dark border">
                      <i className={`bi ${catObj.icon}`} aria-hidden="true" /> {catObj.label}
                    </span>
                  </div>
                )}
                {def?.path && (
                  <div>
                    <strong className="text-muted text-uppercase me-1 small">Fichier:</strong>
                    <code className="text-muted bg-light px-1.5 py-0.5 rounded border text-truncate d-inline-block align-middle user-select-all" style={{ maxWidth: '240px' }} title={def.path}>
                      <i className="bi bi-folder" aria-hidden="true" /> {def.path.split('/').pop()}
                    </code>
                  </div>
                )}
                <div>
                  <strong className="text-muted text-uppercase me-1 small">Durée:</strong>
                  <span className="text-success fw-bold font-monospace">
                    {(def?.duration ?? duration).toFixed(2)}s ({totalFrames}f @ {fps}fps)
                  </span>
                </div>
                {def?.aliases && def.aliases.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center gap-1 w-100 mt-1">
                    <strong className="text-muted text-uppercase me-1 small"><i className="bi bi-tag" aria-hidden="true" /> Aliases ({def.aliases.length}):</strong>
                    {def.aliases.map(alias => (
                      <span key={alias} className="badge bg-light text-secondary border font-monospace user-select-all">
                        {alias}
                      </span>
                    ))}
                  </div>
                )}
                {def?.tags && def.tags.length > 0 && (
                  <div className="d-flex flex-wrap align-items-center gap-1 w-100 mt-1">
                    <strong className="text-muted text-uppercase me-1 small"><i className="bi bi-bookmark" aria-hidden="true" /> Tags ({def.tags.length}):</strong>
                    {def.tags.map(tag => (
                      <span key={tag} className="badge bg-primary-subtle text-primary border border-primary-subtle user-select-all">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Editeur en direct Offset Pos & Rot (Solo) */}
              {def && (
                <div className="card bg-white border p-2 mt-1">
                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <div className="d-flex align-items-center gap-1.5 fw-bold text-dark small">
                      <i className="bi bi-sliders text-primary" aria-hidden="true" />
                      <span>Ajustement live Offset Pos &amp; Rot Y</span>
                      {hasSoloOverride && (
                        <span className="badge bg-primary text-white" style={{ fontSize: '10px' }}>Modifié</span>
                      )}
                    </div>
                    <div className="d-flex align-items-center gap-1">
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-sm py-0 px-2"
                        style={{ fontSize: '11px' }}
                        onClick={handleCopySoloTs}
                        title="Copier au format TypeScript pour animationRegistry.ts"
                      >
                        <i className={`bi ${copiedSoloTs ? 'bi-check-lg text-success' : 'bi-clipboard'}`} aria-hidden="true" />
                        <span className="ms-1">{copiedSoloTs ? 'Copié !' : 'Copier TS'}</span>
                      </button>
                      {hasSoloOverride && (
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm py-0 px-2"
                          style={{ fontSize: '11px' }}
                          onClick={handleResetSoloTransform}
                          title="Réinitialiser aux valeurs d'origine"
                        >
                          <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                          <span className="ms-1">Reset</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="row g-2 align-items-center">
                    <div className="col-6 col-md-3">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text font-monospace fw-bold text-danger bg-light py-0 px-1.5">X</span>
                        <input
                          type="number"
                          step="1"
                          className="form-control form-control-sm text-end font-monospace py-0 px-1"
                          value={effectiveSoloOffset[0]}
                          onChange={e => handleUpdateSoloOffset(0, parseFloat(e.target.value) || 0)}
                          title="Décalage X en cm"
                        />
                        <span className="input-group-text small bg-light py-0 px-1 text-muted">cm</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text font-monospace fw-bold text-success bg-light py-0 px-1.5">Y</span>
                        <input
                          type="number"
                          step="1"
                          className="form-control form-control-sm text-end font-monospace py-0 px-1"
                          value={effectiveSoloOffset[1]}
                          onChange={e => handleUpdateSoloOffset(1, parseFloat(e.target.value) || 0)}
                          title="Décalage Y en cm"
                        />
                        <span className="input-group-text small bg-light py-0 px-1 text-muted">cm</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text font-monospace fw-bold text-primary bg-light py-0 px-1.5">Z</span>
                        <input
                          type="number"
                          step="1"
                          className="form-control form-control-sm text-end font-monospace py-0 px-1"
                          value={effectiveSoloOffset[2]}
                          onChange={e => handleUpdateSoloOffset(2, parseFloat(e.target.value) || 0)}
                          title="Décalage Z en cm"
                        />
                        <span className="input-group-text small bg-light py-0 px-1 text-muted">cm</span>
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text font-monospace fw-bold text-warning bg-light py-0 px-1.5">Rot Y</span>
                        <input
                          type="number"
                          step="5"
                          className="form-control form-control-sm text-end font-monospace py-0 px-1"
                          value={Math.round(effectiveSoloRotYDeg * 10) / 10}
                          onChange={e => handleUpdateSoloRotDeg(parseFloat(e.target.value) || 0)}
                          title="Rotation Y en degrés"
                        />
                        <span className="input-group-text small bg-light py-0 px-1 text-muted">°</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Ligne 4 : Volet Dev Découpe d'Animation (Trimming & Multi-Cuts) ── */}
      {showTrimPanel && def && (
        <div className="card bg-white bg-opacity-90 border shadow-sm p-2 mt-2 text-dark user-select-text small" style={{ cursor: 'text' }}>
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 border-bottom pb-2 mb-2">
            <div className="d-flex align-items-center gap-2">
              <i className="bi bi-scissors text-danger fs-5" aria-hidden="true" />
              <div>
                <strong className="text-dark fs-6">Découpe d'Animation (Trims &amp; Cuts)</strong>
                <span className="ms-2 badge bg-light text-secondary border font-monospace">{def.id}</span>
                {hasSegmentsOverride && (
                  <span className="ms-1 badge bg-primary text-white" style={{ fontSize: '10px' }}>Modifié en direct</span>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-outline-secondary btn-sm py-0 px-2"
                style={{ fontSize: '11px' }}
                onClick={handleCopyTrimTs}
                title="Copier au format TypeScript pour animationRegistry.ts"
              >
                <i className={`bi ${copiedTrimTs ? 'bi-check-lg text-success' : 'bi-clipboard'}`} aria-hidden="true" />
                <span className="ms-1">{copiedTrimTs ? 'Copié !' : 'Copier TS'}</span>
              </button>
              {effectiveSegments.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm py-0 px-2"
                  style={{ fontSize: '11px' }}
                  onClick={handleResetSegments}
                  title="Réinitialiser tous les trims et restaurer l'animation complète"
                >
                  <i className="bi bi-arrow-counterclockwise" aria-hidden="true" />
                  <span className="ms-1">Reset (Tout garder)</span>
                </button>
              )}
            </div>
          </div>

          {/* Actions de coupe simples et intuitives */}
          <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2 p-2 bg-light rounded border">
            <div className="d-flex align-items-center gap-1.5" style={{ minWidth: '175px' }}>
              <span className="fw-semibold text-muted small">Tête de lecture :</span>
              <strong className="text-dark font-monospace small" style={{ display: 'inline-block', width: '38px', textAlign: 'right' }}>
                {currentFrame}f
              </strong>
              <span className="text-muted font-monospace small" style={{ display: 'inline-block', width: '48px', textAlign: 'left' }}>
                ({currentTime.toFixed(2)}s)
              </span>
            </div>

            <div className="d-flex flex-wrap align-items-center gap-1.5">
              {/* Couper tout le début avant ici */}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary py-0 px-2"
                onClick={() => {
                  const nowSec = currentTime;
                  if (nowSec <= 0.05) return;
                  if (effectiveSegments.length === 0) {
                    handleUpdateSegments([[nowSec, duration]]);
                  } else {
                    // Supprime ou ajuste tout segment se trouvant avant nowSec
                    const next: Array<[number, number]> = [];
                    for (const [s, e] of effectiveSegments) {
                      if (e <= nowSec) continue; // complètement avant, éliminé
                      if (s < nowSec) {
                        next.push([nowSec, e]);
                      } else {
                        next.push([s, e]);
                      }
                    }
                    handleUpdateSegments(next.length > 0 ? next : [[nowSec, duration]]);
                  }
                }}
                disabled={currentFrame <= 0}
                title={`Supprime tout ce qui précède la frame courante (${currentFrame}f)`}
              >
                <i className="bi bi-box-arrow-in-right me-1" />
                Couper Début (avant ici)
              </button>

              {/* Couper toute la fin après ici */}
              <button
                type="button"
                className="btn btn-sm btn-outline-primary py-0 px-2"
                onClick={() => {
                  const nowSec = currentTime;
                  if (nowSec >= duration - 0.05) return;
                  if (effectiveSegments.length === 0) {
                    handleUpdateSegments([[0, nowSec]]);
                  } else {
                    // Supprime ou ajuste tout segment se trouvant après nowSec
                    const next: Array<[number, number]> = [];
                    for (const [s, e] of effectiveSegments) {
                      if (s >= nowSec) continue; // complètement après, éliminé
                      if (e > nowSec) {
                        next.push([s, nowSec]);
                      } else {
                        next.push([s, e]);
                      }
                    }
                    handleUpdateSegments(next.length > 0 ? next : [[0, nowSec]]);
                  }
                }}
                disabled={currentFrame >= totalFrames}
                title={`Supprime tout ce qui suit la frame courante (${currentFrame}f)`}
              >
                <i className="bi bi-box-arrow-in-left me-1" />
                Couper Fin (après ici)
              </button>

              {/* Supprimer une plage au milieu : scinde proprement à la frame courante */}
              <button
                type="button"
                className="btn btn-sm btn-outline-warning text-dark fw-semibold py-0 px-2"
                onClick={() => {
                  const nowSec = currentTime;
                  const cutLengthSec = Math.min(1.0, duration * 0.2); // Trou de 1s ou 20%
                  const cutEnd = Math.min(duration, nowSec + cutLengthSec);

                  if (effectiveSegments.length === 0) {
                    const seg1: [number, number] = [0, nowSec];
                    const seg2: [number, number] = [cutEnd, duration];
                    const res: Array<[number, number]> = [];
                    if (seg1[1] > seg1[0] + 0.05) res.push(seg1);
                    if (seg2[1] > seg2[0] + 0.05) res.push(seg2);
                    handleUpdateSegments(res);
                  } else {
                    // Coupe dans les segments existants
                    const next: Array<[number, number]> = [];
                    for (const [s, e] of effectiveSegments) {
                      if (nowSec >= s && nowSec < e) {
                        if (nowSec > s + 0.05) next.push([s, nowSec]);
                        if (e > cutEnd + 0.05) next.push([cutEnd, e]);
                      } else {
                        next.push([s, e]);
                      }
                    }
                    handleUpdateSegments(next);
                  }
                }}
                title="Insère une coupure (trou) à partir de la frame courante"
              >
                <i className="bi bi-scissors me-1" />
                Couper au milieu (Trou ✂️)
              </button>
            </div>
          </div>

          {/* Visualisation visuelle de la timeline avec zones vertes (gardées) et zones rouges (coupées) */}
          <div className="mb-2">
            <div className="d-flex align-items-center justify-content-between mb-1">
              <span className="small fw-semibold text-muted">Aperçu visuel de la timeline :</span>
              <span className="small text-muted font-monospace">
                Total conservé : <strong className="text-success">{
                  (effectiveSegments.length > 0
                    ? effectiveSegments.reduce((acc, [s, e]) => acc + Math.max(0, e - s), 0)
                    : duration
                  ).toFixed(2)
                }s</strong> / {duration.toFixed(2)}s
              </span>
            </div>
            <div
              className="position-relative w-100 rounded overflow-hidden border"
              style={{ height: '14px', background: effectiveSegments.length > 0 ? '#ffcccc' : '#c8e6c9' }}
              title={effectiveSegments.length > 0 ? 'Vert = conservé / Rouge = coupé' : 'Animation intégrale lue'}
            >
              {effectiveSegments.length > 0 && duration > 0 && effectiveSegments.map(([s, e], i) => {
                const leftPct = (s / duration) * 100;
                const widthPct = Math.max(0, ((e - s) / duration) * 100);
                return (
                  <div
                    key={i}
                    className="position-absolute h-100 bg-success"
                    style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                    title={`Segment #${i + 1} conservé : de ${Math.round(s * fps)}f (${s.toFixed(2)}s) à ${Math.round(e * fps)}f (${e.toFixed(2)}s)`}
                  />
                );
              })}
              {/* Curseur de lecture */}
              {duration > 0 && (
                <div
                  className="position-absolute top-0 bottom-0 bg-danger"
                  style={{
                    left: `${Math.min(100, Math.max(0, (currentTime / duration) * 100))}%`,
                    width: '3px',
                    transform: 'translateX(-50%)',
                    zIndex: 2,
                  }}
                />
              )}
            </div>
            <div className="d-flex justify-content-between mt-0.5 text-muted font-monospace" style={{ fontSize: '10px' }}>
              <span>0f (0.0s)</span>
              <span>{totalFrames}f ({duration.toFixed(2)}s)</span>
            </div>
          </div>

          {/* Liste des segments actifs avec correction automatique et ordonnancement strict */}
          <div className="d-flex flex-column gap-1.5">
            <div className="d-flex align-items-center justify-content-between">
              <span className="fw-bold small text-dark">
                Segments conservés ({effectiveSegments.length || '1 segment plein — Animation complète'}):
              </span>
              <button
                type="button"
                className="btn btn-outline-success btn-sm py-0 px-2"
                style={{ fontSize: '11px' }}
                onClick={() => {
                  if (effectiveSegments.length === 0) {
                    handleUpdateSegments([[0, duration]]);
                  } else {
                    const segs: Array<[number, number]> = [...effectiveSegments];
                    const lastEnd = segs[segs.length - 1][1];
                    const newStart = Math.min(duration - 0.2, lastEnd + 0.1);
                    const newEnd = duration;
                    if (newEnd > newStart) {
                      segs.push([newStart, newEnd]);
                      handleUpdateSegments(segs);
                    }
                  }
                }}
              >
                <i className="bi bi-plus-lg me-1" />
                Ajouter un segment
              </button>
            </div>

            {effectiveSegments.length === 0 ? (
              <div className="text-muted p-2 bg-light rounded text-center small fst-italic">
                L'animation entière est conservée (de la frame 0 à {totalFrames}). Utilisez les boutons ci-dessus pour couper le début, la fin ou découper au milieu.
              </div>
            ) : (
              <div className="d-flex flex-column gap-1">
                {effectiveSegments.map(([startSec, endSec], idx) => {
                  const startF = Math.round(startSec * fps);
                  const endF = Math.round(endSec * fps);
                  const segDur = Math.max(0, endSec - startSec);

                  return (
                    <div key={idx} className="d-flex flex-wrap align-items-center justify-content-between gap-2 p-1.5 bg-light rounded border">
                      <div className="d-flex align-items-center gap-2">
                        <span className="badge bg-success text-white">Segment #{idx + 1}</span>
                        <span className="font-monospace small text-muted">
                          Durée : <strong className="text-dark">{segDur.toFixed(2)}s</strong> ({Math.round(segDur * fps)}f)
                        </span>
                      </div>

                      {/* Édition interactive Début et Fin */}
                      <div className="d-flex align-items-center gap-2">
                        {/* Début */}
                        <div className="input-group input-group-sm w-auto">
                          <span className="input-group-text py-0 px-1 bg-white small text-muted">Début</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max={totalFrames}
                            className="form-control form-control-sm font-monospace text-end py-0 px-1"
                            style={{ width: '60px' }}
                            value={startF}
                            onChange={e => {
                              const f = Math.max(0, Math.min(totalFrames, parseInt(e.target.value, 10) || 0));
                              const next: Array<[number, number]> = [...effectiveSegments];
                              next[idx] = [f / fps, Math.max(f / fps, next[idx][1])];
                              next.sort((a, b) => a[0] - b[0]);
                              handleUpdateSegments(next);
                            }}
                            title="Frame de début"
                          />
                          <span className="input-group-text py-0 px-1 bg-white small text-muted">f</span>
                        </div>

                        {/* Fin */}
                        <div className="input-group input-group-sm w-auto">
                          <span className="input-group-text py-0 px-1 bg-white small text-muted">Fin</span>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            max={totalFrames}
                            className="form-control form-control-sm font-monospace text-end py-0 px-1"
                            style={{ width: '60px' }}
                            value={endF}
                            onChange={e => {
                              const f = Math.max(0, Math.min(totalFrames, parseInt(e.target.value, 10) || 0));
                              const next: Array<[number, number]> = [...effectiveSegments];
                              next[idx] = [Math.min(f / fps, next[idx][0]), f / fps];
                              next.sort((a, b) => a[0] - b[0]);
                              handleUpdateSegments(next);
                            }}
                            title="Frame de fin"
                          />
                          <span className="input-group-text py-0 px-1 bg-white small text-muted">f</span>
                        </div>

                        {/* Bouton pour caler le début à la position courante */}
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm py-0 px-1.5"
                          onClick={() => {
                            const next: Array<[number, number]> = [...effectiveSegments];
                            next[idx] = [currentTime, Math.max(currentTime, next[idx][1])];
                            next.sort((a, b) => a[0] - b[0]);
                            handleUpdateSegments(next);
                          }}
                          title={`Caler le début de ce segment à la frame courante (${currentFrame}f)`}
                        >
                          Début=ici
                        </button>

                        {/* Bouton pour caler la fin à la position courante */}
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-sm py-0 px-1.5"
                          onClick={() => {
                            const next: Array<[number, number]> = [...effectiveSegments];
                            next[idx] = [Math.min(currentTime, next[idx][0]), currentTime];
                            next.sort((a, b) => a[0] - b[0]);
                            handleUpdateSegments(next);
                          }}
                          title={`Caler la fin de ce segment à la frame courante (${currentFrame}f)`}
                        >
                          Fin=ici
                        </button>

                        {/* Bouton sauter à ce segment */}
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-sm py-0 px-1.5"
                          onClick={() => seekToFrame(startF)}
                          title="Aller au début de ce segment"
                        >
                          <i className="bi bi-play-circle" />
                        </button>

                        {/* Bouton supprimer ce segment */}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm py-0 px-1.5"
                          onClick={() => {
                            const next = effectiveSegments.filter((_, i) => i !== idx);
                            handleUpdateSegments(next.length > 0 ? next : null);
                          }}
                          title="Supprimer ce segment"
                        >
                          <i className="bi bi-trash" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
