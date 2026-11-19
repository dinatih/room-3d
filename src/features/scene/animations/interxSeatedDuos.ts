/**
 * Liste minimale des duos Inter-X assis (tags `seated-front` / `with-seated-action`)
 * afin d'éviter d'embarquer les 1,38 Mo de `interx_manifest.json` dans `animation.worker.ts`.
 * Vérifiée par `tests/unit/interx-seated-duo.test.cjs` contre `INTERX_MANIFEST`.
 */
export const INTERX_SEATED_DUO_IDS = new Set<string>([
  'interx-g059t000a009r030',
  'interx-g059t000a009r031',
  'interx-g059t000a009r032',
  'interx-g053t001a009r022',
  'interx-g053t001a009r023',
  'interx-g053t001a009r025',
  'interx-g053t001a009r026',
  'interx-g053t001a009r027',
  'interx-g053t001a009r028',
  'interx-g049t002a009r011',
  'interx-g049t002a009r012',
  'interx-g049t002a009r013',
  'interx-g049t002a009r014',
  'interx-g049t002a009r015',
  'interx-g049t002a009r016',
  'interx-g030t004a009r010',
  'interx-g030t004a009r011',
  'interx-g030t004a009r012',
  'interx-g030t004a009r013',
  'interx-g030t004a009r014',
  'interx-g004t005a009r023',
  'interx-g004t005a009r024',
  'interx-g004t005a009r025',
  'interx-g004t005a009r026',
  'interx-g004t005a009r027',
  'interx-g056t005a026r006',
  'interx-g056t005a026r008',
  'interx-g053t006a026r011',
  'interx-g053t006a026r013',
  'interx-g039t007a026r007',
  'interx-g039t007a026r008',
  'interx-g039t007a026r009',
  'interx-g022t008a026r000',
  'interx-g022t008a026r001',
  'interx-g022t008a026r002',
  'interx-g004t011a026r003',
]);

export function isSeatedInterXClip(clipName: string): boolean {
  if (!clipName.endsWith('-p1') && !clipName.endsWith('-p2')) return false;
  return INTERX_SEATED_DUO_IDS.has(clipName.slice(0, -3));
}
