# Rapport d'Analyse Structurelle — Lara Croft

Ce rapport présente une analyse comparative de la structure (squelettes, os et meshes) des 16 variations du modèle de Lara Croft présentes dans le projet. Il propose également un plan d'architecture technique pour implémenter un système de changement dynamique de vêtements sur un modèle unique à partir des composants des autres modèles.

---

## 1. Synthèse de l'Analyse des Squelettes (Rig Groups)

Bien que tous les modèles proviennent du même créateur d'origine, ils sont structurés avec **10 configurations de squelettes (Rigs) distinctes**. Ces configurations diffèrent par le nombre d'os et les conventions de nommage.

### Catégorisation des Rigs

| Groupe de Rig | Modèles Associés | Nb d'Os | Caractéristiques des Noms d'Os | Exemples d'Os |
| :--- | :--- | :--- | :--- | :--- |
| **Groupe 1** | `lara_croft_324_rigged` | 89 | Suffixe numérique `_03` ou similaire | `_rootJoint`, `pelvis_03`, `arm left elbow_051` |
| **Groupe 2** | `lara_croft_4543`, `lara_croft_43254_rigged`, `lara_croft_motorcycle_gear`, `lara_croft_spy_gear`, `lara_croft_suit` | 98 | Suffixe numérique élevé (`_085`) | `_rootJoint`, `pelvis_085`, `arm left elbow_089` |
| **Groupe 3** | `lara_croft_brown_jacket`, `lara_croft_swim_gear`, `lara_croft_swim_gear_1` | 92 | Suffixe numérique bas (`_03`) | `_rootJoint`, `pelvis_03`, `arm left elbow_051` |
| **Groupe 4** | `lara_croft_dress_345` | 87 | Suffixe numérique intermédiaire | `_rootJoint`, `pelvis_076` |
| **Groupe 5** | `lara_croft_red_dress` | 136 | Squelette complexe (nombreux os pour la robe) | `_rootJoint`, `pelvis_087`, `acc_skirt back left 1a_0102` |
| **Groupe 6** | `lara_croft_swim_gear_243` | 93 | Squelette avec accessoires spécifiques | `_rootJoint`, `pelvis_03`, `arm left elbow_051` |
| **Groupe 7** | `lara_croft_black_tank_top`, `lara_croft_4259`, `lara_croft_3254_rigged` (Lara 3254 Rigged), `lara_croft_gold_shades` (Gold Shades) | 88-97 | Noms d'os propres sans suffixes numériques | `pelvis`, `arm left elbow`, `root hips` |
| **Groupe 8** | `lara_officiel` (Modèle natif) | 88 | Préfixe `mixamorig_` (Format standard Mixamo) | `mixamorig_pelvis`, `mixamorig_arm_left_elbow` |
| **Groupe 9** | `lara_croft_zip` | 91 | Noms d'os propres sans suffixes (variante du G7) | `pelvis`, `arm left elbow`, `root hips` |
| **Groupe 10** | `lara_croft_543i` (Lara 543i) | 63 | Squelette simplifié, noms tout en MAJUSCULES | `Root`, `HIP`, `NECK`, `HEAD`, `SHLDER_L` |

### Les Différences de Nommage Majeures

