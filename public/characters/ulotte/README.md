# Ulotte — Teckel

Modèle provenant de l’archive fournie `dashshund-dog.zip` : `source/Dashshund.fbx`, texture diffuse `Dach_Diff.png` et texture spéculaire `Dash_Specular.png`, intégrées au GLB.

Conversion reproductible depuis la racine du projet :

```bash
blender -b -noaudio -t 2 --python scripts/import-ulotte.py -- '/home/dinatih/3D Resources/animals/dashshund-dog.zip'
```

Les six animations originales sont conservées à 24 images/s : `idle-1`, `idle-2`, `walk`, `run`, `jump`, `eating`. `PoseLib`, qui ne contient que les poses de travail, est exclue. L’opacité importée du FBX est corrigée pour afficher le pelage opaque. L’os `Muzzle`, enfant de `Head` et placé à son extrémité, donne la direction de la caméra sans modifier les animations.

Le composant `Dachshund` règle la hauteur totale à 30 cm, centre le modèle en X/Z et place ses pattes au sol dans la pose de repos. Les dimensions mesurées sont environ 19,2 × 50,2 × 30 cm. La mesure précise des sommets évite la surestimation liée aux axes inclinés du FBX.

Ulotte apparaît avec les animaux du jardin. Elle utilise la navigation commune, possède ses propres actions et caméras et apparaît sur la minimap. Dans l’inventaire, les animations natives se pilotent depuis la timeline sans modifier l’animal présent dans la scène.

Vérification navigateur (serveur Vite lancé sur le port indiqué) :

```bash
ROOM_TEST_URL=http://127.0.0.1:5191 node scripts/check-ulotte.cjs
```

Ajouter `--thumbnail` au test pour régénérer la miniature de l’inventaire. Sans cette option, les captures restent dans `/tmp`.
