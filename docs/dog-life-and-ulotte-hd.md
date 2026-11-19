# Vie des chiens et revue Ulotte HD

Les pauses autonomes de Pitbull, Ushiro et Ulotte HD comprennent maintenant
les deux shakes, le coucher, pee, poop et deux allures de marche : normale
et reniflante. L’aboiement d’alerte fait partie des pauses. Les pauses courtes
se jouent une fois, sans déplacement de la racine. La marche reniflante suit
le même service de navigation que les autres déplacements.

Le coucher utilise `idle_to_idle_lay 111`, puis `idle_lay_pose 2`, puis
`idle_lay_to_idle 71`. Les transitions se terminent avant de passer à la phase
suivante. La pose couchée reste plusieurs cycles. Le catalogue partagé possède
16 références en tête, incluant pee, sniff et les trois étapes du coucher.

Le Bloodhound utilise ses clips natifs de shake, coucher, pee, poop,
aboiement et sniff. Son clip de coucher contient la transition : il est joué
une fois puis maintenu. Le Labrador utilise ses shakes, coucher avec transitions,
aboiement et sniff. Son catalogue ne fournit pas pee/poop ; ces comportements
ne lui sont pas attribués. Aucun nouveau modèle ni clip n’a été généré ici.

Validation : `node scripts/test-dog-life.cjs`, `npx tsc --noEmit`,
`npm run build`. Le test couvre les correspondances des quatre catalogues,
les durées des actions courtes, la séquence de coucher, l’immobilité de la
racine pendant celle-ci, le déplacement sniff et les références prioritaires.

## Premier état du rig Ulotte HD

`artifacts/dachshund-sculpt/life-review/priority-poses.jpg` montre le modèle
actuel à mi-parcours de shake, pee, poop, couché et sniff, de profil et de trois
quarts. Le matériau gris du rendu de travail permet de lire la surface :
le pelage noir de l’application reste inchangé.

Cette revue n’est pas une validation du rig. Le pee montre une forte
sollicitation de l’attache de la patte arrière ; le couché expose la déformation
des épaules et du ventre. Il faut comparer les contacts et l’écartement des
pattes sur les cycles complets, pas seulement ces cinq poses.

Le constructeur `rig-dogs.py` utilise encore un squelette réduit de 44 os.
La cuisson des clips autres que les trois allures utilise des déplacements
relatifs au bassin et une correction de hauteur du tronc spécifique au teckel.
La projection au sol peut relever ensemble le bassin et les cibles des quatre
pieds lorsqu’un membre est saturé. Ce sont des points à mesurer avant de
modifier les poids : ajouter des os ne résout pas à lui seul ces contraintes.
Le rig et les 119 clips existants d’Ulotte HD restent inchangés à ce stade.

## Première correction intégrée : marche reniflante

Seul `walk_fwd_sniff 46` a été remplacé. Les 118 autres clips sont conservés,
vérifiés piste par piste sur les deux exports. La géométrie de liaison,
les UV, les pivots des 44 os et les poids sont identiques ; le contrôle de
ces invariants précède la fusion. Le fichier Blender éditable est actualisé.

La nouvelle résolution calcule directement les deux segments des membres,
avec leurs longueurs natives. Le plan de flexion et l’orientation des segments
partent des axes natifs du teckel, transportés avec le thorax ou le bassin.
Le mouvement du donneur fournit le corps et les cibles de pieds. Les courbes
source sont lues en continu ; le clip est cuit à 600 Hz.

Sur l’export final, à 240 instants par seconde incluant les intervalles entre
clés, le plus grand déplacement angulaire par intervalle passe de 25,35°
à 9,59°. Le minimum de peau du corps passe de −0,442 cm à −0,0119 cm à
la hauteur affichée de 30 cm. Ces maxima ne concernent pas nécessairement
le même os : ils décrivent le pire intervalle mesuré, pas une conservation
de volume. Les seuils de sol et les durées sont contrôlés explicitement.

