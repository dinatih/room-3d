# Teckel sculpté : variante de comparaison

La fiche « Teckel sculpté — comparaison Pitbull » est indépendante d’Ulotte et
n’ajoute pas de chien au jardin. Elle expose le catalogue du Pitbull dans la
preview existante, avec les commandes de lecture et le panneau du squelette.

## Reconstruction

```bash
blender -b -t 2 --python scripts/rig-dachshund-sculpt.py
blender -b -t 2 --python scripts/preview-dachshund-sculpt.py
node scripts/extract-dog-animation-options.cjs
```

Source : `~/3D Resources/animals/dachshund-sculpt.zip`, entrée
`source/CocoSculpt.glb`. Le donneur est le Pitbull déjà présent dans le projet.
Le script conserve les matériaux et les couleurs de sommets, crée une version
allégée visant 60 000 sommets et laisse l’archive originale intacte.

Les pivots du donneur sont ajustés suivant des repères de bassin, poitrine,
crâne et museau dans les coordonnées du sculpt. Les poids sont calculés par
le solveur thermique Blender sur un volume fermé intermédiaire, puis interpolés
sur la surface visible. Le crâne et les yeux séparés suivent le même os de tête ;
une bande de transition au raccord du cou évite le détachement des yeux.

Les positions et orientations des articulations animées sont transférées
image par image en espace monde, puis converties en transformations locales
dans le squelette adapté. Le transfert des positions permet aux pattes courtes
de suivre les appuis du donneur malgré les différences de longueur du tronc.
La planche d’inventaire reste une référence de placement, pas une mesure issue
d’un examen radiologique du modèle.

## Livrables

- `artifacts/dachshund-sculpt/dachshund.blend` : scène éditable et actions.
- `public/characters/dachshund-sculpt/dog.glb` : export pour la preview.
- Trois vues PNG dans le même dossier public.

## Vérification

Avec Vite sur le port 5191 :

```bash
node scripts/check-dachshund-sculpt.cjs --hardware-gpu
npx tsc --noEmit
npm run build
```

Le test utilise un rendu WebGL isolé, bloque les requêtes externes, vérifie les
poids normalisés et les matrices du squelette des 119 clips au début, au milieu
et à la fin. Les bornes de peau sont vérifiées pour repos, marche, course,
assis, couché et saut.
Les bornes finies et l’absence d’erreur ne prouvent pas la qualité anatomique :
les six rendus Blender servent à examiner les poses et les plis de peau.
Les expressions faciales fines du Pitbull ne sont pas reproduites : seuls les
os utiles au corps, aux membres, à la tête, aux oreilles et à la queue déforment
le sculpt. La bouche fermée ne fournit pas une mâchoire intérieure animable.
