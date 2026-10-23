# Miley solo — contrôle des 114 autres clips

Le catalogue contient 172 clips Miley. Les rôles des 29 duos en représentent
58 ; les 114 autres clips sont contrôlés ici, toutes catégories incluses.
La sélection est calculée depuis les chemins du registre et les participants
de `DUO_ANIMATIONS`, sans maintenir une seconde liste d'identifiants.

## Corrections appliquées

La correction commune du passage duo s'applique déjà à ces fichiers : unités
lues sur le squelette Character Creator et hauteur de repos obtenue depuis
`CC_Base_Hip`, au lieu de la référence générique de 0,991 m.

Le contrôle solo a trouvé une seconde cause de mauvaise trajectoire : les noms
contenant `step`, `walk`, `run` ou `stairs` déclenchaient une remise sur place des
hanches. Cette règle pouvait figer aussi une esquive de combat. Sur
`miley-armature-04-large-step-right-dodge`, l'écart mesuré avec le bassin source
était d'environ 8 cm sur un échantillon contrôlé.

Les pistes CC conservent maintenant leur mouvement de racine et de bassin
natif, indépendamment du nom. Les marches Miley retrouvent donc aussi leur
trajectoire enregistrée et leur oscillation verticale. Le verrouillage explicite
Hips-Lock X/Z de l'application reste disponible pour les comparaisons sur place.
Le traitement existant des autres familles d'animations n'est pas modifié.

Aucun GLB solo n'est réécrit : la correction se fait dans le retargeting commun.
Les durées déclarées des 114 solos concordent avec les fichiers à la précision
d'affichage du catalogue (un dixième de seconde). Aucune attente finale n'a été
coupée automatiquement : un solo n'a pas de partenaire donnant une borne de
synchronisation comme pour KO3.

## Vérifications

Le test précédemment réservé aux duos couvre désormais les 172 clips :
trajectoire du bassin comparée à la cinématique directe du squelette source,
valeurs finies, durée conservée et équivalence avec le worker. Sur les temps
contrôlés, l'erreur maximale est de 0,000102 cm. Les durées des paires restent
vérifiées séparément.

```bash
node scripts/audit-miley-duos.cjs --solo
node scripts/check-miley-duos.cjs --solo
node --test --test-isolation=none tests/unit/miley-duo-retargeting.test.cjs
npx tsc --noEmit
npm run build
```

Le navigateur reste headless et utilise Vite sur le port 5173 par défaut ;
`ROOM_TEST_URL` permet un serveur de validation isolé.

- `/tmp/miley-solos-audit.json` : repos, pistes de translation et poses source/cible.
- `/tmp/miley-solos-browser.json` : lecture des 114 solos à plusieurs instants.
- `/tmp/miley-solos-contact-sheet.png` : planche des 114 solos à mi-parcours.

Les scripts d'audit et de rendu sont communs aux modes duo et solo. Les tests
complémentaires ACCAD, Yoga et H2 ont également été exécutés : 16 tests réussis,
TypeScript et compilation réussis.

## Limites

La fidélité de la trajectoire aux données CC ne garantit pas chaque contact
pied–sol ou main–objet sur tous les personnages. Les pieds plantés, les chutes,
les positions assises et les mouvements aériens demandent des annotations
spécifiques ; aucun verrouillage global au sol n'est ajouté.

Voir [les duos Miley](miley-duos.md) et [les défauts récurrents](animation-defects.md).
