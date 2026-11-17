# Teckel sculpté : reprise pour validation des trois mouvements de base

La variante d’inventaire expose uniquement `idle 50`, `walk_fwd 29` et
`run_fwd 13`. Les 116 autres transferts sont retirés : ils ne sont pas validés.
Ulotte dans le jardin reste indépendante de cette variante.

## Méthode

Le rig est reconstruit à partir du sculpt original et de repères anatomiques
mesurés dans ce maillage. Les têtes **et les extrémités** des os correspondent
aux articulations, avec une chaîne continue suivant la courbe de la queue.
Les longueurs des membres et du tronc restent fixes. Les actions ne contiennent
aucune translation des articulations hors bassin, ni animation des échelles.

Le pitbull fournit les écarts de rotation par rapport à son repos, le rythme,
la trajectoire des pieds et leurs phases de contact. Les quatre chaînes IK
respectent les longueurs propres au teckel ; les orientations des pieds sont
contrôlées indépendamment de la résolution du coude ou du genou. La hauteur des
cibles utilise la géométrie des soles et la levée mesurée sur le donneur.

Les poids proviennent d’un volume fermé intermédiaire puis sont interpolés sur
le sculpt allégé. La queue utilise une progression ordonnée entre ses sept os.
Les yeux et le crâne suivent le même os, avec une transition au raccord du cou.
La bouche fermée ne permet pas de reproduire mâchoire et langue.

## Reconstruction et contrôles

```bash
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-dachshund-sculpt.py
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/preview-dachshund-sculpt.py
python scripts/compose-dachshund-review.py
node scripts/extract-dog-animation-options.cjs
node scripts/check-dachshund-sculpt.cjs --hardware-gpu
npx tsc --noEmit
npm run build
```

Le test WebGL utilise un chargement isolé, bloque les requêtes externes et
échantillonne les trois clips à 24 images/s. Il vérifie les poids, les offsets
articulaires constants, les échelles unitaires, les matrices finies et l’absence
de retournement des segments de queue. Ces contrôles ne remplacent pas la
validation visuelle des mouvements.

Les GIFs (cadence du clip), planches de huit phases et images de détail sont dans
`artifacts/dachshund-sculpt/review/`. Le Blender éditable est
`artifacts/dachshund-sculpt/dachshund.blend`. Le modèle de preview est
`public/characters/dachshund-sculpt/dog.glb`.

État : trois mouvements reconstruits et proposés à validation visuelle de
l’utilisateur. Aucun accord sur leur qualité ne doit être déduit des seuls
tests techniques.
