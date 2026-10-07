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

Les jonctions faites à la main sous les seins sont reconstruites par
`scripts/rebuild_lara_skin_bridge.py` : subdivision locale, courbure ajustée aux
surfaces voisines et UV interpolés depuis leurs bordures. Les poids du squelette
sont interpolés lors de la subdivision. Le reste du corps garde sa géométrie.
L'îlot UV isolé de la hanche gauche est raccordé à la peau voisine, supprimant
la tache sombre visible dans les gros plans. La projection évite également les
bords vides de l'atlas dans l'empreinte du filtrage bilinéaire.

Après le remappage initial :

```bash
ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/rebuild_lara_skin_bridge.py
npm run optimize:glb
```

La reconstruction est enregistrée dans le `.blend`. Les réexécutions reconnaissent
les zones déjà reconstruites et réexportent le modèle sans nouvelle subdivision.
Une reconstruction depuis une sauvegarde antérieure doit se faire dans cet ordre :
remappage de la peau, reconstruction des jonctions, optimisation du GLB.

Le contrôle Chromium produit quatre gros plans `/tmp/lara-chest-{left,right}.png`
et `/tmp/lara-hip-{left,right}.png`, en plus des vues générales. Il vérifie les
poids des nouveaux sommets du tronc, les attributs de géométrie, le squelette et
les côtés tatoués. Les raccords de la taille restent ceux du corps assemblé.

## Déformation du corps sans vêtements

Les poids des fesses et du tronc sont corrigés dans le `.blend` par :

```bash
ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/fix_lara_skin_weights.py
npm run optimize:glb
```

La surface postérieure des fesses suit davantage le bassin, avec une transition
progressive vers les cuisses. Les bornes viennent des articulations du modèle.
Au-dessus du pivot lombaire, l'influence du bassin décroît progressivement et
celle du haut du dos augmente ; les poids de l'attache inférieure sont conservés.
Les trois morceaux du corps sans vêtements utilisent la même règle. Les poids
sont normalisés, sans modification des os, des UV ni de la géométrie au repos.
Le script reconnaît une source déjà corrigée et la réexporte sans réappliquer
les transferts. `-- --reference /chemin/source.blend` permet de reconstruire depuis
une sauvegarde antérieure à la correction des poids.

Le contrôle produit `/tmp/lara-crouch-deformation.png` avec une flexion des hanches
à 90°, des genoux à 90° et une flexion répartie sur les deux os du dos. La comparaison
avec les poids précédents montre un volume postérieur mieux conservé et une
cassure du tronc atténuée. Les plis des poses extrêmes restent limités par la
résolution du maillage. Ces aperçus restent des fichiers locaux dans `/tmp` et
ne sont plus copiés dans les fichiers publics du site.
