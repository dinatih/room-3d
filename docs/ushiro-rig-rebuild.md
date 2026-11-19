# Ushiro : reconstruction et contrôle de la déformation

Les captures de l’utilisateur invalidaient la première reconstruction à
118 os : épaule anguleuse, thorax pincé, hanches trop hautes dans les poses
couchées et queue déformée hors des trois allures. Les angles des articulations
et le nombre d’os ne validaient pas la qualité de la surface.

## Causes corrigées

- Le constructeur raccourcissait le haut du bras d’environ 30 % et allongeait
  l’avant-bras d’environ 43 %, en déformant aussi le maillage au repos. La
  calibration des appuis déplaçait ensuite la peau aux attaches des membres.
- Le contrôle natif `pelvis_jnt` est nettement plus antérieur aux hanches que
  le contrôle `Hips` du donneur. Les assimiler comprimait le repère du tronc.
  Le nouveau repère est établi depuis les deux articulations de hanche et
  l’écart mesuré du donneur, adapté aux proportions natives.
- La masse de `COG_jnt` allait à un seul bloc de bassin ; les stations de la
  colonne n’avaient pas la même répartition relative que celles du donneur.
- La translation de `Shoulder01` était supprimée, notamment pendant le shake.
  La résolution à deux segments ignorait aussi la mobilité de l’omoplate.
- Imposer le plan de flexion du Pitbull aux segments plus longs du Shiba
  faisait toucher la peau du coude au sol. Remonter tout le chien pour ce
  contact redressait les hanches dans les poses couchées.
- Les coins transparents des cartes de moustaches participaient aux contacts.
  L’alpha fourni n’était pas connecté au matériau exporté.
- La courbure distale de la queue droite du donneur était copiée sur une queue
  déjà enroulée dans 116 animations ; leurs translations suivaient aussi une
  adaptation différente de celle des trois allures.

## Liaison et poids

Le corps neutre évalué et les articulations des membres proviennent de l’archive
native. Aucune longueur d’humérus, d’avant-bras, de cuisse ou de jambe n’est
normalisée sur celle du Pitbull. Seule la queue est remise à sa courbure native
debout, puis l’ensemble est placé au sol. Le constructeur vérifie que les
sommets du corps sans influence de queue ne changent qu’à la précision numérique.
La mesure est dans `rebuild/joint-mapping.json`.

| Repère anatomique | Nom compatible avec les animations du Pitbull |
|---|---|
| Haut de l’omoplate | `Shoulder` |
| Épaule | `Shoulder01` |
| Coude | `Arm` |
| Poignet | `ForeArm` |
| Hanche | `Pelvis` |
| Genou | `UpLeg` |
| Jarret | `Leg` |

Les axes de liaison sont compatibles avec le donneur. Les stations de la
colonne suivent ses distances relatives sur le trajet vertébral natif. La masse
du tronc est répartie entre les stations adjacentes selon les sommets. Les
transitions des poids du corps sont diffusées sur les arêtes avec les paramètres
de l’artiste : facteur 0,5, 20 itérations. Les masques de tête, queue et doigts
sont conservés avant limitation à quatre influences et normalisation glTF.
Cette diffusion ne reproduit pas intégralement le `CorrectiveSmooth` dynamique
que le fichier Blender natif appliquait après son armature.

Les cartes alpha sont séparées selon les îlots et les texels du matériau,
exportées avec un masque alpha et `groundContactSurface: false`. Elles restent
animées et visibles ; leurs coins transparents ne définissent pas l’appui du
corps. Le matériau utilise le seuil standard glTF MASK de 0,5.

## Transfert et contacts

Les positions de la colonne et du cou sont transférées en espace monde avec
un décalage de liaison natif tourné par chaque articulation. Cela évite
l’accumulation de rotations locales sur des segments de directions différentes.
Les déplacements suivent la largeur du bassin, la longueur du tronc et la portée
des membres, avec conversion de l’échelle d’objet du donneur en unités monde.

La chaîne avant utilise omoplate, humérus et avant-bras. La chaîne arrière
utilise cuisse et jambe. Le glissement scapulaire fourni est conservé ; la
résolution peut orienter l’omoplate sans étirer les segments. Les plans de
flexion sont ajustés lorsque la peau d’un coude ou d’un genou rencontre le sol,
au lieu de traiter systématiquement ce contact par une hausse du bassin.
Le cou peut aussi relever la tête en conservant son orientation et ses
segments. Ses limites cinématiques ou de déformation sont enregistrées.

Les trois allures utilisent les phases d’appui du donneur et les arcs de
balancement natifs. Les autres clips utilisent ses hauteurs de pieds adaptées
aux membres. Tous passent dans le même solveur des longueurs et des contacts.
Les huit références supplémentaires conservent aussi l’écartement signé des
deux paires de pieds, adapté à la longueur du corps, sans déplacer leur centre.

