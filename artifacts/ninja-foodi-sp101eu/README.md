# Ninja Foodi SP101EU — modèle récupéré

- Produit Amazon France : `B08P22VJ3T`.
- Archive source : https://m.media-amazon.com/images/I/91Lyfs73TML.zip
- Récupération : 25 octobre 2026, depuis la vue 3D de l’application Amazon dans un émulateur Android.
- Fichier : `ninja-foodi-sp101eu.glb`, avec géométrie et quatre textures intégrées.
- Conversion : assemblage du glTF et de ses ressources en GLB ; texture normale Basis Universal décodée en PNG, avec restitution des normales RGB depuis les canaux X/Y stockés en rouge/alpha. Géométrie Draco, matériaux, échelle et métadonnées de copyright conservés.
- Unités d’origine : mètres ; environ 52,41 × 19,08 × 37,69 cm après décodage Draco (largeur × hauteur × profondeur).
- Vérification : import Blender réussi, 76 434 triangles, quatre textures de 2 048 × 2 048 pixels. Aperçu : `preview.png`.
- Validation Khronos : aucune erreur ; trois avertissements sur les tangentes calculées au chargement, déjà absentes du modèle source.

L’original reste inchangé. La variante articulée utilisée par la scène et l’inventaire est `public/items/ninja-sp101/ninja-sp101-animated.glb`, générée par `blender -b -noaudio --python scripts/articulate_ninja_sp101.py` : porte à charnière basse (0,8 s), grille coulissante (0,8 s), ancrage de lampe intérieure. Les pièces existantes sont séparées par îlots complets, sans découpe de faces ; un petit diffuseur de lampe est ajouté.
