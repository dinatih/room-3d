import * as THREE from 'three';
import { BONE_SYNONYMS } from './boneMappings';

export function resolveTargetFingerBoneName(targetInstance: THREE.Object3D, side: string, type: string, segment: string): string | null {
  const sideChar = side.charAt(0).toLowerCase();
  const segmentIndex = parseInt(segment, 10) - 1;
  const segmentLetter = ['a', 'b', 'c'][segmentIndex] || 'a';

  const candidates = [
    new RegExp(`^${type}${segment}_${sideChar}$`, 'i'),
    new RegExp(`arm.*${side}.*finger.*${type === 'thumb' ? 1 : type === 'index' ? 2 : type === 'middle' ? 3 : type === 'ring' ? 4 : 5}${segmentLetter}`, 'i'),
    new RegExp(`${type}_0${segment}_${sideChar}`, 'i'),
    new RegExp(`${type === 'thumb' ? 'thumb' : 'f_' + type}\\.0${segment}\\.${sideChar}`, 'i'),
    new RegExp(`${sideChar}.*hand.*${type}.*${segmentIndex}`, 'i'),
    new RegExp(`mixamorig.*${side}.*hand.*${type}.*${segment}`, 'i'),
    new RegExp(`mixamorig_${side}_hand_${type}_${segment}`, 'i'),
    new RegExp(`${side}_hand_${type}_${segment}`, 'i')
  ];

  let foundName: string | null = null;
  targetInstance.traverse(node => {
    if ((node as any).isBone && !foundName) {
      for (const rx of candidates) {
        if (rx.test(node.name)) {
          foundName = node.name;
          break;
        }
      }
    }
  });
  return foundName;
}

const _targetBoneNameCache = new WeakMap<THREE.Object3D, Map<string, string | null>>();

export function resolveTargetBoneName(targetInstance: THREE.Object3D, baseName: string, sourceHairMap: Map<string, string> | null = null): string | null {
  let instanceCache = _targetBoneNameCache.get(targetInstance);
  if (!instanceCache) {
    instanceCache = new Map<string, string | null>();
    _targetBoneNameCache.set(targetInstance, instanceCache);
  }

  const cacheKey = sourceHairMap ? `${baseName}_withHairMap` : baseName;
  if (instanceCache.has(cacheKey)) {
    return instanceCache.get(cacheKey)!;
  }

  const baseNameLower = baseName.toLowerCase();
  if (baseNameLower.includes('hair') || baseNameLower.includes('ponytail')) {
    if (sourceHairMap && sourceHairMap.has(baseNameLower)) {
      const targetName = sourceHairMap.get(baseNameLower);
      if (targetName && targetInstance.getObjectByName(targetName)) {
        instanceCache.set(cacheKey, targetName);
        return targetName;
      }
    }
    const numMatch = baseName.match(/(\d+)/);
    if (numMatch) {
      const N = numMatch[1];
      const targetName = `hair_${N}`;
      if (targetInstance.getObjectByName(targetName)) {
        instanceCache.set(cacheKey, targetName);
        return targetName;
      }
    }
  }

  // Support for both mixamo format (HandIndex1) and CharacterCreator format (L_Index1)
  const fingerMatch = baseName.match(/(?:Hand)?(Thumb|Index|Middle|Mid|Ring|Pinky)(\d)/i);
  if (fingerMatch && !baseName.toLowerCase().includes('toe')) {
    let side = baseName.toLowerCase().includes('left') ? 'left' : 'right';
    if (baseName.includes('_L_')) side = 'left';
    if (baseName.includes('_R_')) side = 'right';
    let type = fingerMatch[1].toLowerCase();
    if (type === 'mid') type = 'middle';
    const segment = fingerMatch[2];
    const resolvedFinger = resolveTargetFingerBoneName(targetInstance, side, type, segment);
    if (resolvedFinger) {
      instanceCache.set(cacheKey, resolvedFinger);
      return resolvedFinger;
    }
  }

  const synonyms = BONE_SYNONYMS[baseName];
  if (synonyms) {
    for (const syn of synonyms) {
      let foundName: string | null = null;
      targetInstance.traverse(node => {
        if ((node as any).isBone && !foundName) {
          const nameNormalized = node.name.toLowerCase().replace(/[:_ .\-]/g, '');
          if (nameNormalized === syn || (nameNormalized.includes(syn) &&
              !nameNormalized.includes(syn + '1') &&
              !nameNormalized.includes(syn + '2') &&
              !nameNormalized.includes(syn + '3') &&
              !nameNormalized.includes(syn + '4'))) {
            if (!nameNormalized.includes('twist') && !nameNormalized.includes('muscle') && !nameNormalized.includes('offset')) {
              foundName = node.name;
            }
          }
        }
      });
      if (foundName) {
        instanceCache.set(cacheKey, foundName);
        return foundName;
      }
    }
  }

  const candidates = [
    'mixamorig:' + baseName,
    'mixamorig_' + baseName,
    'mixamorig' + baseName,
    baseName,
    'mixamorig:' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig_' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    'mixamorig' + baseName.charAt(0).toLowerCase() + baseName.slice(1),
    baseName.charAt(0).toLowerCase() + baseName.slice(1)
  ];

  for (const cand of candidates) {
    if (targetInstance.getObjectByName(cand)) {
      instanceCache.set(cacheKey, cand);
      return cand;
    }
  }

  instanceCache.set(cacheKey, null);
  return null;
}
