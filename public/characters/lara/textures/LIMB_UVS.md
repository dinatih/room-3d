# Lara : textures des membres indépendants

Source : `../lara_perfect.blend`. Les UV des bras, jambes, doigts, mains et pieds
utilisent des atlas de 1024 × 512 pixels : moitié gauche de l'image = côté gauche
anatomique du personnage, moitié droite = côté droit. La résolution par côté reste
512 × 512. Les zones des bras et jambes sont indiquées dans `limb-uv-guide.svg`.
`limb-atlases.json` associe les images originales à leurs nouveaux atlas.

Les atlas sont embarqués dans le `.blend` et exportés dans le GLB. Les textures du
torse restent indépendantes. `Lara_mix.blend` et `lara_perfect.blend1` sont conservés.

Depuis la racine du projet :

```bash
ALSOFT_DRIVERS=null blender -b --python scripts/separate_lara_limb_uvs.py
npm run optimize:glb
ALSOFT_DRIVERS=null blender -b --python scripts/separate_lara_limb_uvs.py -- --verify
```

Le script reconnaît le dépliage déjà migré : les réexports ne redéplacent pas les UV
et ne remplacent pas les atlas retouchés dans Blender. Après une retouche, enregistrer
les PNG externes également si l'on souhaite synchroniser les fichiers d'images.

Les tatouages sont générés par l'application : Marissa à gauche, Delphina à droite.
Les fichiers `*_tattoo_uv.png` sont des données de correspondance UV pour les jambes
sans vêtements, dont le dépliage diffère. Ne pas les retoucher comme des images :
R/G encodent X sur 10 bits, G/B encodent Y sur 9 bits, alpha indique les texels couverts.
Ils sont générés à partir des surfaces du modèle, sans changement de géométrie.

Contrôle du GLB, des côtés tatoués et de la déformation des membres dans Chromium
(avec `npm run dev` lancé sur le port 5173) :

```bash
node scripts/check-lara-limb-uvs.mjs
```
