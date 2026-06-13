# Pipeline d'Importation, Rigs et Retargeting d'Animation

> [!IMPORTANT]
> **Modèle de Référence de l'Application :**
> Le modèle de référence utilisé et parfaitement fonctionnel dans le projet room3d est `public/media/sandbox/Xbot_official.glb` (issu des exemples officiels de Three.js).
> **Ne pas le confondre avec le modèle X-Bot FBX brut de Mixamo.** Le fichier `Xbot_official.glb` de Three.js sert de modèle de calibration d'échelle et de squelette de référence pour l'application.

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
* **Source** : Three.js Official Examples (`Xbot_official.glb`). **Attention :** Ce modèle ne doit pas être confondu avec l'X-Bot FBX brut directly issu de Mixamo, qui possède des spécificités d'échelle distinctes.
* **Nombre de bones** : 67 joints.
* **Nomenclature** : Mixamo standard avec des deux-points (`:`) comme séparateur (ex: `mixamorig:Hips`, `mixamorig:LeftArm`).
* **Animations** : Embarquées directement à l'intérieur du fichier GLB (Marche, Pose neutre, etc.).
* **Échelle** : Déjà configurée en centimètres (les Hips sont à Y = ~104 cm).

### B. Lara Croft (Modèle Personnalisé)
* **Source** : Modèle Sketchfab converti (`lara_native.glb`).
* **Nombre de bones** : 88 joints (incluant le visage, la queue de cheval, les pistolets, etc.).
* **Nomenclature** : Noms d'os personnalisés utilisant des underscores (`_`) (ex: `mixamorig_root_hips`, `mixamorig_arm_left_shoulder_2`).
* **Structure hiérarchique** : Dispose d'un os parent supplémentaire au niveau du sol nommé `mixamorig_root_ground`, qui sert de point d'attache au sol sous les hanches `mixamorig_root_hips`.
* **Échelle** : Hauteur de repos configurée en centimètres (les Hips sont à Y = ~99 cm).

### C. Différences entre X-Bot FBX (Mixamo) et X-Bot Official (Three.js)

Le fichier FBX d'origine (`sources_backup/X Bot.fbx`) exporté de Mixamo présente des différences structurelles et mathématiques majeures avec le fichier `Xbot_official.glb` utilisé dans Three.js et room3d :

* **Nombre de Bones (Joints)** :
  * **X-Bot FBX (Mixamo)** : Contient **65 os**.
  * **X-Bot Official (Three.js)** : Contient **67 os**. Les yeux (`mixamorig:LeftEye` et `mixamorig:RightEye`) ont été insérés en tant qu'os enfants de la tête (`mixamorig:Head`) dans le modèle Three.js.
* **Orientation Globale de l'Armature (Axes)** :
  * **X-Bot FBX (Mixamo)** : Possède une rotation d'objet armature de `90°` sur l'axe X (`(1.5708, 0, 0)`) pour réorienter le modèle dans l'espace Y-up lors de l'export. Le repère physique interne des coordonnées dans le fichier reste orienté en Y-up (Hips à Y = ~104 cm).
  * **X-Bot Official (Three.js)** : Possède une rotation d'objet armature nulle `(0, 0, 0)`. Toutes les transformations d'axes et orientations globales ont été directement appliquées ("baked") sur la géométrie et les articulations lors du passage au format GLTF.
