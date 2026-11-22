# Body rouge natif

Sélectionner « Body rouge natif » dans les hauts de Lara. Le bas « Aucun » montre le body seul ; le bas « Native » conserve le short. La sélection du body ne retire pas automatiquement le short.

Génération depuis la racine du dépôt :

```bash
blender --background --threads 2 --python-exit-code 1 --python scripts/lara_outfits/build.py -- --family swimwear --only body-native-red
```

Le générateur copie le mesh `shirt`, ses UV et ses poids. Les deux triangles détachés de doublure de bottes sont exclus grâce à la hauteur anatomique du bassin. Les contours et les sommets du haut natif sont fixés pendant une véritable simulation Blender Cloth de 16 images, avec collisions et auto-collisions. La gravité est désactivée pour cet ajustement de tissu extensible près du corps.

Les panneaux ajoutés rejoignent le dessous réel du bassin : le profil sagittal est mesuré sur la peau, au lieu de prolonger les panneaux jusqu'à une hauteur d'entrejambe supposée ou sur la face interne des cuisses. Les composantes de peau utilisées comme collider sont orientées vers l’extérieur, sans modifier les meshes affichés. La zone sans peau derrière le haut est reliée au bassin sans projeter à travers cette ouverture. Après Cloth, la surface ajoutée est subdivisée et ajustée au collider avec un dégagement de 2 mm pour réduire les intersections des faces. Les poids du haut natif sont conservés ; ceux de la partie ajoutée sont transférés depuis la peau actuelle. Le tissu reprend le rouge pur de ViviDa-Bisa (Vivida 2), multiplié par l’atlas natif en niveaux de gris (luminosité 130 %, contraste 140 %), avec une rugosité de 0,4 et sans métal. La partie reconstruite utilise la teinte rouge médiane du textile ; les UV du haut restent inchangés. Aucun mesh de peau n'est modifié.

L'export contient le haut et une section `native_body_gusset`. Cette dernière est masquée sous le short natif, dont la géométrie croise le tissu reconstruit. Le torse de peau utilisé est celui de la tenue native, sans doublonner le haut. Cloth est figé à l'export : l'application utilise le squelette, sans simulation de tissu en temps réel.

Contrôles :

```bash
npx tsc --noEmit
npm run build
LARA_COMPARISON_URL=http://127.0.0.1:5174 node scripts/check-lara-native-body.cjs --hardware-gpu
```

Le test navigateur bloque les requêtes externes, vérifie la peau native et le short, la visibilité de la section couverte et les coordonnées animées du vêtement en idle, marche et assise, avec et sans short. Il produit les captures `/tmp/native-body-browser-{none,native}-{idle,walking,sitting-idle}.png` pour inspection visuelle. Ces contrôles échantillonnent les poses ; ils ne constituent pas une preuve d'absence de pénétration pour toutes les animations du catalogue.
