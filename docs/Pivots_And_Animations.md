# Architecture des Animations 3D : FBX vs GLB

Ce document explique les défis techniques rencontrés lors de l'intégration des personnages animés (Mixamo) dans notre environnement React Three Fiber, et comment ils ont été résolus.

## 1. Le Cœur du Problème : Le Point de Pivot

La majorité des problèmes d'animation rencontrés (le personnage qui glisse sur le sol, qui avance tout seul ou qui décrit un large arc de cercle en tournant - l'effet "swing") proviennent d'une différence fondamentale de philosophie entre les formats de fichiers 3D.

### La Philosophie Mixamo (FBX Natif)
Mixamo a été conçu pour l'industrie du jeu vidéo autour du format FBX. Son standard est strict :
*   **Le Pivot (Ground Point)** : L'origine absolue (0,0,0) de l'objet 3D est toujours située **exactement entre les deux pieds, au niveau du sol**.
*   **La Hiérarchie** : Il n'y a pas de nœud "racine" abstrait (root joint). Le tout premier os du squelette est `mixamorig:Hips` (les hanches), qui flotte à environ 1 mètre au-dessus du sol.
*   **Le Mouvement** : Lors d'un cycle de marche, Mixamo déplace l'os `Hips` dans l'espace. Le pivot (les pieds) restant à (0,0,0), une rotation appliquée à l'objet fait pivoter le personnage parfaitement sur ses talons.

### Le Chaos de la Conversion Web (GLTF / GLB)
Le format GLB est le standard moderne du web, optimisé pour le chargement, mais sa structure interne casse souvent les règles du FBX lors de la conversion (via Blender par exemple) :

*   **Perte du Pivot (Center Point)** : Le GLB a tendance à recalculer le "centre" de l'objet en fonction de sa géométrie globale (Bounding Box). À cause d'éléments asymétriques (un sac à dos lourd, des pistolets, une longue tresse), le centre géométrique de Lara s'est retrouvé décalé vers le haut et vers l'arrière, quelque part dans son dos.
*   **Injection du `_rootJoint`** : L'exportateur GLB ajoute souvent un os artificiel tout en bas de la hiérarchie appelé `_rootJoint` pour garantir la compatibilité mathématique glTF.
*   **Le transfert du Root Motion** : Lors de la conversion, le mouvement d'avancement de la marche (qui ne devait affecter que les hanches) se retrouve souvent transféré en partie sur ce nouveau `_rootJoint`.

## 2. Les Conséquences Pratiques

**A. L'effet de "Swing" (Arc de cercle) :**
Puisque notre modèle GLB avait son pivot géométrique décalé dans le dos au lieu d'être entre ses pieds, demander à Three.js de "tourner à droite" provoquait une rotation autour de cet axe invisible dans le dos. Les pieds décrivaient alors un grand arc de cercle (comme un essuie-glace).

**B. La marche infinie (Glissade) :**
Dans notre code (`Walker.tsx`), nous bloquions les translations horizontales des hanches pour forcer la marche "sur place" (in-place animation). Cependant, le format GLB ayant secrètement ajouté un mouvement d'avancement sur le `_rootJoint`, le personnage continuait d'avancer tout seul, créant un décalage irrécupérable entre la position logique de la caméra et la position visuelle du modèle.

## 3. Les Solutions (Implémentées dans Walker.tsx)

La solution a été de construire un "pont" logiciel dans `Walker.tsx` pour forcer le GLB à se comporter comme un FBX Mixamo natif :

1.  **Le Fix du Pivot (Centrage Hanches)** : Au lieu de centrer le modèle par rapport au centre de sa Bounding Box, le script recherche l'os `Hips` (`pelvis_03` ou `mixamorig_Hips`), lit ses coordonnées X/Z exactes en monde, et décale l'intégralité de la scène 3D à l'opposé. Le pivot absolu du groupe devient ainsi parfaitement aligné avec la colonne vertébrale du personnage. Lara tourne enfin sur elle-même.
2.  **L'Oblitération du Root Motion** : Un filtre strict a été ajouté dans `retargetMixamoClip`. Il ignore purement et simplement toute piste d'animation provenant de l'os artificiel `_rootJoint`.
3.  **Le Verrouillage des Hanches** : Les pistes de translation X (droite/gauche) et Z (avant/arrière) des hanches sont forcées à la valeur exacte de leur pose de repos. Seule l'oscillation Y (le rebond naturel de la marche) est conservée.
4.  **L'Amortissement du Sway** : La rotation (Quaternion) des hanches est filtrée : le "Roll" (inclinaison latérale) est mis à zéro, et le "Yaw" (torsion) est divisé par 10, supprimant ainsi la démarche de "mannequin de défilé" exagérée qui faisait osciller le modèle hors de son axe.

C'est exactement cette différence de paradigme entre l'industrie du jeu vidéo (FBX orienté sol) et le web moderne (GLB orienté volume) qui rend le retargeting d'animation en temps réel si complexe et imprévisible sans un contrôle algorithmique total sur les os et le point d'origine.
