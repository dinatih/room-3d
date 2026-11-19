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
