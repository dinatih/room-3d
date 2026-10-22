# Dröna hauts : sortir, porter, prendre et remettre

Les interactions `drona-se-pyjama` (centre à 145,75 cm) et `drona-nw-upper`
(136,25 cm) utilisent trois clips distincts : `pull`, `search`, `push`.
Le bac quitte entièrement sa case avant de rejoindre l’avant-bras gauche.
La main droite mime une prise ; aucun objet supplémentaire n’est créé.

## Sources et génération

```sh
blender --background --python scripts/build-drona-carry.py
```

Le script part de la pose idle du Xbot officiel présent dans
`public/characters/xbot/Xbot_official.glb`, résout les bras par IK analytique,
puis exporte à 30 images/s les six GLB et les trajectoires de contact.
Les actions et le bac restent éditables dans
`public/animations/custom/drona-carry.blend`.

Les coordonnées de travail sont en centimètres, Y vertical, personnage tourné
vers +Z et centre de case à Z=62. Le script convertit les axes pour Blender.
Le bac reste droit et se déplace dans le repère local de sa case.
`dronaCarryMotion.json` contient la position du bac, les centres des paumes,
les directions des doigts et l’influence de contact au début/à la fin du geste.

La préparation des animations dans le worker recalcule les coudes et poignets
pour les deux références, Xbot et Lara native, puis conserve les pistes cuites
dans le cache habituel. Aucun solveur IK ne tourne pendant le rendu.
Une cible hors de portée provoque une erreur explicite.

## Lecture et vérification

Chaque phase attend la fin réelle du clip, même pendant son chargement.
Le bac suit le temps du mixer et les previews utilisent le même échantillonnage,
y compris lors d’un déplacement en arrière dans la timeline. L’interruption
libère la réservation et supprime la pose portée pour rendre le bac à sa case.

```sh
npx tsc --noEmit
npm test
npm run build
node scripts/test-drona-carry.cjs
```

Le dernier test utilise Chromium headless, les modèles réels et le même calcul
de préparation que le worker. Il vérifie les séquences et les contacts des deux
mains pour chaque référence et chaque hauteur. Les captures de face et de profil
et le rapport `drona-carry-check.json` sont écrits dans `/tmp`.
