# Pipeline d'Importation, Rigs et Retargeting d'Animation

Ce document détaille la structure des personnages, le pipeline d'importation des modèles sources (FBX, GLB/GLTF) issus de Mixamo ou de Sketchfab, ainsi que le fonctionnement technique de notre système de retargeting d'animation en temps réel.

---

## 1. Définition du Rig de Référence (Standard)

Dans ce projet, l'échelle standard est définie comme : **1 unité = 1 cm**.
Notre rig de référence est le squelette **Mixamo Standard** configuré en centimètres (hauteur moyenne d'un humain debout : ~180 cm).

Un rig compatible doit respecter les contraintes suivantes :
* **Point d'Origine (Pivot)** : Centré horizontalement en X/Z, et positionné au sol en Y = 0 (exactement entre les pieds en pose de repos).
* **Os Racine (Hips)** : Le premier os physique déformant la géométrie est l'os des hanches (`mixamorig:Hips` ou équivalent), situé à une hauteur de repos d'environ 95 à 105 cm.

---

## 2. Analyse des Modèles Sources

Le projet intègre deux personnages avec des structures de squelette et des origines différentes :

### A. X-Bot (Modèle Référence)
* **Source** : Three.js Official Examples (`Xbot_official.glb`).
* **Nomenclature** : Mixamo standard avec des deux-points (`:`) comme séparateur (ex: `mixamorig:Hips`, `mixamorig:LeftArm`).
* **Animations** : Embarquées directement à l'intérieur du fichier GLB (Marche, Pose neutre, etc.).
* **Échelle** : Déjà configurée en centimètres (les Hips sont à Y = ~104 cm).

### B. Lara Croft (Modèle Personnalisé)
* **Source** : Modèle Sketchfab converti (`lara_native.glb`).
* **Nomenclature** : Noms d'os personnalisés utilisant des underscores (`_`) (ex: `mixamorig_root_hips`, `mixamorig_arm_left_shoulder_2`).
* **Structure hiérarchique** : Dispose d'un os parent supplémentaire au niveau du sol nommé `mixamorig_root_ground`, qui sert de point d'attache au sol sous les hanches `mixamorig_root_hips`.
* **Échelle** : Hauteur de repos configurée en centimètres (les Hips sont à Y = ~99 cm).

---

## 3. Différences entre Personnages (Squelettes et Hiérarchies)

Le tableau suivant montre la correspondance exacte établie pour mapper les pistes d'animation de l'X-Bot (source) vers Lara Croft (cible).

| Articulation Mixamo Standard (Source X-Bot) | Articulation Lara Croft Cible | Rôle / Position |
| :--- | :--- | :--- |
| `mixamorig:Hips` | `mixamorig_root_hips` | Bassin / Hanche (Racine physique) |
| `mixamorig:Spine` | `mixamorig_spine_lower` | Bas du dos |
| `mixamorig:Spine2` | `mixamorig_spine_upper` | Haut du dos / Torse |
| `mixamorig:Neck` | `mixamorig_head_neck_lower` | Cou |
| `mixamorig:Head` | `mixamorig_head_neck_upper` | Tête |
| `mixamorig:LeftUpLeg` | `mixamorig_leg_left_thigh` | Cuisse gauche |
| `mixamorig:LeftLeg` | `mixamorig_leg_left_knee` | Genou gauche |
| `mixamorig:LeftFoot` | `mixamorig_leg_left_ankle` | Cheville gauche |
| `mixamorig:LeftToeBase` | `mixamorig_leg_left_toes` | Orteils gauches |
| `mixamorig:LeftArm` | `mixamorig_arm_left_shoulder_2` | Épaule gauche |
| `mixamorig:LeftForeArm` | `mixamorig_arm_left_elbow` | Coude gauche |
| `mixamorig:LeftHand` | `mixamorig_arm_left_wrist` | Poignet gauche |
| `mixamorig:RightUpLeg` | `mixamorig_leg_right_thigh` | Cuisse droite |
| `mixamorig:RightLeg` | `mixamorig_leg_right_knee` | Genou droit |
| `mixamorig:RightFoot` | `mixamorig_leg_right_ankle` | Cheville droite |
| `mixamorig:RightToeBase` | `mixamorig_leg_right_toes` | Orteils droits |

---

## 4. Différences entre Animations Natives et Externes

Lors de l'import d'animations depuis Mixamo, la structure des pistes (`AnimationClip`) diffère selon le mode d'exportation.

### Animations Natives (Embarquées dans l'X-Bot)
* **Format des pistes** : Les noms ciblent les articulations avec des deux-points (`mixamorig:Hips.quaternion`).
* **Unités** : Exprimées en centimètres (les valeurs de position en Y des hanches sont autour de `100.0`).
* **Pistes d'échelle** : Contiennent des pistes `.scale` qui peuvent être ignorées pour éviter d'altérer la morphologie des personnages.

### Animations Mixamo Externes (ex : `anim_walking.glb`)
* **Format des pistes** : Les noms ciblent souvent les articulations avec un underscore (`mixamorig_Hips.quaternion` ou `mixamorig_Hips.position`).
* **Unités** : Souvent exportées en **mètres** (les valeurs de position en Y des hanches sont proches de `1.0`).
* **Pistes d'échelle** : Incluses pour chaque os, ce qui force le maillage cible à adopter la stature de l'armature Mixamo d'origine si elles ne sont pas filtrées.

---

## 5. Algorithme de Retargeting en Temps Réel (`Walker.tsx`)

Pour faire jouer les animations de l'X-Bot sur le squelette de Lara Croft, nous appliquons un algorithme de retargeting dynamique qui effectue les opérations suivantes :

### A. Détection Dynamique de l'Échelle (`hipsRatio`)
Pour aligner les coordonnées de translation des hanches (mètres vs centimètres), le script mesure la hauteur initiale de l'os racine dans l'animation :
* Si la hauteur absolue est supérieure à `40.0`, le clip est déjà en centimètres (facteur d'échelle `1.0`).
* Si elle est inférieure, le clip est en mètres et on le multiplie par un facteur d'échelle de `100.0`.

### B. Conversion de Repère pour la Rotation (Quaternion Retargeting)
Chaque rotation d'os ($q$) issue de l'animation X-Bot est projetée dans le repère de Lara en utilisant les quaternions de pose de repos (rest pose) du squelette source ($P_{src}$, $B_{src}$) et du squelette cible ($P_{tgt}$, $B_{tgt}$) :

$$resQ = P_{tgt}^{-1} \cdot P_{src} \cdot q \cdot B_{src}^{-1} \cdot B_{tgt}$$

Dans le code TypeScript :
```typescript
const resQ = P_tgt_inv.clone()
  .multiply(P_src)
  .multiply(q)
  .multiply(B_src_inv)
  .multiply(B_tgt);
```

### C. Centrage Dynamique par rapport au Parent
Afin d'éviter que le modèle ne dérive ou ne soit décalé vers l'origine du monde `(0, 0, 0)` lorsque le personnage se déplace, les coordonnées des hanches sont centrées localement dans le repère du parent :
```typescript
const parent = scene.parent || scene;
const hipsWorld = new THREE.Vector3();
hips.getWorldPosition(hipsWorld);

// Conversion de la position monde des hanches dans le repère local du parent
const hipsLocal = parent.worldToLocal(hipsWorld);

// Ajustement pour aligner les hanches sur l'axe vertical local du parent
scene.position.x -= hipsLocal.x;
scene.position.z -= hipsLocal.z;
```
