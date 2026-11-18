# Teckel noir et Ushiro : rigs anatomiques et catalogue Pitbull

Les deux modèles possèdent un squelette reconstruit et les 119 clips du Pitbull.
Le teckel conserve les trois mouvements de base validés, avec un pelage noir
appliqué aux couleurs de sommets, avec un matériau éclairé ; les yeux gardent
leurs matériaux distincts.
Ushiro est figé dans la pose debout de sa source, puis son armature, ses poids et
ses actions natives sont supprimés avant la reconstruction. Les pivots relevés
sur cette pose servent de repères géométriques pour un nouveau squelette commun.

Les longueurs des membres et du tronc restent fixes. Les rotations sont exprimées
par rapport au repos du donneur, avec quatre chaînes IK et des orientations de
pieds indépendantes. La translation du bassin est convertie du repère monde vers
le repère de l'os. Pour les postures supplémentaires, l'inclinaison tient compte
de la longueur du tronc. Les contacts utilisent les soles puis la peau déformée
pour éviter que ventre et arrière-train traversent le sol. La tolérance numérique
est relative à la hauteur du maillage (0,01 %), sans correction verticale fixe.

Le calcul thermique utilise un volume fermé intermédiaire. Les ouvertures et les
minuscules îlots créés par voxelisation d'Ushiro sont traités dans ce volume de
calcul : seule la composante connexe du corps contenant le repère du bassin est
utilisée. La surface visible complète reçoit ensuite les nouveaux poids. Les
poids sont limités et normalisés à quatre influences avant les calculs de contact,
comme dans l'export glTF. Aucun poids de l'ancien rig d'Ushiro n'est conservé.
Ses textures sont rechargées depuis l'archive et embarquées dans les exports ;
les chemins Windows de la source ne sont pas requis pour ouvrir le Blender.
La queue suit la courbe propre à chaque modèle ; celle du Shiba reste enroulée.

## Reconstruction

```bash
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-dogs.py -- --dog dachshund-sculpt
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-dogs.py -- --dog ushiro
node scripts/extract-dog-animation-options.cjs
```

Ajouter `--base-only` après le nom du chien pour une étude des trois clips de base.
Les sources dans `~/3D Resources/animals/` restent intactes. Les Blender éditables
sont dans `artifacts/dachshund-sculpt/` et `artifacts/ushiro/`.

## Vérification et aperçu

```bash
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/preview-dogs.py -- --dog dachshund-sculpt --extended
python scripts/compose-dog-review.py --dog dachshund-sculpt --extended
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/preview-dogs.py -- --dog ushiro --extended
python scripts/compose-dog-review.py --dog ushiro --extended
node scripts/check-dog-rigs.cjs --hardware-gpu
npx tsc --noEmit
npm run build
```

Vite doit écouter sur le port 5191 pour le test navigateur (ou fournir
`ROOM_TEST_URL`). Le test charge uniquement les deux modèles dans un rendu isolé,
échantillonne les 119 clips à 24 images/s, vérifie poids, offsets et échelles,
puis monte le vrai composant Ushiro pour contrôler son repos et sa caméra. Il
vérifie le sol pour assis, couché, saut et grattage avec une tolérance de 0,1 mm
à l'échelle affichée. Les vues de huit phases couvrent également repos, marche
et course. Les GIFs et planches sont enregistrés dans les dossiers `review/`.

Les contrôles numériques ne valent pas validation artistique de chaque clip.
Les morphologies et les détails faciaux des deux maillages diffèrent du Pitbull :
la présence des clips ne reconstitue pas une bouche ou une langue absentes.
