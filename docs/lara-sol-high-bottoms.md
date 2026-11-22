# Bas de comparaison GPT-6.1-Sol high

Six entrées supplémentaires sont disponibles dans le registre commun : slip, shorty, tanga, string, legging et jogging. Chaque libellé porte exactement le suffixe « GPT-6.1-Sol high ». Les six modèles précédents restent inchangés et sélectionnables.

Dans `/lara-outfit-comparison.html`, le bouton « Comparer les bas · GPT-6.1-Sol high » ajoute douze tenues à la grille : chaque original est suivi de sa nouvelle version, avec le même haut natif, sans bottes ni accessoires pour voir les raccords. Les tenues déjà présentes restent dans la grille. Les animations et vues sont communes.

## Génération

```bash
blender --background --threads 4 --python-exit-code 1 --python scripts/lara_outfits/build.py -- --family sol-high-bottoms
```

Ajouter `--only bikini-slip-sol-high` (ou un autre identifiant du registre) pour une génération ciblée. Les exports se terminent par `_sol_high.glb`, dans les dossiers habituels `swimwear` et `bottoms`.

Les coupes utilisent la surface de peau actuelle : l'entrejambe est mesuré sur le profil central du bassin, sans reprendre la hauteur fixe des anciens générateurs. Les pièces ouvertes du collider sont raccordées et leurs normales orientées vers l'extérieur. Les ouvertures des vêtements sont découpées sur cette surface affinée. Slip, tanga et string ont des largeurs avant/arrière distinctes ; le shorty conserve des jambes. Le legging reste ajusté ; le jogging ajoute de l'aisance et des zones de bord-côte à la taille et aux chevilles. Les matériaux rouges existants sont conservés. Cette version du jogging ne reprend pas les cordons séparés de l'ancien modèle.

Une vraie simulation Cloth de 16 images ajuste chaque modèle avec collisions et auto-collisions ; les bords des ouvertures restent fixés. La gravité est désactivée pendant cet ajustement. Cloth est figé avant export et les poids sont transférés depuis la peau native, sans mélanger le donneur de sous-vêtement. Les animations dans l'application restent pilotées par le squelette existant.

## Validation

```bash
npx tsc --noEmit
npm run build
LARA_COMPARISON_URL=http://127.0.0.1:5174 node scripts/check-lara-sol-high-bottoms.cjs --hardware-gpu
```

Le navigateur est lancé en headless, bloque les requêtes externes et utilise un seul chargement. Le contrôle vérifie les six nouveaux vêtements aux côtés des originaux, leurs os natifs et les coordonnées animées en idle, marche et assise. Les captures se trouvent dans `/tmp/lara-sol-high-bottoms-{idle,walking,sitting-idle}.png`. L'inspection hors ligne face/trois-quarts/dos complète ces contrôles ; cela ne garantit pas l'absence de pénétration sur toutes les animations du catalogue.
