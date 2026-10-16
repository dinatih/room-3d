# Comparaisons de correction des 12 animations NPZ

## Validation effectuée le 16 octobre 2026

- `repair-test` : tests du filtre et de l’alignement réussis, originaux inchangés par SHA-256, translations XYZ, dates, extrémités et clés non ciblées préservées sur les 12 paires.
- `repair-browser` : 12 paires chargées dans Chromium headless ; résolution par le registre réel, exclusion des tirages comportementaux, mixeur évalué aux instants demandés et matrices des squelettes finies. Trois captures pilotes disponibles dans `/tmp/room-npz-repair-review/`.
- `npx tsc --noEmit` et `npm run build` : réussis. Le build signale les avertissements Sass et de taille de bundles déjà présents.
- Aucune validation visuelle des personnages ou des contacts n’est déduite de ces tests. Les originaux restent actifs ; les candidats sont proposés pour comparaison seulement.

Le lot NPZ est versionné séparément des travaux concurrents sur le marqueur BNF.

Le contrôle historique global `verify` échoue actuellement sur 230 fichiers InterX déclarés par un manifeste importé qu’il ne sait pas lire. Les contrôles ciblés de ce lot sont `repair-test` et `repair-browser`, avec résolution des 12 variantes par le véritable registre de l’application.

Les originaux restent actifs et inchangés. Les versions candidates sont accessibles dans le sélecteur existant sous **[ESSAI correction]**, identifiant original suffixé `-repair-preview`. Aucun remplacement définitif n’a été effectué. Les candidats portent uniquement le tag `npz-repair-candidate`, sans les alias ni tags comportementaux des originaux, pour ne pas rejoindre les tirages IA par tags.

> Mise à jour Bachata : stabilisation supplémentaire des poignets en espace monde, sans modifier le reste de la version validée. Voir `npz-refinement-and-extracts.md` pour la méthode et les mesures des mains.

## Méthode et limites

Alignement temporel NPZ/GLB par comparaison de la vitesse angulaire du bassin sur tous les instants exportés. Estimation du changement de base à partir des rotations relatives, puis vérification sur toutes les orientations de chaque articulation. Les discordances dépassant le budget numérique Float32 sont signalées et laissées intactes : elles ne sont pas attribuées automatiquement au capteur.

À la cadence native : remplacement des pics isolés avec retour vers des voisins cohérents par SLERP ; moyenne géodésique symétrique [1,2,1] sur les transitoires courts. Les intervalles de vitesse élevée continus dépassant 1/30 s sont conservés et signalés. Le seuil historique 25° à 30 Hz est une alerte, pas une limite biomécanique. Les dates, translations XYZ, échelles, extrémités et autres octets des GLB sont préservés. Le traitement ne corrige ni la hauteur du sol ni les appuis par IK.

## Résultats (premier clip, 30 Hz)

| Animation | Avant | Candidate | Os modifiés | Intervalles longs signalés |
|---|---:|---:|---:|---:|
| bachata-vaso-01 | 178 | 68 | 4 | 67 |
| reggaeton-vaso-01 | 257 | 180 | 10 | 124 |
| hiphop-fanie-c3d | 429 | 336 | 20 | 195 |
| musical-theater-fanie-c3d | 556 | 478 | 11 | 282 |
| zumba-fanie-c3d | 483 | 371 | 7 | 222 |
| bellydance2-anna-cortesi-c3d | 434 | 332 | 6 | 156 |
| randb-anna-cortesi-c3d | 673 | 521 | 12 | 104 |
| salsa-stefanos-c3d | 189 | 135 | 6 | 110 |
| happy-dance-olivia | 585 | 466 | 12 | 270 |
| excited-dance-olivia | 499 | 417 | 10 | 236 |
| pleased-dance-olivia | 422 | 326 | 11 | 170 |
| yoga-dolphin-pose-or-ardha-pincha-mayurasana-a | 1048 | 708 | 22 | 263 |

## Vérification visuelle à effectuer

Comparer les versions aux mêmes instants, avec vitesse 1 et Hips-Lock désactivé. Observer les poignets, les cuisses et le bassin sur les passages modifiés, mais aussi les pieds/mains en appui et des passages non modifiés. Une baisse du compteur ne constitue pas une validation. RnB, Bachata Vaso et Dolphin sont les trois pilotes ; les neuf autres candidats restent eux aussi en attente de validation.

### bachata-vaso-01