1. **Les suffixes numériques** : La majorité des rigs possèdent des suffixes d'indexation (ex: `pelvis_03`, `pelvis_085`, `pelvis_087`). Ces indexations empêchent une liaison directe d'une mesh sur un autre squelette, car les noms d'os cibles ne correspondent pas.
2. **Le squelette de la Robe Rouge** (`lara_croft_red_dress`) : Il possède **136 os** au total. Les os supplémentaires (près de 40) sont dédiés à l'animation de la jupe/robe (`acc_skirt ...`).
3. **Le cas standardisé Mixamo** (`lara_officiel`) : C'est le seul modèle basé sur une convention standard Mixamo avec le préfixe `mixamorig_` (ex: `mixamorig_pelvis`).
4. **Les rigs simplifiés** (ex: `black_tank_top`) : Ils possèdent 91 os nommés de manière propre et descriptive (ex: `pelvis`), ce qui constitue la base la plus saine pour le nettoyage des noms.
5. **Divergences de Lara Officiel par rapport au Standard Mixamo** : Bien que le modèle `lara_officiel` utilise le préfixe `mixamorig_`, il lui manque **3 os corporels standards** présents dans les squelettes Mixamo classiques :
   * **`Spine1`** (L'os intermédiaire de la colonne) : La colonne de Lara Officiel ne possède que 2 os (`spine_lower` et `spine_upper`) au lieu de 3.
   * **`LeftShoulder` et `RightShoulder`** (Les clavicules gauche et droite) : Les os du haut des bras (`arm_left_shoulder_2` et `arm_right_shoulder_2`) sont connectés directement au thorax (`spine_upper`) sans articulation de clavicule intermédiaire.

---

## 2. Analyse des Meshes et Vêtements

Les modèles ont été construits selon deux approches d'organisation géométrique dans le fichier GLTF :

1. **Modèles Multi-Meshes** (ex: `lara_croft_324_rigged`, `lara_croft_red_dress`) :
   - Chaque partie (lunettes, sac à dos, veste, corps, cheveux) est un noeud `SkinnedMesh` indépendant dans la hiérarchie.
   - Ces parties peuvent être masquées ou affichées individuellement très facilement via leur propriété `.visible`.
2. **Modèles Mono-Mesh avec Multi-Primitives** (ex: `lara_croft_black_tank_top`, `lara_croft_zip`) :
   - Le modèle contient un unique noeud `SkinnedMesh` racine (ex: `5_+Gear|Camera.CameraPC_1.0_0_0.002`).
   - Cependant, cet unique noeud contient une multitude de **primitives géométriques** (jusqu'à 29) associées à des matériaux distincts (haut, pantalon, bottes, visage).
   - Lors de l'importation par Three.js `GLTFLoader`, ces primitives sont automatiquement éclatées en sous-objets `SkinnedMesh` distincts, ce qui permet de les manipuler individuellement au runtime.

---

## 3. Plan d'Architecture pour le Changement de Vêtements

### Le Défi Technique
Si on prend la veste (`SkinnedMesh`) de `Brown Jacket` et qu'on l'ajoute au squelette de `Lara Red Dress`, la veste restera statique ou se déformera de manière aberrante. Pourquoi ?
- Les indices d'os stockés dans les sommets de la géométrie de la veste font référence à la liste d'os d'origine de `Brown Jacket` (dont l'ordre et le nombre diffèrent de `Red Dress`).
- La veste possède des matrices de pose de repos (`inverseBindMatrices`) calculées par rapport aux os d'origine.
- Les noms d'os d'origine (`pelvis_03`) ne correspondent pas aux os cibles (`pelvis_087`).

### La Solution : Le Re-skeletoning Dynamique (Rebinding)
Pour transférer proprement un vêtement d'une Lara source vers une Lara cible (hôte), il faut réassocier dynamiquement les articulations de la mesh transférée aux os correspondants de la Lara hôte, tout en conservant les matrices de pose de repos d'origine.

#### Algorithme de Rebinding (Étape par Étape)
1. **Normalisation des Noms d'Os** :
   Créer une fonction utilitaire pour nettoyer les noms d'os afin d'extraire leur identifiant logique universel :
   - Supprimer les suffixes d'indexation (ex: `_03`, `_085` -> vide).
   - Supprimer le préfixe Mixamo (ex: `mixamorig_` -> vide).
   - Remplacer les tirets ou formats camelCase pour obtenir des noms standardisés (ex: `arm_left_elbow` et `arm left elbow` deviennent identiques).

2. **Cartographie des Squelettes** :
   Pour chaque os dans le squelette de la mesh source (vêtement) :
   - Trouver l'os équivalent dans le squelette cible (Lara hôte) en comparant leurs identifiants logiques nettoyés.
   - Si l'os cible est trouvé, on l'ajoute à une nouvelle liste de joints.
   - Si l'os n'existe pas (ex: os de jupe spécifique lors du passage à un pantalon), on utilise un os parent logique (ex: `spine` ou `pelvis`) ou un os factice.

3. **Création du Squelette de Substitution** :
   Instancier un nouveau squelette `THREE.Skeleton` en combinant :
   - La nouvelle liste d'os (provenant de la Lara hôte, ordonnée de la même manière que le squelette d'origine du vêtement).
   - Les matrices d'inversion d'origine (`boneInverses`) de la mesh source. *Conserver ces matrices d'origine est crucial pour éviter les déformations géométriques de repos !*