Le shake reste inchangé. Les premiers essais ont révélé des basculements
d’articulations entre clés ; une inversion de genou a été localisée vers
2,55 s avec un pied et un bassin presque immobiles. Le dernier essai réduit
la pénétration mais aggrave encore le pire saut de rotation : il est rejeté.
Le coucher expérimental passe les contrôles techniques, mais ses appuis et
sa silhouette ne sont pas suffisamment convaincants pour le publier.
`rejected-rig-trial.json` conserve ces résultats défavorables.

La planche `corrected-walk_fwd_sniff-46.jpg` compare le Pitbull, Ulotte avant
et l’export retenu, à quatre phases de profil et de trois quarts. Le contrôle
du sniff ne valide pas les plis ni les contacts des autres animations.

Le constructeur existant `rig-dogs.py` reste inchangé. Les essais sont isolés
dans `experiment-ulotte-rig.py`, qui exige `--draft` et écrit dans `/tmp`.
Leur intégration est explicite, après validation des clips retenus :

```bash
git show ddf5f034:public/characters/dachshund-sculpt/dog.glb > /tmp/ulotte-before-cycle-fix.glb
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/experiment-ulotte-rig.py -- --dog dachshund-sculpt --draft --clips 'walk_fwd_sniff 46'
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/validate-ulotte-cycles.py -- --clips 'walk_fwd_sniff 46'
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/update-ulotte-clips.py -- --clips 'walk_fwd_sniff 46'
ALSOFT_DRIVERS=null blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/validate-ulotte-cycles.py -- --candidate public/characters/dachshund-sculpt/dog.glb --clips 'walk_fwd_sniff 46'
python scripts/verify-ulotte-catalog.py
```

## Correction du flottement pendant le sniff

Le contrôle précédent ne mesurait que la pénétration de la peau. Il pouvait
passer alors que les quatre pieds étaient suspendus. Le nouveau contrôle
mesure aussi, sur chaque instant, le pied le plus proche du sol.

La correction locale du cou précède la correction du corps lorsque la base
du cou est au-dessus du sol. Le museau est relevé par rotation cervicale sans
déplacer le bassin ni les cibles des pieds. Une pose initiale plaçant la base
du cou sous le sol nécessite d’abord le contact du tronc, tête exclue, puis
le contact cervical. Une limite non résolue est un échec explicite ; un résidu
atteignant la limite anatomique n’est accepté que dans la moitié du budget
existant de contact (0,05 cm à la taille affichée), avec diagnostic explicite.
Le contrôle final de l’export reste obligatoire.

Sur le sniff publié, l’écart maximal entre le pied le plus proche du sol et
le sol passe de **3,35 cm** à **0,000261 cm** à la hauteur de présentation.
La pénétration maximale reste sous 0,0031 cm. La mesure couvre 240 instants
par seconde et les intervalles entre clés. Les 118 autres clips sont inchangés.
La planche avant/après affiche maintenant le plan de sol.

Le repère de sol orthographique de l’inventaire est partagé avec la page de
comparaison : ligne verte Y=0, repères ±2 unités et axes en vue de dessus.
Le repère reste fixe pendant le cycle, sans suivre le museau ni les pieds.

Le coucher expérimental passe les contacts mais conserve des plis et n’est
pas intégré. La vérification des contacts ne suffit pas à valider sa surface.
Les essais de conservation de volume seuls ne corrigent pas ces plis.

Le shake à 120 Hz garde les appuis mais pénètre encore entre les clés :
`shake-contact.json` conserve ce refus. L’essai à 600 Hz rencontre une limite
du solveur cervical et est interrompu avant export ; le shake de l’application
reste inchangé. Le coucher testé est aussi conservé uniquement comme diagnostic
(`lying-contact.json`), malgré le succès du contrôle de sol.

La comparaison réelle a été ouverte dans un navigateur headless, vérifiée sur
les trois repères Y=0 sans erreur navigateur, puis capturée dans
`grounded-comparison.png`. Le navigateur de test et le serveur temporaire sont
fermés après vérification.