Source : Vasso_Bachata_01_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **LeftForeArm** : 18 plage(s) modifiée(s), 11 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 50 plage(s) modifiée(s), 40 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 6 plage(s) modifiée(s), 4 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 24 plage(s) modifiée(s), 12 plage(s) longue(s) conservée(s). source/export rotations consistent.
### reggaeton-vaso-01

Source : Vasso_Reggaeton_01_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **LeftFoot** : 1 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftToeBase** : 1 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightToeBase** : 1 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftShoulder** : 1 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 5 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 20 plage(s) modifiée(s), 22 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 56 plage(s) modifiée(s), 53 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 1 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 5 plage(s) modifiée(s), 16 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 32 plage(s) modifiée(s), 25 plage(s) longue(s) conservée(s). source/export rotations consistent.
### hiphop-fanie-c3d

Source : Fanie_Hiphop_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **Hips** : 1 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftUpLeg** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftLeg** : 2 plage(s) modifiée(s), 10 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 15 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftToeBase** : 2 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 2 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 17 plage(s) modifiée(s), 11 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightToeBase** : 7 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine** : 1 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine1** : 1 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine2** : 1 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftShoulder** : 3 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 4 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 25 plage(s) modifiée(s), 28 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 41 plage(s) modifiée(s), 61 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Neck** : 2 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Head** : 2 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightShoulder** : 1 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 2 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 26 plage(s) modifiée(s), 23 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 35 plage(s) modifiée(s), 44 plage(s) longue(s) conservée(s). source/export rotations consistent.
### musical-theater-fanie-c3d

Source : Fanie_MusicalTheater_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **LeftLeg** : 3 plage(s) modifiée(s), 15 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 10 plage(s) modifiée(s), 8 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftToeBase** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 3 plage(s) modifiée(s), 9 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 8 plage(s) modifiée(s), 16 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightToeBase** : 1 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftShoulder** : 2 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 3 plage(s) modifiée(s), 4 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 37 plage(s) modifiée(s), 50 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 75 plage(s) modifiée(s), 77 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Head** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightShoulder** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 20 plage(s) modifiée(s), 27 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 43 plage(s) modifiée(s), 73 plage(s) longue(s) conservée(s). source/export rotations consistent.
### zumba-fanie-c3d

Source : Fanie_Zumba_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000007°.

- **Hips** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftUpLeg** : 0 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 2 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightUpLeg** : 0 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 2 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine** : 0 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 0 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 21 plage(s) modifiée(s), 32 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 112 plage(s) modifiée(s), 84 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 1 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 14 plage(s) modifiée(s), 14 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 61 plage(s) modifiée(s), 77 plage(s) longue(s) conservée(s). source/export rotations consistent.
### bellydance2-anna-cortesi-c3d

Source : AnnaCortesi_BellyDance2_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **Hips** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftUpLeg** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftLeg** : 1 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 0 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightUpLeg** : 0 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 0 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftShoulder** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 21 plage(s) modifiée(s), 11 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 100 plage(s) modifiée(s), 70 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightShoulder** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 1 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 9 plage(s) modifiée(s), 8 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 64 plage(s) modifiée(s), 46 plage(s) longue(s) conservée(s). source/export rotations consistent.
### randb-anna-cortesi-c3d

Source : AnnaCortesi_RandB_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **Hips** : 21 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftUpLeg** : 41 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftLeg** : 6 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 1 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightUpLeg** : 105 plage(s) modifiée(s), 26 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 35 plage(s) modifiée(s), 4 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 17 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine** : 15 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine1** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 14 plage(s) modifiée(s), 4 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 44 plage(s) modifiée(s), 14 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 0 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 10 plage(s) modifiée(s), 9 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 62 plage(s) modifiée(s), 25 plage(s) longue(s) conservée(s). source/export rotations consistent.
### salsa-stefanos-c3d

Source : StefanosKoullapis_Salsa_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **LeftFoot** : 2 plage(s) modifiée(s), 4 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 4 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 7 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 42 plage(s) modifiée(s), 39 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 3 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 46 plage(s) modifiée(s), 54 plage(s) longue(s) conservée(s). source/export rotations consistent.
### happy-dance-olivia

Source : Olivia_Happy_C3D_poses.npz, 120 Hz. Décalage : 3.1917 s. Erreur moyenne d’alignement : 0.000007°.