4. **Liaison (Bind)** :
   Appeler `mesh.bind(newSkeleton)` sur le vêtement pour l'associer au nouveau squelette.

5. **Intégration Graphique** :
   Ajouter la mesh comme enfant du groupe de la Lara hôte.

---

### Pseudo-code d'Implémentation du Rebinding

```typescript
// Fonction de nettoyage pour obtenir le nom d'os logique
function getLogicalBoneName(name: string): string {
  let clean = name.toLowerCase();
  
  // Supprimer le préfixe mixamo
  clean = clean.replace(/^mixamorig[_-]/, '');
  
  // Supprimer les suffixes numériques (ex: _085, _03, _01)
  clean = clean.replace(/[_-]\d+$/, '');
  
  // Remplacer les underscores par des espaces pour uniformisation
  clean = clean.replace(/_/g, ' ').trim();
  
  return clean;
}

// Fonction principale de transfert de vêtement
function transplantSkinnedMesh(sourceMesh: THREE.SkinnedMesh, targetLara: THREE.Group) {
  // 1. Trouver toutes les articulations de la Lara cible
  const targetBones: THREE.Bone[] = [];
  targetLara.traverse((node) => {
    if ((node as THREE.Bone).isBone) {
      targetBones.push(node as THREE.Bone);
    }
  });

  // 2. Associer chaque os du squelette source à un os équivalent de la cible
  const sourceBones = sourceMesh.skeleton.bones;
  const remappedBones: THREE.Bone[] = [];
  
  for (let i = 0; i < sourceBones.length; i++) {
    const srcBoneName = sourceBones[i].name;
    const logicalSrcName = getLogicalBoneName(srcBoneName);
    
    // Trouver l'os cible correspondant
    const matchingTargetBone = targetBones.find(
      (b) => getLogicalBoneName(b.name) === logicalSrcName
    );
    
    if (matchingTargetBone) {
      remappedBones.push(matchingTargetBone);
    } else {
      console.warn(`Aucun os cible trouvé pour ${srcBoneName} (${logicalSrcName}). Repli sur le parent.`);
      // Repli sur le parent s'il existe dans la cible, sinon pelvis/root
      let fallback = targetBones.find(b => getLogicalBoneName(b.name) === 'pelvis') || targetBones[0];
      remappedBones.push(fallback);
    }
  }

  // 3. Cloner la mesh pour éviter de modifier l'originale
  const clonedMesh = sourceMesh.clone();
  
  // 4. Créer le nouveau squelette avec les os mappés de la cible et les inverses d'origine du vêtement
  const newSkeleton = new THREE.Skeleton(remappedBones, sourceMesh.skeleton.boneInverses);
  
  // 5. Lier la mesh clonée au squelette réordonné
  clonedMesh.bind(newSkeleton);
  
  // 6. Ajouter le vêtement transplanté au groupe hôte
  targetLara.add(clonedMesh);
  
  return clonedMesh;
}
```

---

## 4. Conclusion du Plan

Pour réaliser l'objectif final de changement de vêtements sur une seule Lara :
1. **Sélectionner une base** (ex: `Lara Officiel` ou `Red Dress` comme base de squelette actif animable).
2. **Charger les autres modèles en arrière-plan** (sans les afficher) pour extraire leurs composants (`SkinnedMesh`).
3. **Appliquer la fonction de Rebinding** ci-dessus lors du clic sur un vêtement dans l'interface utilisateur.
4. **Gérer les conflits de visibilité** (ex: masquer le pantalon d'origine de la Lara hôte lorsqu'on lui greffe une robe) en modifiant simplement la propriété `.visible = false` des sous-meshes correspondants.


---

# Rapport d'Analyse Structurelle & Process de Standardisation — Lara Croft

Ce rapport décrit le process de standardisation des fichiers 3D sources (dans Blender) pour obtenir des fichiers GLB propres et homogènes. L'objectif est de pouvoir changer de vêtement à la volée dans Three.js de manière native et sans code de retargeting dynamique complexe en JS.

---

## 1. Le Problème Source dans Blender

