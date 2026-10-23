# Import ACCAD hors combat — 23 octobre 2026

26 nouvelles animations issues des NPZ locaux de
`/home/dinatih/3D Resources/animations/ACCAD/ACCAD` sont ajoutées aux 7 clips
ACCAD déjà présents. Aucune marche, course, séquence de rampement ou animation
martiale n'est incluse. Une prise par action et interprète est retenue.

| Actions | Variantes ajoutées |
| --- | --- |
| Regarder autour, s'accroupir, se relever du sol en position accroupie | H1, H2, F pour chacune |
| Rester allongé | H1, H2, F, plus H1 sur le ventre |
| Se balancer sur place, balancer les bras debout | H1, H2, F pour chacune |
| S'allonger vers l'avant | H1 |
| Attendre, Urban 1, gestes variés, faire la roue | F pour chacune |
| Ramasser une boîte, soulever une boîte | H2 pour chacune |

Les libellés Urban 1 et gestes variés restent descriptifs de la source plutôt
que de leur attribuer un geste précis non annoté. Les captures originales des
sources peuvent comporter de petits repositionnements des pieds ; l'import
n'ajoute pas de séquences de locomotion dédiées.

## Pipeline et traçabilité

```bash
blender --background --python-exit-code 1 --python scripts/import_accad_actions.py -- --inspect
blender --background --python-exit-code 1 --python scripts/import_accad_actions.py
```

Le script sélectionne les sources, réutilise le convertisseur et la détection
des plages de calibration existants, puis conserve les exports avant correction
dans `/tmp/room-accad-import-original`. Il appelle `correct-accad-feet.cjs` avec
`--new-actions` et publie le manifeste TypeScript utilisé par le registre commun.
Les sept anciens GLB ACCAD ne sont pas régénérés par cet import.

- `public/animations/npz/_metadata/accad_actions.json` : sources relatives,
  catégories, durées, plages supprimées, nombre d'images et type d'appui.
- `src/features/scene/animations/accadManifest.ts` : entrées du catalogue.
- `public/animations/npz/accad/accad-*.glb` : nouveaux fichiers, avec provenance
  et méthode de correction dans `asset.extras`.

Les séquences debout reprennent le traitement de cheville et du sol nominal.
Les accroupissements, les poses allongées, les transitions et les gestuelles
libres utilisent le maillage de référence Xbot pour mesurer les contacts du
corps entier : les GLB d'animation ne contiennent aucun maillage. Le décalage
vertical est recalculé sur ce support, sans modifier les rotations des membres.
Cette référence ne garantit pas un contact exact pour toutes les morphologies,
chaussures, vêtements ou cheveux ; les contrôles sur Lara sont conservés dans
le rapport navigateur pour repérer ces différences.

Les séquences qui utilisent les contacts du corps portent
`scene.extras.animationSampling: source` : le retargeting conserve leurs clés
à 120 Hz au lieu de les réduire à 30 Hz. Cette indication est transmise au
worker et testée sur tous les imports concernés.

Les boîtes H2 possèdent les annotations de double appui utilisées par le
solveur après retargeting, comme les boîtes H1/F. Les accroupissements H1/F ancrent les deux pieds après retargeting ; H2 ancre
uniquement le pied droit, sa jambe gauche reculant vers une position à genou.
Leurs contacts portent `level: true` : l'inclinaison talon–orteils est ramenée
à plat et la hauteur d'appui vient de la pose de repos du personnage cible,
pas de la première image animée ni du maillage Xbot. Le biais de cheville est
aussi corrigé dans les GLB, y compris pour la jambe libre de H2 avant son lever.
Les autres nouvelles actions ne reçoivent pas de verrouillage intégral des pieds :
plusieurs ont des appuis sur les mains, les genoux ou des repositionnements volontaires.

## Contrôles

```bash
ACCAD_ORIGINAL_DIR=/tmp/room-accad-import-original node scripts/correct-accad-feet.cjs --new-actions --check
node --test --test-isolation=none tests/unit/snake-foot-contacts.test.cjs
node scripts/check-accad-actions.cjs
npx tsc --noEmit
npm run build
```

La planche contrôle notamment F à l'image 106 et H2 à l'image 15, les deux
poses signalées pour flottement et orteils relevés.

Le contrôle des sources compare les pistes non corrigées et les quaternions aux
exports de référence. Le test des appuis inclut les deux nouvelles boîtes H2 sur
Lara, Xbot et Ybot, avec interpolation et sérialisation vers le worker.
Le navigateur lit les 26 clips sur Lara et Xbot et produit :

- `/tmp/accad-actions-browser.json` : hauteurs du maillage à cinq instants par clip.
- `/tmp/accad-actions-contact-sheet.png` : planche des nouvelles actions à mi-parcours.

Le navigateur reste headless via le lanceur commun. `ROOM_TEST_URL` choisit
l'adresse de Vite ; `ACCAD_PREVIEW_MODEL=lara` permet une planche de Lara à la
place de Xbot. Voir aussi [les défauts récurrents](animation-defects.md).
