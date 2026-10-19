# Historique visuel

```bash
npm run test:screenshots
```

Capture **toutes les vues du registre `VIEWS`**, chacune en orthographique et en perspective : actuellement 10 vues, donc 20 PNG. Le registre est lu dans l’application ; toute nouvelle vue sera incluse automatiquement.

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
npm run test:screenshots -- --view=front,iso-se --label=avant-cuisine
npm run test:screenshots -- --preset=low
```

Par défaut : qualité Mid, 1280 × 720, DPR 1, interface masquée, aucun PNJ ni animal et temps d’animation 3D figé à zéro après préparation de la scène. Les positions viennent des vrais presets et les deux projections utilisent les commandes de caméra de l’application. Le rechargement automatique des sources est désactivé pendant les captures. Le runner attend une caméra réellement rendue et stabilisée avant chaque capture. Une erreur conserve la galerie partielle et les diagnostics.

Le comparateur signale des conditions différentes : qualité/calques, résolution, navigateur, GPU, graine et animation. La comparaison reste visuelle ; aucun seuil de pixels ne transforme automatiquement une évolution voulue en échec.

Les futurs GIF/vidéos pourront rejoindre ce même manifeste et cet historique. Les premiers scénarios intéressants seraient l’ouverture des portes et rangements, l’approche/relèvement d’un PNJ et un trajet de l’avion, avec caméra fixe et déroulement reproductible. Cette première commande produit des images fixes.

Le registre est `src/features/scene/camera/cameraViews.ts` : dessus, dessous, face, arrière, gauche, droite et les quatre diagonales. `resolveCameraView` fournit les positions selon la projection active, en conservant cible et direction ; la distance perspective correspond à la hauteur du cadre orthographique sur le plan cible. Les volumes en profondeur restent naturellement différents entre projections. Les anciens presets `perspective` (caméra dans le couloir) et `top3d` sont supprimés. Les boutons et raccourcis ne changent plus la projection sélectionnée.