Actuellement, les 16 variations de Lara souffrent de divergences structurelles qui empêchent le partage direct de vêtements :
1. **Indexation des os** : Les noms d'os comportent des suffixes comme `_03`, `_085` ou `_087` générés lors d'imports/exports successifs.
2. **Conventions nommées différentes** : Le modèle natif utilise le format Mixamo (`mixamorig_pelvis`), tandis que d'autres utilisent des formats simples (`pelvis`).
3. **Poses de repos différentes (Bind Poses)** : Si les bras ou jambes n'ont pas exactement les mêmes angles en pose de repos (T-Pose), la maille se déforme lors du transfert.

---

## 2. Le Process de Standardisation dans Blender (Étape par Étape)

Pour obtenir des fichiers propres, le travail doit être réalisé en amont dans Blender en suivant ce protocole strict :

### Étape 1 : Définir l'Armature de Référence (Master Rig)
Le squelette de référence choisi pour standardiser tous les modèles est :
* **Choix Technique** : La structure de **Lara Officiel (88 os)**, sans les préfixes `mixamorig_`, mais étendue à **91 os** pour intégrer les clavicules et la troisième vertèbre de la colonne vertébrale manquantes dans le modèle d'origine.
  * Pour cela, nous renommons `spine_lower` par `spine_1` et `spine_upper` par `spine_2` et `spine_3` (pour avoir les 3 segments de colonne vertébrale), et nous ajoutons les clavicules `arm_left_shoulder_1` et `arm_right_shoulder_1`.
* **Justification du Naming** : Nous conservons délibérément les conventions de nommage de Lara Officiel (sans préfixe) plutôt que les noms standard de Mixamo. En effet, la nomenclature officielle fait référence aux **articulations** précises plutôt qu'aux membres généraux, ce qui est plus explicite et clair (ex: `leg_right_ankle` au lieu de `RightFoot` ou `leg_left_thigh` au lieu de `LeftUpLeg`).
* Ce squelette de référence doit être placé en pose de repos par défaut (T-Pose) avec toutes les transformations appliquées (`Ctrl + A` -> `All Transforms`).

#### Table de Correspondance : Mixamo Standard vs Master Rig (Standardisé à 91 os)

