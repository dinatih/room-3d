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

## Remappage de la peau du corps assemblé (en cours)

`scripts/remap_lara_nude_skin.py` transfère les UV du corps HSH original
(`5_Body_1_0_0.004` dans `Lara_mix.blend`) sur les morceaux ajoutés du corps
sans vêtements, à partir de `8001_png_005_limbs.png`. Il enregistre le `.blend`,
exporte le GLB et régénère la correspondance des tatouages des jambes.

```bash
ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/remap_lara_nude_skin.py
npm run optimize:glb
```

Le script reconnaît une source déjà traitée et la réexporte sans nouveau transfert.
Pour reconstruire depuis une sauvegarde antérieure au transfert, ajouter
`-- --reference /chemin/vers/sauvegarde.blend` à la commande Blender.

Les UV d’origine sont conservés sur toutes les faces qui couvrent la peau, y
compris les morceaux ajoutés. Seuls les triangles couvrant les zones vides sont
transférés, sommet par sommet dans le même îlot UV du corps HSH. Cette méthode
évite les aplats triangulaires du transfert précédent et préserve les détails
du dos ainsi que les ombres sous la poitrine.

État actuel : les aperçus du tronc et du dos sont corrigés ; des raccords restent
visibles au bassin. Le résultat visuel global n'est pas finalisé.
Les contrôles automatiques valident les côtés tatoués, le squelette et la géométrie,
mais ne garantissent pas la qualité de ces raccords.

Le contrôle Chromium produit également quatre gros plans
`/tmp/lara-chest-{left,right}.png` et `/tmp/lara-hip-{left,right}.png` pour vérifier
les raccords latéraux, insuffisamment visibles sur les vues générales. Ces vues
confirment que le raccord sous la poitrine et une zone de la hanche restent à
corriger. L'interpolation des frontières UV et le recalcul des normales ont été
testés puis retirés, car ils aggravaient le rendu du bassin. Les normales d'origine
et le dernier remappage stable sont conservés.
