# Reconstruction anatomique d’Ushiro

Le rig précédent associait les noms du pitbull aux mauvais pivots du shiba et
avait recalculé des poids de peau qui entraînaient le ventre avec les membres.
Il avait aussi figé la posture asymétrique d’une animation d’origine dans la
géométrie de référence. Le nouveau modèle repart de la géométrie neutre et des
poids peints de l’archive, puis construit une armature neuve compatible avec le
donneur. L’ancienne armature et ses animations sont supprimées.

## Repères et proportions

Le [standard AKC du shiba](https://images.akc.org/pdf/breeds/standards/ShibaInu.pdf)
décrit notamment une omoplate et un humérus de longueurs voisines, des coudes
près du corps, des antérieurs parallèles et des cuisses plus longues que les
jambes. Le [standard FCI](https://dev.fci.be/Nomenclature/Standards/257g05-en.pdf)
donne un rapport hauteur au garrot/longueur du corps de 10:11 et une angulation
modérée. Ces repères servent au contrôle de cohérence ; ils ne transforment pas
une illustration générée en relevé métrique de ce maillage.

Les points et matrices mesurés dans les fichiers sont archivés dans
`artifacts/ushiro/rebuild/reference-audit.json`. Le nom d’un os ne suffit pas à
identifier son articulation :

| Articulation | Pitbull et nouveau rig | Ancien rig Ushiro |
|---|---|---|
| Haut de l’omoplate | `Shoulder` | `Shoulder` |
| Épaule / départ de l’humérus | `Shoulder01` | `Arm` |
| Coude | `Arm` | `ForeArm` |
| Poignet / carpe | `ForeArm` | `Hand` |
| Main / début des doigts | `Hand` | `HandMiddle1` |
| Hanche | `Pelvis` | `UpLeg` |
| Genou | `UpLeg` | `Leg` |
| Jarret | `Leg` | `Foot` |
| Pied | `Foot` | `ToeBase` |

La longueur totale humérus + avant-bras et celle de la chaîne cuisse + jambe
sont conservées. Leur répartition suit les rapports mesurés du donneur ; la peau
est adaptée dans la pose de liaison, avant animation. Les axes de repos du
nouveau rig sont contrôlés contre ceux du donneur. L’importeur Blender du
pitbull a un facteur d’objet de 0,8363 environ : les translations sont converties
en unités monde avant l’adaptation aux proportions du modèle.

Dans les trois allures de base, les déplacements sont adaptés séparément à la
largeur du bassin, à la longueur du tronc et à la longueur des membres pour la
verticale. Le facteur du tronc ne réduit donc plus artificiellement la montée
et la descente du bassin. Ces déplacements sont relatifs à l’attente calibrée.

| Proportion mesurée sur le côté gauche | Source shiba | Nouvelle liaison |
|---|---:|---:|
| Humérus / omoplate | 1,37 | 0,96 |
| Humérus / (humérus + avant-bras) | 59,15 % | 41,70 % |
| Cuisse / (cuisse + jambe) | 49,15 % | 58,09 % |

Le modèle conserve le gabarit de présentation de l’application : 40 cm de
hauteur totale dans l’attente. Cette valeur n’est pas une mesure au garrot.
Les silhouettes de races différentes ne doivent donc pas être confondues avec
une identité de leurs dimensions externes.

## Mouvement et déformation

- La hiérarchie reprend les 117 os du donneur, dont `Shoulder01` et les trois
  contrôles `breathe`, plus le repère `Muzzle` utilisé par la caméra : 118 os.
- Les poids anatomiques de l’archive remplacent la résolution de chaleur sur
  le corps entier. Les groupes sont remappés vers leurs véritables pivots,
  limités à quatre influences puis normalisés pour glTF. Les petits poids de
  respiration d’origine alimentent les contrôles latéraux et ventraux.
- Seule la courbure de queue de l’ancienne animation debout est conservée.
  La tête tournée et les appuis asymétriques ne sont pas incorporés au repos.
- Dans l’attente, la marche et la course, la courbure propre de la queue et la
  forme des oreilles dressées restent stables. La racine de queue porte le
  mouvement de balancement ; les articulations distales ne copient pas la
  flexion de la queue droite et des oreilles souples du pitbull.
- Le fichier donneur utilise des interpolations `STEP` à 25 Hz. Les courbes
  sont rendues continues avant le calcul des contacts, avec continuité des
  signes des quaternions. La comparaison utilise des copies de clips fluides,
  sans modifier le fichier du pitbull.
- Une résolution analytique à deux segments utilise les vrais pivots
  épaule–coude–poignet et hanche–genou–jarret. Le donneur fournit le plan de
  flexion et les phases d’appui. Pendant le vol, l’arc de la patte provient de
  la cinématique propre au shiba : une interpolation cubique monotone retire
  la dérive de hauteur entre décollage et atterrissage. La hauteur absolue de
  la patte du pitbull n’est pas imposée à une chaîne de proportions différentes.
  Les os ne sont pas étirés.
- La hauteur commune du bassin minimise l’erreur des cosinus des quatre
  angles par rapport au donneur, dans l’intervalle physiquement atteignable.
  Cela évite de s’arrêter sur une chaîne IK complètement verrouillée.
- Les trois cycles sont cuits à 600 Hz, fréquence commune aux clés source à
  25 Hz, à la timeline à 30 Hz et aux lectures à 60/120 Hz. Les 116 autres clips
  sont transférés avec le nouveau rig et une projection du corps sur le sol.
  Les poses source d’une seule image occupent une image native de 1/25 s.

La [documentation Blender sur l’IK](https://docs.blender.org/manual/en/5.0/animation/armatures/posing/bone_constraints/inverse_kinematics/introduction.html)
explicite le rôle de la pose de repos et du contrôle du plan de flexion. L’étude
[de Souza et al., 2021](https://agriculturejournals.cz/doi/10.17221/178/2019-VETMED.pdf)
mesure les articulations de pitbulls à la marche et au trot ; elle justifie de
séparer les repères anatomiques et les phases du cycle. Les angles du présent
contrôle sont des angles intérieurs 3D de segments du rig, pas une reprise des
conventions cliniques de cette étude. La course du fichier est un galop ; elle
n’est pas assimilée au trot mesuré dans la publication.

## Résultats et limites vérifiées

`validation.json` mesure les modèles exportés à 120 Hz. L’écart ci-dessous est
la moyenne des RMSE des deux coudes et des deux genoux face au donneur continu :

| Cycle | Ancien Ushiro | Nouveau Ushiro |
|---|---:|---:|
| Attente | 7,01° | < 0,01° |
| Marche | 28,39° | 5,93° |
| Course | 46,05° | 5,31° |

L’écart résiduel correspond à l’adaptation des proportions et des appuis, pas à
une identité forcée de tous les angles. Les pieds du donneur pénètrent parfois
le sol ; cette pénétration n’est pas recopiée. Les sommets du nouveau modèle
respectent le sol à la tolérance de 0,01 cm de présentation pendant les trois
cycles, y compris entre les clés. Les longueurs des segments restent fixes.

L’influence moyenne des membres dans la région abdominale de diagnostic passe
de 71,47 % à 0,05 % ; aucun sommet de cette région n’a désormais une majorité
de poids attribuée aux membres. Les trois animations de base ont été revues de
profil, de face, de trois quarts et avec des gros plans de la patte avant. Les
119 clips sont chargés et contrôlés techniquement dans le navigateur ; les
116 autres clips n’ont pas la même revue visuelle détaillée.
Le genou arrière droit en course ne reste plus verrouillé à 180° : son maximum
sur le relevé à 120 Hz est d’environ 158°.

Les planches `*-comparison.jpg`, `*-details.jpg` et `joint-angles.png` permettent
de vérifier ces résultats. `referencePose=1` dans la comparaison affiche les
poses de liaison réelles. Les radios illustratives sont sous les cartes.

## Reproduction

```bash
git show 300b8d54:public/characters/ushiro/ushiro.glb > /tmp/ushiro-before-rebuild.glb
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/inspect-ushiro-reference.py
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-ushiro.py
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/validate-ushiro-anatomy.py
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/review-ushiro-rebuild.py -- --final
MPLCONFIGDIR=/tmp/room-3d-matplotlib python scripts/compose-ushiro-rebuild.py
blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/preview-dogs.py -- --dog ushiro
python scripts/compose-dog-review.py --dog ushiro
ROOM_TEST_URL=http://127.0.0.1:5193 node scripts/check-dog-comparison.cjs --hardware-gpu
ROOM_TEST_URL=http://127.0.0.1:5193 node scripts/check-dog-rigs.cjs --hardware-gpu
npx tsc --noEmit
npm run build
```

`scripts/rig-dogs.py -- --dog ushiro` délègue au nouveau constructeur ; l’ancien
chemin de reconstruction erroné a été supprimé. Le teckel n’est pas reconstruit
pendant cette intervention.

Pour itérer uniquement sur les trois cycles : construire avec `--draft
--base-only`, valider avec `validate-ushiro-anatomy.py -- --draft`, puis lancer
`scripts/update-ushiro-base-clips.py` dans Blender. La mise à jour refuse toute
différence de squelette de liaison, géométrie ou poids avant de conserver les
116 autres clips. `--sample-fps` permet un brouillon rapide ; la fréquence de
production par défaut est de 600 Hz et le contrôle du sol reste strict.