* **Orientation Locale des Os (Rolls de repos)** :
  * C'est la différence la plus critique pour le calcul d'animations en temps réel.
  * **X-Bot FBX (Mixamo)** : Les os ont des rolls de repos (torsion locale de l'os par rapport à son parent) non nuls pour s'aligner le long des membres selon les spécifications d'origine de Mixamo/FBX (ex: roll de `90°` ou `1.5708 rad` pour les bras et les mains, roll de `180°` ou `3.1416 rad` pour les cuisses).
  * **X-Bot Official (Three.js)** : Tous les rolls locaux des os de repos ont été remis à `0.0 rad (0°)` dans le squelette de calibration. Les axes locaux sont donc parfaitement alignés de façon neutre.
  * **Conséquence directe** : Appliquer les coordonnées de rotation (quaternions) brutes d'une animation FBX externe sur `Xbot_official.glb` sans compenser ces différences de rolls locaux provoque des torsions et des distorsions géométriques extrêmes (membres tordus à 90° ou 180°). C'est pourquoi la formule de retargeting ($resQ$) doit réaligner les quaternions en utilisant la pose de repos.

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

### C. La syntaxe des propriétés (`Hips_position` vs `Hips.position`)
Selon le convertisseur ou l'outil d'export (par exemple, le pont de conversion FBX vers GLTF), les séparateurs standards de Three.js utilisant un point (`.`) sont parfois convertis en underscores (`_`).
* **Format Standard** : `nom_de_l_os.propriete` (ex : `mixamorig:Hips.position`).
* **Format Mixamo Externe Aplatit** : `nom_de_l_os_propriete` (ex : `mixamorig_Hips_position` ou `mixamorig_Hips_quaternion`).
* **Impact** : Cela empêche les découpages classiques basés sur le caractère point (ex : `track.name.split('.')`) de fonctionner, car la propriété et le nom de l'os sont fusionnés dans une seule chaîne de caractères.
* **Solution** : L'algorithme doit être capable d'identifier la propriété via des méthodes plus flexibles (comme `.includes('position')` ou `.includes('_position')`) pour router correctement les pistes de translation et de rotation.

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

---

## 6. Tableau Comparatif des Squelettes : X-Bot Official (67) vs Lara Croft (88)

Ce tableau présente de manière exhaustive toutes les articulations des deux modèles pour identifier précisément les correspondances et les os spécifiques à chaque personnage.

### 1. Origine, Bassin et Hanches

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| — | `mixamorig_root_ground` | Point d'ancrage au sol (Lara) |
| `mixamorig:Hips` | `mixamorig_root_hips` | Hanches / Racine physique |
| — | `mixamorig_pelvis` | Bassin intermédiaire (Lara) |

### 2. Colonne Vertébrale, Cou et Tête

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| `mixamorig:Spine` | `mixamorig_spine_lower` | Bas de la colonne |
| `mixamorig:Spine1` | — | Milieu de la colonne (X-Bot seul) |
| `mixamorig:Spine2` | `mixamorig_spine_upper` | Haut de la colonne / Torse |
| `mixamorig:Neck` | `mixamorig_head_neck_lower` | Cou |
| `mixamorig:Head` | `mixamorig_head_neck_upper` | Tête |
| `mixamorig:HeadTop_End` | — | Sommet de la tête (X-Bot seul) |
| `mixamorig:LeftEye` | `mixamorig_head_eyeball_left` | Œil gauche |
| `mixamorig:RightEye` | `mixamorig_head_eyeball_right` | Œil droit |

### 3. Membres Supérieurs Gauches (Bras et Main)

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| `mixamorig:LeftShoulder` | — | Épaule / Clavicule gauche |
| `mixamorig:LeftArm` | `mixamorig_arm_left_shoulder_2` | Bras gauche (Shoulder/UpperArm) |
| `mixamorig:LeftForeArm` | `mixamorig_arm_left_elbow` | Avant-bras gauche (Elbow) |
| `mixamorig:LeftHand` | `mixamorig_arm_left_wrist` | Poignet / Main gauche |
| — | `mixamorig_weapon_left` | Point d'attache Arme gauche (Lara) |
| `mixamorig:LeftHandThumb1` | `mixamorig_arm_left_finger_1a` | Doigt gauche (Thumb) - Phalange 1 |
| `mixamorig:LeftHandThumb2` | `mixamorig_arm_left_finger_1b` | Doigt gauche (Thumb) - Phalange 2 |
| `mixamorig:LeftHandThumb3` | `mixamorig_arm_left_finger_1c` | Doigt gauche (Thumb) - Phalange 3 |
| `mixamorig:LeftHandThumb4` | — | Doigt gauche (Thumb) - Phalange 4 |
| `mixamorig:LeftHandIndex1` | `mixamorig_arm_left_finger_2a` | Doigt gauche (Index) - Phalange 1 |
| `mixamorig:LeftHandIndex2` | `mixamorig_arm_left_finger_2b` | Doigt gauche (Index) - Phalange 2 |
| `mixamorig:LeftHandIndex3` | `mixamorig_arm_left_finger_2c` | Doigt gauche (Index) - Phalange 3 |
| `mixamorig:LeftHandIndex4` | — | Doigt gauche (Index) - Phalange 4 |
| `mixamorig:LeftHandMiddle1` | `mixamorig_arm_left_finger_3a` | Doigt gauche (Middle) - Phalange 1 |
| `mixamorig:LeftHandMiddle2` | `mixamorig_arm_left_finger_3b` | Doigt gauche (Middle) - Phalange 2 |
| `mixamorig:LeftHandMiddle3` | `mixamorig_arm_left_finger_3c` | Doigt gauche (Middle) - Phalange 3 |
| `mixamorig:LeftHandMiddle4` | — | Doigt gauche (Middle) - Phalange 4 |
| `mixamorig:LeftHandRing1` | `mixamorig_arm_left_finger_4a` | Doigt gauche (Ring) - Phalange 1 |
| `mixamorig:LeftHandRing2` | `mixamorig_arm_left_finger_4b` | Doigt gauche (Ring) - Phalange 2 |
| `mixamorig:LeftHandRing3` | `mixamorig_arm_left_finger_4c` | Doigt gauche (Ring) - Phalange 3 |
| `mixamorig:LeftHandRing4` | — | Doigt gauche (Ring) - Phalange 4 |
| `mixamorig:LeftHandPinky1` | `mixamorig_arm_left_finger_5a` | Doigt gauche (Pinky) - Phalange 1 |
| `mixamorig:LeftHandPinky2` | `mixamorig_arm_left_finger_5b` | Doigt gauche (Pinky) - Phalange 2 |
| `mixamorig:LeftHandPinky3` | `mixamorig_arm_left_finger_5c` | Doigt gauche (Pinky) - Phalange 3 |
| `mixamorig:LeftHandPinky4` | — | Doigt gauche (Pinky) - Phalange 4 |

### 4. Membres Supérieurs Droits (Bras et Main)

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| `mixamorig:RightShoulder` | — | Épaule / Clavicule droite |
| `mixamorig:RightArm` | `mixamorig_arm_right_shoulder_2` | Bras droit (Shoulder/UpperArm) |
| `mixamorig:RightForeArm` | `mixamorig_arm_right_elbow` | Avant-bras droit (Elbow) |
| `mixamorig:RightHand` | `mixamorig_arm_right_wrist` | Poignet / Main droite |
| — | `mixamorig_weapon_right` | Point d'attache Arme droite (Lara) |
| `mixamorig:RightHandThumb1` | `mixamorig_arm_right_finger_1a` | Doigt droit (Thumb) - Phalange 1 |
| `mixamorig:RightHandThumb2` | `mixamorig_arm_right_finger_1b` | Doigt droit (Thumb) - Phalange 2 |
| `mixamorig:RightHandThumb3` | `mixamorig_arm_right_finger_1c` | Doigt droit (Thumb) - Phalange 3 |
| `mixamorig:RightHandThumb4` | — | Doigt droit (Thumb) - Phalange 4 |
| `mixamorig:RightHandIndex1` | `mixamorig_arm_right_finger_2a` | Doigt droit (Index) - Phalange 1 |
| `mixamorig:RightHandIndex2` | `mixamorig_arm_right_finger_2b` | Doigt droit (Index) - Phalange 2 |
| `mixamorig:RightHandIndex3` | `mixamorig_arm_right_finger_2c` | Doigt droit (Index) - Phalange 3 |
| `mixamorig:RightHandIndex4` | — | Doigt droit (Index) - Phalange 4 |
| `mixamorig:RightHandMiddle1` | `mixamorig_arm_right_finger_3a` | Doigt droit (Middle) - Phalange 1 |
| `mixamorig:RightHandMiddle2` | `mixamorig_arm_right_finger_3b` | Doigt droit (Middle) - Phalange 2 |
| `mixamorig:RightHandMiddle3` | `mixamorig_arm_right_finger_3c` | Doigt droit (Middle) - Phalange 3 |
| `mixamorig:RightHandMiddle4` | — | Doigt droit (Middle) - Phalange 4 |
| `mixamorig:RightHandRing1` | `mixamorig_arm_right_finger_4a` | Doigt droit (Ring) - Phalange 1 |
| `mixamorig:RightHandRing2` | `mixamorig_arm_right_finger_4b` | Doigt droit (Ring) - Phalange 2 |
| `mixamorig:RightHandRing3` | `mixamorig_arm_right_finger_4c` | Doigt droit (Ring) - Phalange 3 |
| `mixamorig:RightHandRing4` | — | Doigt droit (Ring) - Phalange 4 |
| `mixamorig:RightHandPinky1` | `mixamorig_arm_right_finger_5a` | Doigt droit (Pinky) - Phalange 1 |
| `mixamorig:RightHandPinky2` | `mixamorig_arm_right_finger_5b` | Doigt droit (Pinky) - Phalange 2 |
| `mixamorig:RightHandPinky3` | `mixamorig_arm_right_finger_5c` | Doigt droit (Pinky) - Phalange 3 |
| `mixamorig:RightHandPinky4` | — | Doigt droit (Pinky) - Phalange 4 |

### 5. Membres Inférieurs Gauches (Jambe et Pied)

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| `mixamorig:LeftUpLeg` | `mixamorig_leg_left_thigh` | Cuisse gauche |
| `mixamorig:LeftLeg` | `mixamorig_leg_left_knee` | Genou gauche |
| `mixamorig:LeftFoot` | `mixamorig_leg_left_ankle` | Cheville gauche |
| `mixamorig:LeftToeBase` | `mixamorig_leg_left_toes` | Orteils gauches |
| `mixamorig:LeftToe_End` | — | Bout des orteils gauches |

### 6. Membres Inférieurs Droits (Jambe et Pied)

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| `mixamorig:RightUpLeg` | `mixamorig_leg_right_thigh` | Cuisse droite |
| `mixamorig:RightLeg` | `mixamorig_leg_right_knee` | Genou droit |
| `mixamorig:RightFoot` | `mixamorig_leg_right_ankle` | Cheville droite |
| `mixamorig:RightToeBase` | `mixamorig_leg_right_toes` | Orteils droits |
| `mixamorig:RightToe_End` | — | Bout des orteils droits |

### 7. Lara Croft - Cheveux et Accessoires

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| — | `mixamorig_glasses` | Lunettes de Lara |
| — | `mixamorig_head_hair_ponytail_1` | Queue de cheval - Segment 1 |
| — | `mixamorig_head_hair_ponytail_2` | Queue de cheval - Segment 2 |
| — | `mixamorig_head_hair_ponytail_3` | Queue de cheval - Segment 3 |
| — | `mixamorig_head_hair_ponytail_4` | Queue de cheval - Segment 4 |
| — | `mixamorig_head_hair_ponytail_5` | Queue de cheval - Segment 5 |
| — | `mixamorig_head_hair_ponytail_6` | Queue de cheval - Segment 6 |

### 8. Lara Croft - Squelette Facial (Visage)

| Articulation X-Bot Official (`Xbot_official.glb`) | Articulation Lara Croft (`lara_native.glb`) | Description / Rôle anatomique |
| :--- | :--- | :--- |
| — | `mixamorig_head_jaw` | Mâchoire |
| — | `mixamorig_head_tongue` | Langue |
| — | `mixamorig_head_cheek_left` | Joue gauche |
| — | `mixamorig_head_cheek_right` | Joue droite |
| — | `mixamorig_head_nostril_left` | Narine gauche |
| — | `mixamorig_head_nostril_right` | Narine droite |
| — | `mixamorig_head_eyebrow_left_1` | Sourcil gauche - Interne |
| — | `mixamorig_head_eyebrow_left_2` | Sourcil gauche - Milieu |
| — | `mixamorig_head_eyebrow_left_3` | Sourcil gauche - Externe |
| — | `mixamorig_head_eyebrow_right_1` | Sourcil droit - Interne |
| — | `mixamorig_head_eyebrow_right_2` | Sourcil droit - Milieu |
| — | `mixamorig_head_eyebrow_right_3` | Sourcil droit - Externe |
| — | `mixamorig_head_eyelid_left_upper` | Paupière supérieure gauche |
| — | `mixamorig_head_eyelid_left_lower` | Paupière inférieure gauche |
| — | `mixamorig_head_eyelid_right_upper` | Paupière supérieure droite |
| — | `mixamorig_head_eyelid_right_lower` | Paupière inférieure droite |
| — | `mixamorig_head_lip_upper_middle` | Lèvre supérieure - Milieu |
| — | `mixamorig_head_lip_upper_left_1` | Lèvre supérieure - Gauche interne |
| — | `mixamorig_head_lip_upper_left_2` | Lèvre supérieure - Gauche externe |
| — | `mixamorig_head_lip_upper_right_1` | Lèvre supérieure - Droite interne |
| — | `mixamorig_head_lip_upper_right_2` | Lèvre supérieure - Droite externe |
| — | `mixamorig_head_lip_lower_middle` | Lèvre inférieure - Milieu |
| — | `mixamorig_head_lip_lower_left_1` | Lèvre inférieure - Gauche interne |
| — | `mixamorig_head_lip_lower_left_2` | Lèvre inférieure - Gauche externe |
| — | `mixamorig_head_lip_lower_right_1` | Lèvre inférieure - Droite interne |
| — | `mixamorig_head_lip_lower_right_2` | Lèvre inférieure - Droite externe |
