# Historique visuel

```bash
npm run test:screenshots
```

Capture **les 8 directions × les 4 élévations** (90°, 45°, 0°, −90°), chacune en orthographique et en perspective : 32 vues, donc 64 PNG. Les listes `CARDINAL_VIEWS` et `ELEVATION_VIEWS` sont lues dans l’application ; toute nouvelle direction ou élévation sera incluse automatiquement. Les positions sont calculées par `resolveCameraView` dans `cameraViews.ts`, comme dans l’interface.

Ouvrir la page de comparaison locale :

```bash
xdg-open '/home/dinatih/Projects/room-3d/test-results/visual/index.html'
```

Choisir deux dates/commits dans les listes « Avant » et « Après ». Les images apparaissent côte à côte ; cliquer dessus ouvre leur taille originale. Chaque exécution possède également sa galerie complète et un document Markdown avec toutes les images.

```text
test-results/visual/
  index.html                     # Comparateur de deux exécutions
  <date>-<commit>/
    index.html                   # Galerie orthographique / perspective
    README.md                    # Document simple avec toutes les images
    manifest.json                # Commit, configuration, caméras et fichiers
    <vue>-ortho.png
    <vue>-persp.png
    result.json                  # Navigateur, GPU, erreurs et nettoyage
```

Tout fonctionne hors ligne, sans serveur ni dépendance externe pour consulter les documents. Les captures restent ignorées par Git ; conserver/copier ce dossier pour garder l’historique. Les exécutions précédentes ne sont jamais écrasées.

Pour cibler une vue ou annoter une étape :

```bash
npm run test:screenshots -- --view=north-45,south-east-0,north--90 --label=avant-cuisine
npm run test:screenshots -- --preset=low
```

Par défaut : qualité Mid, 1280 × 720, DPR 1, interface masquée, aucun PNJ ni animal et temps d’animation 3D figé à zéro après préparation de la scène. Les positions viennent des vrais presets et les deux projections utilisent les commandes de caméra de l’application. Le rechargement automatique des sources est désactivé pendant les captures. Le runner attend une caméra réellement rendue et stabilisée avant chaque capture. Une erreur conserve la galerie partielle et les diagnostics.

Le comparateur signale des conditions différentes : qualité/calques, résolution, navigateur, GPU, graine et animation. La comparaison reste visuelle ; aucun seuil de pixels ne transforme automatiquement une évolution voulue en échec.

Les futurs GIF/vidéos pourront rejoindre ce même manifeste et cet historique. Les premiers scénarios intéressants seraient l’ouverture des portes et rangements, l’approche/relèvement d’un PNJ et un trajet de l’avion, avec caméra fixe et déroulement reproductible. Cette première commande produit des images fixes.

`resolveCameraView` dans `src/features/scene/camera/cameraViews.ts` fournit les positions selon la direction, l’élévation et la projection active, en conservant cible et direction entre projections ; la distance perspective correspond à la hauteur du cadre orthographique sur le plan cible. Les volumes en profondeur restent naturellement différents entre projections. À 90° et −90°, les huit directions conservent des orientations d’image différentes. Le manifeste enregistre la direction, l’élévation et le preset demandé pour chaque vue. Les boutons et raccourcis ne changent plus la projection sélectionnée.
