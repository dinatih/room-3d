# Ulotte — Teckel

Modèle provenant de l’archive fournie `dashshund-dog.zip` : `source/Dashshund.fbx`, texture diffuse `Dach_Diff.png` et texture spéculaire `Dash_Specular.png`, intégrées au GLB.

Conversion reproductible depuis la racine du projet :

```bash
blender -b -noaudio -t 2 --python scripts/import-ulotte.py -- '/home/dinatih/3D Resources/animals/dashshund-dog.zip'
```

Les cycles de locomotion (`walk` images 7 à 31, `run` images 7 à 23) sont rééchantillonnés à partir de l’image 1 avec raccord cyclique exact dans le script d’import pour supprimer tout à-coup ou saut de trame au bouclage.

Les six animations originales sont conservées à 24 images/s : `idle-1`, `idle-2`, `walk`, `run`, `jump`, `eating`. `PoseLib`, qui ne contient que les poses de travail, est exclue. L’opacité importée du FBX est corrigée pour afficher le pelage opaque. L’os `Muzzle`, enfant de `Head` et placé à son extrémité, donne la direction de la caméra sans modifier les animations.

Le composant `Dachshund` règle la hauteur totale à 30 cm, centre le modèle en X/Z et place ses pattes au sol dans la pose de repos. Les dimensions mesurées sont environ 19,2 × 50,2 × 30 cm. La mesure précise des sommets évite la surestimation liée aux axes inclinés du FBX.

Ulotte apparaît avec les animaux du jardin. Elle utilise la navigation commune, possède ses propres actions et caméras et apparaît sur la minimap. Dans l’inventaire, les animations natives se pilotent depuis la timeline sans modifier l’animal présent dans la scène.

Vérification navigateur (serveur Vite lancé sur le port indiqué) :

```bash
ROOM_TEST_URL=http://127.0.0.1:5191 node scripts/check-ulotte.cjs
```

Ajouter `--thumbnail` au test pour régénérer la miniature de l’inventaire. Sans cette option, les captures restent dans `/tmp`.

## Vie autonome des chiens

Les deux chiens utilisent les règles communes de `dogBehavior.ts` : 80 % des trajets en marche et 20 % en course à 120 cm/s. Ushiro marche à 50 cm/s ; Ulotte à 18,5 cm/s, vitesse mesurée sur le recul de sa patte arrière en appui (9,25 cm entre les images 7 et 19 à 24 images/s), pour accorder sa translation à sa foulée. Les destinations privilégient leur zone actuelle. Les repos alternent sans répétition immédiate ; les sauts sont occasionnels et joués une seule fois. Ushiro peut aussi s’asseoir, Ulotte dispose de deux repos. Les changements autonomes utilisent un fondu de 0,25 seconde ; les aperçus conservent leur timeline exacte.

Une seule gamelle est placée dans le jardin du voisin Est, en `(516, 0, -259,76)` cm. Ulotte vient y manger toutes les deux à quatre minutes, à pied. Le point d’approche est mesuré au bout de son museau dans le clip de repas. Elle joue trois cycles puis reprend ses activités. Un accès occupé ou impraticable reporte le repas de trente secondes, sans téléportation.

Les raccourcis de danse des menus du chien et des personnages sont supprimés. L’animation humaine « Dance With Dog », son aperçu et la réaction synchronisée d’Ushiro restent disponibles dans le système d’animations.