Longueurs, absence de pénétration et dégagement minimal des pieds sont des
contraintes. La hauteur exacte d’un pied du donneur est un objectif d’ajustement.
Si cet objectif ne progresse plus, une pose respectant les contraintes est
retenue et marquée `contactFit: constrained`, avec l’erreur mesurée dans
`contact-report.json` et un diagnostic explicite pendant la construction.
Ces cas ne sont pas présentés comme des contacts exacts.

La courbure intrinsèque de la queue et les oreilles dressées restent stables
dans les 119 clips ; la racine de queue porte le mouvement du donneur.
`dog-animation-curves.py` assure l’interpolation continue et la continuité des
signes des quaternions dans la construction et les diagnostics. Les trois
cycles et les deux shakes sont cuits à 600 Hz ; les six autres références à 120 Hz. Les poses
source d’une seule image gardent une durée de 1/25 s.

## Revue et limites

Les onze premières entrées sont attente, marche, course, les deux shakes,
couché sur le lit, sommeil sur le lit, position accroupie, aboiement avec saut,
galop et aboiement d’alerte. Cet ordre est commun à l’inventaire et à la
comparaison ; le catalogue conserve 119 entrées.

Les planches de `artifacts/ushiro/priority-review/` comparent Pitbull, Ushiro du
commit `87a0246d` et l’export corrigé, sans squelette masquant la peau :
16 phases par shake, 8 par marche/course et 4 pour les autres références,
de profil et de trois quarts. Les captures navigateur complètent cette revue
avec les matériaux réels de l’application.

Le validateur contrôle les poids, durées, longueurs et appuis sur les exports.
Les trois cycles et les deux shakes sont aussi mesurés à 240 Hz, incluant
des instants entre les clés de cuisson. La précision de contact du solveur représente 0,005 cm à la hauteur de
présentation de 40 cm ; la validation du sol entre clés accepte 0,01 cm. Les
écarts d’angles sont informatifs et ne constituent plus une preuve de qualité
de la peau. Les statistiques d’arêtes décrivent la déformation de régions
sélectionnées par leurs groupes dominants ; elles ne mesurent pas exactement
la conservation du volume.

La revue visuelle détaillée porte sur les onze références. Le contrôle technique
du catalogue ne remplace pas une revue image par image des 119 animations,
notamment des contacts entre membres et des fortes torsions. Les radios sont
des illustrations théoriques, pas des relevés métriques du maillage.

La marche et les deux shakes réduisent la déformation mesurée des régions
épaule, hanche et tronc par rapport au commit précédent. Ce constat ne s’étend
pas uniformément aux poses couchées : l’indicateur d’épaule augmente pour
`interact_bed_lay_exist`, et celui du tronc reste comparable pour le sommeil.
Ces poses gardent des plis importants à l’épaule. Le respect du sol et de
l’écartement des pieds ne suffit donc pas à les déclarer visuellement parfaites.
Les valeurs et leurs limites sont conservées dans `surface-summary.json`.

## Reproduction

```bash
git show 87a0246d:public/characters/ushiro/ushiro.glb > /tmp/ushiro-before-torso-repair.glb
git show 300b8d54:public/characters/ushiro/ushiro.glb > /tmp/ushiro-before-rebuild.glb
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-ushiro.py
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/validate-ushiro-anatomy.py
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/review-ushiro-priority.py -- --model /tmp/ushiro-before-torso-repair.glb --label before
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/review-ushiro-priority.py -- --model public/characters/animated-pitbull-dog/dog.glb --label donor
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/review-ushiro-priority.py -- --model public/characters/ushiro/ushiro.glb --label final
python scripts/compose-ushiro-priority.py
ROOM_TEST_URL=http://127.0.0.1:5196 node scripts/check-dog-comparison.cjs --hardware-gpu
ROOM_TEST_URL=http://127.0.0.1:5196 node scripts/check-dog-rigs.cjs --hardware-gpu
npx tsc --noEmit
npm run build
```

`--draft --reference-only --sample-fps 25` construit rapidement les onze
références dans `/tmp/ushiro-candidate.glb`. Sans `--reference-only`, le brouillon
couvre le catalogue complet. `--base-only` limite aux trois allures.
`--clips 'idle_shake_1. 137' 'idle_shake_2. 81'` permet une cuisson partielle ;
les rapports de brouillon vont dans `rebuild/draft/`.
`update-ushiro-base-clips.py -- --clips …` remplace ces clips et leurs rapports
après vérification des pivots, de la topologie, des UV, des poids et des
surfaces de contact. Un changement
de liaison ou de poids impose de reconstruire tous les clips.

Références : [CorrectiveSmooth](https://docs.blender.org/manual/en/4.4/modeling/modifiers/deform/corrective_smooth.html),
[animations glTF](https://docs.blender.org/manual/en/5.2/addons/scene_gltf2.html),
[retargeting et contraintes, Gleicher](https://graphics.cs.wisc.edu/Papers/1998/Gle98/).
