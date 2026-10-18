# Lara : expérimentation Mixamo suspendue

L'expérimentation est mise de côté. Lara et ses variantes continuent d'utiliser
le rig natif `public/characters/lara/lara_native.glb`, avec
`public/characters/lara/lara_perfect.blend` comme fichier de travail d'origine.
Le personnage `lara_mixamo` a été retiré du catalogue et des sélecteurs.

Les changements expérimentaux de translation du bassin, de racine commune et de
calibration des clavicules ont été retirés du moteur. Le comportement antérieur
du rig natif est rétabli. Les améliorations indépendantes du prototype, notamment
les transitions de posture, le maintien de l'état du studio et les raccourcis de
tenue, sont conservées.

Le résolveur d'os est également revenu à son comportement d'avant l'essai.
Sur Lara native, `Hips` désigne de nouveau `root_hips`, ancêtre du bassin et du
dos, et non `pelvis`. La priorité aux noms exacts introduite pendant l'expérience
avait changé cette association et pouvait faire pivoter les jambes indépendamment
du buste. Ce changement avait été conservé par erreur lors du premier retrait.

`node scripts/temp_lara_native_retarget.cjs` compare les matrices de tous les os
avec le résolveur précédant l'expérimentation, à 30 Hz, sur Lara native et Xbot.
Le contrôle comprend `Against Wall Turn L To Sneakwalk`, l'idle Miley et la marche.

Les fichiers ci-dessous restent disponibles comme archives de l'essai, sans être
utilisés par les personnages de l'application :

- `public/characters/lara/lara_mixamo_prototype.blend` : dernier prototype,
  textures intégrées, 34 meshes, 92 os et neuf actions de revue.
- `public/characters/lara/lara_mixamo_prototype.glb` : export expérimental.
- `docs/lara-mixamo-prototype-report.json` : mesures historiques de construction
  et de validation de cet export.
- `docs/lara-shoulder-calibration.json` : calibration historique des clavicules.
- `docs/lara-mixamo-comparison.png`, `docs/lara-armpits-comparison.png` et
  `docs/lara-shoulders-comparison.png` : captures historiques des essais.
- `scripts/temp_lara_mixamo.py` : script de construction conservé pour référence.

Les propriétés de calibration présentes dans les archives ne sont plus prises
en charge par le retargeter actuel. Les actions déjà cuites dans le `.blend`
restent consultables. Les anciennes pages et commandes de comparaison du
prototype ont été retirées ; les résultats archivés ne décrivent pas le moteur
actuel.