- **LeftLeg** : 3 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 14 plage(s) modifiée(s), 21 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftToeBase** : 3 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 1 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 12 plage(s) modifiée(s), 8 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightToeBase** : 1 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 3 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 26 plage(s) modifiée(s), 45 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 72 plage(s) modifiée(s), 91 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightShoulder** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 1 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 40 plage(s) modifiée(s), 21 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 85 plage(s) modifiée(s), 70 plage(s) longue(s) conservée(s). source/export rotations consistent.
### excited-dance-olivia

Source : Olivia_Excited_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000006°.

- **LeftLeg** : 1 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 11 plage(s) modifiée(s), 7 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftToeBase** : 0 plage(s) modifiée(s), 2 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 1 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 11 plage(s) modifiée(s), 9 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightToeBase** : 2 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftShoulder** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 2 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 28 plage(s) modifiée(s), 29 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 60 plage(s) modifiée(s), 75 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 19 plage(s) modifiée(s), 21 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 77 plage(s) modifiée(s), 81 plage(s) longue(s) conservée(s). source/export rotations consistent.
### pleased-dance-olivia

Source : Olivia_Pleased_C3D_poses.npz, 120 Hz. Décalage : 0.0000 s. Erreur moyenne d’alignement : 0.000007°.

- **LeftLeg** : 2 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 9 plage(s) modifiée(s), 4 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftToeBase** : 3 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 0 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 4 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightToeBase** : 3 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 7 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 25 plage(s) modifiée(s), 20 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 63 plage(s) modifiée(s), 53 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 3 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 30 plage(s) modifiée(s), 23 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 71 plage(s) modifiée(s), 56 plage(s) longue(s) conservée(s). source/export rotations consistent.
### yoga-dolphin-pose-or-ardha-pincha-mayurasana-a

Source : 221004_yogi_nexus_body_hands_03596_Dolphin_Pose_or_Ardha_Pincha_Mayurasana_-a_stageii.npz, 60 Hz. Décalage : 0.5000 s. Erreur moyenne d’alignement : 0.000007°.

- **Hips** : 4 plage(s) modifiée(s), 3 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftUpLeg** : 4 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftLeg** : 3 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftFoot** : 2 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftToeBase** : 6 plage(s) modifiée(s), 9 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightUpLeg** : 4 plage(s) modifiée(s), 1 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightLeg** : 5 plage(s) modifiée(s), 0 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightFoot** : 4 plage(s) modifiée(s), 5 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightToeBase** : 12 plage(s) modifiée(s), 15 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine** : 9 plage(s) modifiée(s), 10 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine1** : 13 plage(s) modifiée(s), 12 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Spine2** : 14 plage(s) modifiée(s), 10 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftShoulder** : 15 plage(s) modifiée(s), 21 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftArm** : 12 plage(s) modifiée(s), 19 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftForeArm** : 19 plage(s) modifiée(s), 23 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **LeftHand** : 15 plage(s) modifiée(s), 16 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Neck** : 11 plage(s) modifiée(s), 14 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **Head** : 10 plage(s) modifiée(s), 17 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightShoulder** : 11 plage(s) modifiée(s), 22 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightArm** : 12 plage(s) modifiée(s), 21 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightForeArm** : 16 plage(s) modifiée(s), 22 plage(s) longue(s) conservée(s). source/export rotations consistent.
- **RightHand** : 18 plage(s) modifiée(s), 20 plage(s) longue(s) conservée(s). source/export rotations consistent.

Le rapport JSON `scripts/npz_repair_candidates.json` fournit les dates exactes, clés et articulations modifiées, les erreurs source/export et les intervalles restants.

## Contrôles reproductibles

- `node scripts/temp_npz_resume.cjs repair` : régénérer les 12 candidats depuis les originaux (aucun lissage cumulatif).
- `node scripts/temp_npz_resume.cjs repair-test` : pics isolés, mouvement sain, signes q/−q, symétrie temporelle, longues zones intactes, récupération de base, alignement NPZ/GLB et invariants binaires des 12 paires.
- `node scripts/temp_npz_resume.cjs repair-browser` : avec Vite sur le port 5193 (ou `ROOM_TEST_URL`), vérifier les deux squelettes dans Chromium headless aux mêmes instants, puis écrire `scripts/npz_repair_browser.json` et trois captures pilotes dans `/tmp/room-npz-repair-review/`. Les deltas d’extrémités sont mesurés sur ces instants seulement. Ce contrôle du chargement, du mixeur et du rendu des squelettes ne valide pas les contacts ni le retargeting sur les personnages de l’application.