Le tableau suivant présente la correspondance entre les os du squelette standard de Mixamo (utilisé par les fichiers d'animation `.glb` externes) et les os du Master Rig standardisé à 91 os :

| Os Standard Mixamo | Correspondance Master Rig (Standardisé à 91 os) | Type d'os / Note |
| :--- | :--- | :--- |
| `Hips` | `root_hips` | Articulation du bassin |
| `Spine` | `spine_1` | Colonne vertébrale (bas) [Renommé de `spine_lower`] |
| `Spine1` (ou `Spine3` manquant) | `spine_2` | Colonne vertébrale (milieu) [Séparé/Ajouté de `spine_upper`] |
| `Spine2` | `spine_3` | Colonne vertébrale (haut) [Séparé/Ajouté de `spine_upper`] |
| `Neck` | `head_neck_lower` | Cou (bas) |
| `Head` | `head_neck_upper` | Tête (haut du cou) |
| `LeftShoulder` | `arm_left_shoulder_1` | Clavicule gauche [Ajouté] |
| `LeftArm` | `arm_left_shoulder_2` | Épaule / Haut du bras gauche |
| `LeftForeArm` | `arm_left_elbow` | Coude / Avant-bras gauche |
| `LeftHand` | `arm_left_wrist` | Poignet / Main gauche |
| `LeftUpLeg` | `leg_left_thigh` | Cuisse gauche |
| `LeftLeg` | `leg_left_knee` | Genou / Mollet gauche |
| `LeftFoot` | `leg_left_ankle` | Cheville / Pied gauche |
| `LeftToeBase` | `leg_left_toes` | Orteils gauche |
| `RightShoulder` | `arm_right_shoulder_1` | Clavicule droite [Ajouté] |
| `RightArm` | `arm_right_shoulder_2` | Épaule / Haut du bras droit |
| `RightForeArm` | `arm_right_elbow` | Coude / Avant-bras droit |
| `RightHand` | `arm_right_wrist` | Poignet / Main droite |
| `RightUpLeg` | `leg_right_thigh` | Cuisse droite |
| `RightLeg` | `leg_right_knee` | Genou / Mollet droit |
| `RightFoot` | `leg_right_ankle` | Cheville / Pied droit |
| `RightToeBase` | `leg_right_toes` | Orteils droit |

#### Liste Complète des 91 Os du Master Rig (Standardisé)

| N° | Nom de l'Os | Description / Localisation |
| :--- | :--- | :--- |
| 1 | `arm_left_elbow` | Coude / Avant-bras (gauche) |
| 2 | `arm_left_finger_1a` | Main gauche : pouce (phalange proximale) |
| 3 | `arm_left_finger_1b` | Main gauche : pouce (phalange moyenne) |
| 4 | `arm_left_finger_1c` | Main gauche : pouce (phalange distale) |
| 5 | `arm_left_finger_2a` | Main gauche : index (phalange proximale) |
| 6 | `arm_left_finger_2b` | Main gauche : index (phalange moyenne) |
| 7 | `arm_left_finger_2c` | Main gauche : index (phalange distale) |
| 8 | `arm_left_finger_3a` | Main gauche : majeur (phalange proximale) |
| 9 | `arm_left_finger_3b` | Main gauche : majeur (phalange moyenne) |
| 10 | `arm_left_finger_3c` | Main gauche : majeur (phalange distale) |
| 11 | `arm_left_finger_4a` | Main gauche : annulaire (phalange proximale) |
| 12 | `arm_left_finger_4b` | Main gauche : annulaire (phalange moyenne) |
| 13 | `arm_left_finger_4c` | Main gauche : annulaire (phalange distale) |
| 14 | `arm_left_finger_5a` | Main gauche : auriculaire (phalange proximale) |
| 15 | `arm_left_finger_5b` | Main gauche : auriculaire (phalange moyenne) |
| 16 | `arm_left_finger_5c` | Main gauche : auriculaire (phalange distale) |
| 17 | `arm_left_shoulder_1` | Épaule : Clavicule (gauche) [Ajouté] |
| 18 | `arm_left_shoulder_2` | Épaule : Bras / Humérus (gauche) |
| 19 | `arm_left_wrist` | Poignet / Main (gauche) |
| 20 | `arm_right_elbow` | Coude / Avant-bras (droite) |
| 21 | `arm_right_finger_1a` | Main droite : pouce (phalange proximale) |
| 22 | `arm_right_finger_1b` | Main droite : pouce (phalange moyenne) |
| 23 | `arm_right_finger_1c` | Main droite : pouce (phalange distale) |
| 24 | `arm_right_finger_2a` | Main droite : index (phalange proximale) |
| 25 | `arm_right_finger_2b` | Main droite : index (phalange moyenne) |
| 26 | `arm_right_finger_2c` | Main droite : index (phalange distale) |
| 27 | `arm_right_finger_3a` | Main droite : majeur (phalange proximale) |
| 28 | `arm_right_finger_3b` | Main droite : majeur (phalange moyenne) |
| 29 | `arm_right_finger_3c` | Main droite : majeur (phalange distale) |
| 30 | `arm_right_finger_4a` | Main droite : annulaire (phalange proximale) |
| 31 | `arm_right_finger_4b` | Main droite : annulaire (phalange moyenne) |
| 32 | `arm_right_finger_4c` | Main droite : annulaire (phalange distale) |
| 33 | `arm_right_finger_5a` | Main droite : auriculaire (phalange proximale) |
| 34 | `arm_right_finger_5b` | Main droite : auriculaire (phalange moyenne) |
| 35 | `arm_right_finger_5c` | Main droite : auriculaire (phalange distale) |
| 36 | `arm_right_shoulder_1` | Épaule : Clavicule (droite) [Ajouté] |
| 37 | `arm_right_shoulder_2` | Épaule : Bras / Humérus (droite) |
| 38 | `arm_right_wrist` | Poignet / Main (droite) |
| 39 | `glasses` | Accessoire : Lunettes |
| 40 | `head_cheek_left` | Articulation corporelle standard |
| 41 | `head_cheek_right` | Articulation corporelle standard |
| 42 | `head_eyeball_left` | Visage : Globe oculaire (gauche) |
| 43 | `head_eyeball_right` | Visage : Globe oculaire (droit) |
| 44 | `head_eyebrow_left_1` | Visage : Sourcil (gauche) |
| 45 | `head_eyebrow_left_2` | Visage : Sourcil (gauche) |
| 46 | `head_eyebrow_left_3` | Visage : Sourcil (gauche) |
| 47 | `head_eyebrow_right_1` | Visage : Sourcil (droit) |
| 48 | `head_eyebrow_right_2` | Visage : Sourcil (droit) |
| 49 | `head_eyebrow_right_3` | Visage : Sourcil (droit) |
| 50 | `head_eyelid_left_lower` | Visage : Paupière (gauche) |
| 51 | `head_eyelid_left_upper` | Visage : Paupière (gauche) |
| 52 | `head_eyelid_right_lower` | Visage : Paupière (droit) |
| 53 | `head_eyelid_right_upper` | Visage : Paupière (droit) |
| 54 | `head_hair_ponytail_1` | Cheveux : Queue de cheval (segment animable) |
| 55 | `head_hair_ponytail_2` | Cheveux : Queue de cheval (segment animable) |
| 56 | `head_hair_ponytail_3` | Cheveux : Queue de cheval (segment animable) |
| 57 | `head_hair_ponytail_4` | Cheveux : Queue de cheval (segment animable) |
| 58 | `head_hair_ponytail_5` | Cheveux : Queue de cheval (segment animable) |
| 59 | `head_hair_ponytail_6` | Cheveux : Queue de cheval (segment animable) |
| 60 | `head_jaw` | Articulation corporelle standard |
| 61 | `head_lip_lower_left_1` | Visage : Lèvre (inférieure) |
| 62 | `head_lip_lower_left_2` | Visage : Lèvre (inférieure) |
| 63 | `head_lip_lower_middle` | Visage : Lèvre (inférieure) |
| 64 | `head_lip_lower_right_1` | Visage : Lèvre (inférieure) |
| 65 | `head_lip_lower_right_2` | Visage : Lèvre (inférieure) |
| 66 | `head_lip_upper_left_1` | Visage : Lèvre (supérieure) |
| 67 | `head_lip_upper_left_2` | Visage : Lèvre (supérieure) |
| 68 | `head_lip_upper_middle` | Visage : Lèvre (supérieure) |
| 69 | `head_lip_upper_right_1` | Visage : Lèvre (supérieure) |
| 70 | `head_lip_upper_right_2` | Visage : Lèvre (supérieure) |
| 71 | `head_neck_lower` | Cou (bas) |
| 72 | `head_neck_upper` | Cou (haut) |
| 73 | `head_nostril_left` | Articulation corporelle standard |
| 74 | `head_nostril_right` | Articulation corporelle standard |
| 75 | `head_tongue` | Articulation corporelle standard |
| 76 | `leg_left_ankle` | Cheville / Pied (gauche) |
| 77 | `leg_left_knee` | Genou / Mollet (gauche) |
| 78 | `leg_left_thigh` | Hanche / Cuisse (gauche) |
| 79 | `leg_left_toes` | Orteils (gauche) |
| 80 | `leg_right_ankle` | Cheville / Pied (droite) |
| 81 | `leg_right_knee` | Genou / Mollet (droite) |
| 82 | `leg_right_thigh` | Hanche / Cuisse (droite) |
| 83 | `leg_right_toes` | Orteils (droite) |
| 84 | `pelvis` | Bassin (centre de gravité) |
| 85 | `root_ground` | Racine au sol |
| 86 | `root_hips` | Hanche racine |
| 87 | `spine_1` | Colonne vertébrale (segment 1) |
| 88 | `spine_2` | Colonne vertébrale (segment 2) |
| 89 | `spine_3` | Colonne vertébrale (segment 3) |
| 90 | `weapon_left` | Point d'attache d'arme (gauche) |
| 91 | `weapon_right` | Point d'attache d'arme (droite) |

### Étape 2 : Créer le "Super-Rig" (Union des Os)
Certains vêtements nécessitent des os supplémentaires (comme les os de la jupe de la Robe Rouge ou des accessoires de ceinture).
* **Action** : Ajoutez ces os optionnels (ex: `acc_skirt ...`) directement dans le **Master Rig** de référence. Un squelette avec des os inutilisés ne pose aucun problème de performance dans Three.js, mais permet à la même armature de supporter n'importe quel vêtement.

### Étape 3 : Nettoyage et Alignement des Modèles Sources
Pour chaque modèle de Lara (ex: Red Dress, Brown Jacket, etc.) :
1. **Nettoyage des Noms d'Os** : Renommez tous les os de son armature d'origine pour correspondre exactement aux noms du **Master Rig** (supprimez les suffixes `_03`, `_085`, etc.).
2. **Alignement des Poses de Repos** :
   - Mettez l'armature du modèle en position de repos identique au Master Rig.
   - Si les mailles (meshes) ne s'alignent pas parfaitement, utilisez l'outil de transfert de pose de Blender pour adapter la pose de repos.
3. **Remplacement de l'Armature** :
   - Associez les meshes (vêtements) à l'Armature de Référence (**Master Rig**).
   - Dans Blender, cela se fait en modifiant le modificateur *Armature* de chaque mesh pour cibler le Master Rig au lieu de l'ancien squelette.

---

## 3. Stratégies d'Exportation et Intégration dans Three.js

Une fois les modèles standardisés sur le même Master Rig dans Blender, deux approches d'exportation sont possibles :

### Approche A : L'Export Unique (Recommandé pour la simplicité)
Vous regroupez tous les vêtements (toutes les mailles) sur le même squelette dans un unique fichier Blender, puis vous exportez un seul fichier GLB contenant l'intégralité des tenues.
* **Dans Blender** : Toutes les meshes de vêtements (veste, robe, short) sont des objets enfants du même squelette Master Rig.
* **Dans Three.js** : Le chargement est ultra simple. Pour changer de vêtement, il suffit de manipuler la visibilité des mailles :
  ```javascript
  // Pour habiller Lara en veste marron et masquer sa robe rouge
  model.traverse((node) => {
    if (node.isSkinnedMesh) {
      if (node.name.includes("Dress")) {
        node.visible = false;
      }
      if (node.name.includes("BrownJacket")) {
        node.visible = true;
      }
    }
  });
  ```

### Approche B : L'Export Modulaire (Fichiers GLB séparés)
Si le fichier unique est trop lourd, vous pouvez exporter le corps de base (avec le Master Rig) dans un GLB, et chaque tenue dans son propre GLB (riggée sur le même Master Rig).
* **Dans Blender** : Vous exportez chaque tenue séparément avec son armature Master Rig associée.
* **Dans Three.js** :
  1. Vous chargez le corps de base (qui contient le squelette actif et les animations).
  2. Vous chargez le fichier GLB du vêtement choisi en arrière-plan.
  3. Vous clonez le `SkinnedMesh` du vêtement.
  4. Vous le liez directement au squelette du corps de base sans aucune logique complexe de remappage car les squelettes sont identiques :
     ```javascript
     // Liaison directe native dans Three.js
     vêtementMesh.bind(corpsDeBase.skinnedMesh.skeleton);
     corpsDeBase.add(vêtementMesh);
     ```

---

## 4. Avantages de ce Process
* **Zéro code JS personnalisé** : Pas besoin de scripts de retargeting ou de modification des matrices au runtime. Le moteur de rendu de Three.js gère la déformation de manière fluide et native.
* **Compatibilité parfaite des Animations** : N'importe quelle animation appliquée sur l'armature principale animera parfaitement et instantanément tous les vêtements équipés.
* **Fichiers plus légers** : Permet d'éviter de dupliquer les géométries de corps sous les vêtements ou de charger des données inutiles.


---


## 5. Nouveau Modèle Ajouté : Lara 543i (FBX converti en GLB)

Un nouveau modèle provenant du fichier `lara-croft-543i.zip` a été extrait et converti :
* **ID** : `lara_croft_543i`
* **Fichier GLB produit** : `public/media/all_lara/lara_croft_543i.glb`
* **Analyse du Rig (Groupe de Rig 10)** :
  * **Nombre d'os** : 63 (Squelette le plus léger et simplifié de tous les modèles).
  * **Convention de nommage** : Tout en **MAJUSCULES** (ex: `Root`, `HIP`, `NECK`, `HEAD`, `SHLDER_L`, `FORARM_L`, `PONY1_DYNAMIC`).
* **Analyse des Meshes** :
  * 1 seul `SkinnedMesh` d'origine (`40_lara.material01_1_0_0`) qui se divise en **12 primitives géométriques** distinctes au chargement par Three.js.
* **Process de Standardisation pour 543i** :
  * En raison de son squelette en MAJUSCULES de 63 os, l'animation directe ou le partage de vêtement nécessite de renommer les os dans Blender (ex: `SHLDER_L` -> `arm left shoulder`) et d'appliquer la T-pose du squelette de référence avant l'exportation.



## 6. Nouveau Modèle Ajouté : Lara 3254 Rigged

Un nouveau modèle provenant du fichier `lara-croft-3254-rigged.zip` a été extrait et converti :
* **ID** : `lara_croft_3254_rigged`
* **Fichier GLB produit** : `public/media/all_lara/lara_croft_3254_rigged.glb`
* **Analyse du Rig (Groupe de Rig 7)** :
  * **Nombre d'os** : 97.
  * **Convention de nommage** : Noms propres sans suffixes d'indexation ni préfixe Mixamo (ex: `pelvis`, `arm left elbow`, `weapon left`). Il s'agit d'une variante étendue du squelette à 91 os (Groupe 7), incluant des os supplémentaires pour la poitrine (`breast left/right base`) et des ancrages d'armes (`weapon left/right`).
* **Analyse des Meshes** :
  * 1 seul `SkinnedMesh` d'origine (`24_+Grenades|1.Grenade.002_1.0_0_0`) divisé en **32 primitives géométriques** distinctes au runtime.
* **Process de Standardisation pour 3254 Rigged** :
  * Grâce à l'absence d'indexation numérique sur ses os, sa structure est extrêmement proche de celle du Master Rig (Groupe 7). Il n'a besoin que d'une pose T de référence dans Blender avant l'exportation pour être pleinement interopérable.



## 7. Nouveau Modèle Ajouté : Lara Gold Shades (FBX converti en GLB)

Un nouveau modèle provenant du fichier `lara-croft-gold-shades-2739-rigged.zip` a été extrait et converti :
* **ID** : `lara_croft_gold_shades`
* **Fichier GLB produit** : `public/media/all_lara/lara_croft_gold_shades.glb`
* **Analyse du Rig (Groupe de Rig 7)** :
  * **Nombre d'os** : 88.
  * **Convention de nommage** : Noms propres sans suffixes d'indexation ni préfixe Mixamo (ex: `pelvis`, `arm left elbow`, `root hips`). Il s'agit d'une variante propre du squelette à 91 os (Groupe 7), simplifiée à 88 os en retirant certains os d'attache d'accessoires.
* **Analyse des Meshes** :
  * Un seul `SkinnedMesh` d'origine divisé en plusieurs primitives géométriques distinctes au runtime.
* **Process de Standardisation pour Gold Shades** :
  * Grâce à l'absence d'indexation numérique sur ses os et à ses noms propres standardisés, sa structure est compatible avec le Groupe 7 et le Master Rig. Il nécessite uniquement un alignement de pose T de référence dans Blender avant l'exportation.

## 8. Modèle de Studio Ajouté : X-Bot (Studio)

Le modèle de référence officiel X-Bot du studio a été ajouté au comparateur :
* **ID** : `xbot_studio`
* **Fichier GLB produit** : `public/media/all_lara/xbot_studio.glb`
* **Analyse du Rig (Master Rig)** :
  * **Nombre d'os** : 67.
  * **Convention de nommage** : Noms propres normalisés du Master Rig (ex: `pelvis`, `spine_1`, `spine_2`, `spine_3`, `arm_left_shoulder_1`, `leg_left_thigh`, etc.).
* **Process de Standardisation** :
  * Les préfixes d'origine `mixamorig:` ont été retirés et tous les noms d'os ont été normalisés pour correspondre à l'armature de référence du Master Rig.

## 9. Corrections Appliquées

* **Lara 543i** : Correction de la hiérarchie de la colonne vertébrale où une erreur de fusion d'index avait renommé deux os différents en `spine_1`. Les correspondances ont été corrigées pour renommer `spine_1_1` / `SPINE_2` en `spine_2` et `thorax` / `THORAX` en `spine_3`.

