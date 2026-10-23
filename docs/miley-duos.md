# Duos Miley — premier passage de correction

Périmètre : 29 duos / 58 clips Character Creator déjà publiés dans
`public/animations/miley/`. Les 8 duos sociaux/danses et les 21 duos de combat
sont inclus. Ce travail est indépendant de la sélection ACCAD hors combat.

## Coordonnées et hauteur des hanches

Le retargeting ne trouvait pas la référence `CC_Base_Hip` dans son calcul de
proportions et utilisait la valeur par défaut de 0,991 m. Le squelette Miley
mesuré a les hanches au repos à environ 1,028 m. Cette différence amplifiait
la translation du bassin et pouvait ajouter plusieurs centimètres de hauteur.

`retargetClip.ts` lit maintenant la hauteur de repos du squelette CC. Il utilise
aussi l'échelle du parent de `CC_Base_BoneRoot` pour convertir les translations
en mètres, plutôt que de deviner l'unité de chaque piste selon son amplitude.
Un déplacement faible et un déplacement ample utilisent ainsi la même unité.

Exemples sur Xbot, au début du rôle A (hauteur du bassin en centimètres) :

| Duo | Avant | Après |
| --- | --- | --- |
| Pop Dance | 106,94 | 103,09 |
| Slow Dance | 106,06 | 102,24 |
| Date Bearhug | 107,46 | 103,59 |
| B1 | 95,77 | 92,32 |
| S1 | 95,64 | 92,20 |

Il s'agit d'une correction du transfert de coordonnées, pas d'un décalage Y
ajouté à chaque animation. Les rotations, trajectoires sources, mouvements
assis, sauts, portés et chutes ne sont pas remplacés par un verrouillage au sol.
Le test compare les positions du bassin retargeté à la cinématique directe du
squelette original pour les 58 clips et leur passage dans le worker. L'erreur
maximale mesurée sur les échantillons contrôlés est de 0,000037 cm.

## KO3 : suppression d'une attente finale superflue

Le premier relevé des durées avait manqué cette exception : l'attaque Hammer Fist
durait 12,3667 s, alors que la chute Side Up02 durait 6,6333 s.
Après 6,6333 s, l'attaque ne conservait que des variations quasi statiques :
rotation maximale de 0,01087° et translation locale maximale de 0,000214 unité
source, soit environ 0,00214 mm avec l'échelle CC de ce fichier.

`scripts/trim-miley-ko3.cjs` relit le GLB original dans
`/home/dinatih/3D Resources/anims/`, coupe cette fin à l'instant de fin du
partenaire et ajoute un échantillon interpolé exact à la borne de coupe.
Il vérifie la conservation de chaque échantillon retenu à la précision Float32,
puis met à jour le GLB publié et sa durée dans le registre. La vitesse et le
début des mouvements sont conservés ; aucun étirement temporel n'est appliqué.

Les 29 paires ont désormais des durées de clips identiques à la précision
Float32. Cela ne suffit pas à prouver que chaque impact ou contact se produit
exactement au bon instant : ces événements doivent encore être contrôlés.

## Contrôles et reproduction

```bash
node scripts/audit-miley-duos.cjs
node scripts/trim-miley-ko3.cjs          # inspection et validation sans écriture
node scripts/trim-miley-ko3.cjs --write
node --test --test-isolation=none tests/unit/miley-duo-retargeting.test.cjs
node scripts/check-miley-duos.cjs
npx tsc --noEmit
```

Le navigateur reste headless via le lanceur commun. Vite doit être disponible
sur `http://127.0.0.1:5173`, ou à l'adresse indiquée par `ROOM_TEST_URL`.

- `/tmp/miley-duos-audit.json` : références de repos, translations et mesures
  source/cible à plusieurs instants pour les 58 clips.
- `/tmp/miley-duos-browser.json` : contrôle des 29 lectures en paire.
- `/tmp/miley-duos-contact-sheet.png` : planche à mi-parcours avec un temps commun
  aux deux rôles, les placements du catalogue et les rotations déclarées.

Les tests de régression couvrent aussi les appuis ACCAD, le worker et le
retargeting Yoga. Les déplacements de paire `offsetB` et les orientations du
catalogue restent à contrôler duo par duo ; ils n'ont pas été recalibrés ici.

## Problèmes encore à traiter

- Valider les distances et orientations, notamment celles réglées manuellement
  sur les anciennes proportions. Comparer les contacts de mains et de corps
  avant de modifier un placement.
- Annoter les appuis réels des danses pour corriger le patinage sans immobiliser
  les pas ; conserver le support du partenaire pendant les portés.
- Distinguer les appuis au sol des appuis sur un siège pour Sit Cuddle Kiss et
  Sit Cuddle Hug. Les abaisser jusqu'aux pieds sans tenir compte du siège
  déformerait la pose.
- Contrôler les instants d'impact des combats, particulièrement KO3, et les
  contacts du corps au sol pendant les chutes. Une durée commune n'est pas
  une validation de tous les contacts.

Voir [les défauts récurrents d'animation](animation-defects.md) pour les règles
sur les biais de cheville, la hauteur et le patinage.
