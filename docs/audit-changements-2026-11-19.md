# Revue des changements du 16 au 19 novembre 2026

Référence avant lundi : `1305c7be`. État examiné : `ddf5f034` (75 commits depuis lundi, 95 fichiers source modifiés). La revue comprend les ajouts de Gemini et de Codex sans attribuer une erreur à un agent sur la seule base du nom du commit.

## Corrections réalisées

- **Téléphone : ressources partagées modifiées et ressources propres non libérées.** La projection UV écrivait dans la géométrie du cache GLTF ; le cadrage de l’affiche modifiait la texture commune de `useTexture`. Le téléphone utilise désormais `useGLTFClone`, clone uniquement sa géométrie d’écran lorsqu’il lui manque des UV, possède son cadrage de texture et libère géométrie, texture et matériau d’écran au démontage. Les autres consommateurs gardent leurs ressources intactes.
- **TACKAN : matériaux clonés sans libération.** Chaque flacon conserve ses matériaux indépendants pour rendre son savon visible et les libère au démontage, sans libérer les textures du cache.
- **Objets animés : état de scène ignoré.** `createAnimatedGlbItem` lisait seulement `actionState`, alors que ses consommateurs peuvent fonctionner sans lui dans la scène. Il utilise désormais `useDoorOpen`, qui lit le store pour la scène et l’état local pour la preview. Cela couvre les coffres, poubelles, aspirateur et brosse animée.
- **Comparaison Lara : travail React multiplié par la taille de la grille.** L’horloge mettait à jour le composant racine dix fois par seconde, recréant les listes et les props de tous les personnages. Seule la barre temporelle se rafraîchit maintenant ; la scène conserve son horloge mutable. Le temps et la durée se mettent aussi à jour si une animation finit de charger pendant la pause.
- **Perruques : registre utilisé deux fois différemment.** La liste et l’ajout groupé utilisent la même liste d’inventaire, avec les noms lisibles, plutôt que le dictionnaire contenant aussi des alias.
- **Tests obsolètes.** Les tests Dröna attendaient encore l’ancien modèle officiel par défaut et une version procédurale supprimée ; les tests des paires Lara demandaient la fusion des yeux désormais volontairement séparés ; les contrôles des chiens visaient encore Ulotte. Les mocks nécessaires à la texture lunaire, au registre des tenues et au nouvel état des objets animés ont été mis à jour. Les assertions sur les géométries partagées, le skinning, la pause, l’inversion de lecture et la destruction du mixer sont conservées. Un test vérifie explicitement que les deux yeux restent indépendants.

## Inventaire et ressources

1 483 références locales distinctes ont été vérifiées dans les fichiers source modifiés, ainsi que les en-têtes et compteurs géométriques de 65 modèles d’objets ajoutés ou modifiés. Deux références pointent vers la même photo UTÅKER absente. Elles existaient déjà avant cette semaine ; les galeries possèdent d’autres photos valides. Aucun nouveau fichier manquant n’a été trouvé dans ces références littérales. Ce contrôle ne couvre pas toutes les URL construites dynamiquement.

La factorisation via `createStaticGlbItem` est déjà appropriée pour les nouveaux produits de toilette et d’entretien. Ajouter une autre couche générique n’apporterait pas de gain établi. Les modèles originaux n’ont pas été décimés ou recompressés pendant cette revue.

### Optimisations d’assets à prioriser

| Asset sur disque | Poids du fichier | Observation |
| --- | ---: | --- |
| `/home/dinatih/Projects/room-3d/public/items/bob-droit-red/BobDroitRed.glb` | 30,42 Mio | Seulement 9 918 triangles, mais trois textures PNG de 4 096² : environ 192 Mio en RGBA avant mipmaps, estimation et non mesure GPU. Aucun remplacement dans `scene-models.json`. Priorité : une variante de scène avec textures réduites. |
| `/home/dinatih/Projects/room-3d/public/items/bob-red/BobRed.glb` | 8,10 Mio | Trois textures de 2 048² pour 3 607 triangles ; même possibilité de variante de scène. |
| `/home/dinatih/Projects/room-3d/public/items/clip-hanger-16/ClipHanger16Loaded.glb` | 6,09 Mio | 199 208 triangles, dont les trois tee-shirts simulés. À optimiser en préservant la silhouette des plis. |
| `/home/dinatih/Projects/room-3d/public/items/laundry-detergent/LaundryDetergent.glb` | 2,81 Mio | 119 782 triangles pour un petit flacon ; candidat à une simplification hors ligne. |
| `/home/dinatih/Projects/room-3d/public/items/household-showcase/chips.glb` | 14,20 Mio | 195 968 triangles. Ressource d’inventaire : ne pas assimiler automatiquement son poids à un coût permanent dans le studio. |

Ces chiffres décrivent les assets ; ils ne constituent pas une mesure des FPS. Les variantes de scène permettraient de conserver les originaux détaillés dans l’inventaire, selon le mécanisme déjà présent dans le projet.

## Vérifications

- `npx tsc --noEmit` : passe après les corrections.
- `npm run build` : passe.
- Test navigateur headless existant de comparaison Lara : passe (chargement, perruque, marche, duplication ; requêtes externes bloquées).
- Contrôles Blender `check-amazon-bathroom-products.py` et `check-paper-storage.py` : passent, notamment les dégagements de tablette, de mur diagonal et le positionnement des rouleaux.
- Les nouveaux tests vérifient la préservation des UV/textures source, la libération des ressources du téléphone et du TACKAN, et l’indépendance scène/preview des clips d’objets.
- 24 tests ciblés passent avant l’ajout du troisième test de ressources ; les trois tests de ressources passent ensuite. Les quatre tests pause/inversion des objets animés et le test du couvercle réversible passent également.

### Suite complète : état avant la poursuite de la revue

Première exécution : **577 réussites / 593 tests, 16 échecs**. La seconde exécution a chargé davantage de tests grâce aux mocks réparés : **590 réussites / 604 tests, 14 échecs**. Parmi ces 14, cinq dépendaient du nouveau hook d’état des objets animés ; leurs mocks ont ensuite été corrigés et leurs cinq tests relancés avec succès. Les neuf échecs ci-dessous restaient alors à traiter. Leur résolution et la nouvelle exécution complète sont consignées dans la section suivante.

| Test initialement restant | Diagnostic initial de revue |
| --- | --- |
| `bed-layout-safety` : sortie Vivida | Coordonnées de fixture figées alors que les lits ont été déplacés cette semaine. À recalculer avant de conclure à une régression de sécurité. |
| `lara-life` : téléviseur | Mock `useTvClipVideo` absent. Le module TV n’a pas changé dans la période. |
| `life-specialties` | Extraction partielle du registre omettant `EXTERIOR_GROUND`. Le registre n’a pas changé dans la période. |
| `miley-duo-retargeting` | **Écart de trajectoire du bassin de 8,7376 cm** sur `miley-armature-41-provocative-walk`. À examiner séparément : le retargeter et les fichiers Miley n’ont pas changé dans la période. Ne pas desserrer la tolérance pour masquer cet écart. |
| `night-bed` | Extraction partielle omettant `smartObjectCache`. |
| `robot-visibility` : sélection par défaut | Le test attend encore G1 visible ; un commit du 15 novembre l’a explicitement masqué par défaut. |
| `robot-visibility` : profils | Attente `excludeStudio` incohérente avec le profil obtenu. Le module des obstacles n’a pas changé dans la période ; diagnostic fonctionnel à poursuivre. |
| `smart-object-configuration` : sommeil | Même extraction partielle omettant `smartObjectCache`. |
| `static-scene-cleanup` : literie UTÅKER | Mock `redFabricMaterial` absent. Le module UTÅKER n’a pas changé dans la période. |

Cette revue confirme les corrections ci-dessus, mais ne certifie pas visuellement chaque modèle ni chaque animation du projet. Les vérifications géométriques ont porté sur les contrôles Blender existants mentionnés, pas sur un rendu exhaustif de tous les objets.


## Poursuite de la revue : neuf échecs résolus

La nouvelle suite complète passe : **611 tests réussis, zéro échec**. L’augmentation du total vient notamment des sept tests `life-specialties` enfin chargés à la place d’un seul échec de fichier. TypeScript et la compilation passent également.

- Les fixtures de sécurité des lits expriment maintenant la position de Vivida par rapport au bord du lit et au rayon de l’acteur : le scénario continue d’exiger le blocage tant que son corps touche le débattement, puis sa libération.
- Les tests de sommeil et d’allée incluent le cache du résolveur qu’ils extraient ; les spécialités incluent le sol extérieur et le rayon du corps. Le test UTÅKER fournit le matériau textile attendu.
- Les quatre robots actifs par défaut sont correctement attendus, avec G1 masqué. L’échec des profils robots dans la suite complète venait du mock d’architecture de `navigation.test.cjs` : son callback de cycle de vie réutilisé ne trouvait pas l’obstacle du studio pour un profil `excludeStudio`. Le mock inclut maintenant cet obstacle réel ; le test continue de vérifier des profils distincts et le blocage des trajets dans le studio.
- L’écran TV respecte la restauration du mirroring explicitement demandée dans le commit `3937b276`. Le test attend maintenant la vidéo lorsque le bureau diffuse, même si le toggle d’écran statique est éteint. Il vérifie aussi l’arrêt en absence de vidéo, l’écran statique et la priorité du clip TV sur le mirroring.
- **Miley : l’écart de 8,7376 cm n’était pas une dérive du retargeter.** À la première image, cet écart est exclusivement vertical et correspond à la correction des appuis. Le test attendait un bassin parfaitement immobile pour les marches, alors que le code conserve délibérément le transfert de poids et retire seulement le déplacement horizontal net. Le test vérifie désormais séparément la trajectoire source sans correction d’appui, le retrait du déplacement net, la conservation du balancement horizontal après correction, les semelles au sol et l’identité des résultats main thread/worker. La tolérance de 0,001 cm est conservée. Sur les 29 duos et 114 solos, l’erreur maximale de trajectoire source mesurée est **0,000102 cm**.

### Première optimisation de modèle appliquée

La casquette camionneur est réellement utilisée sept fois sur le porte-chapeaux et sur Lara Vivida. Les bobs lourds relevés plus haut apparaissent seulement comme ressources d’inventaire dans les références examinées : leur poids ne prouve pas un coût permanent en scène. La casquette a donc été traitée en premier.

- Original conservé : `/home/dinatih/Projects/room-3d/public/items/trucker-cap-red/TruckerCapRed.glb`.
- Variante de scène : `/home/dinatih/Projects/room-3d/public/items/trucker-cap-red/TruckerCapRed-scene-512.glb`.
- Fichier : **2 151 760 → 822 260 octets**, soit environ **62 % de réduction**.
- Textures : deux images de 2 048² et une de 1 024² deviennent trois images de 512². Estimation RGBA avant mipmaps : **36 → 3 Mio** ; il ne s’agit pas d’une mesure du GPU ni des FPS.
- Le mécanisme existant `scene-models.json` sélectionne cette variante dans la scène. La preview conserve l’original. Le préchargement de la casquette passe lui aussi par ce mécanisme afin de ne pas charger immédiatement l’original haute résolution dans la scène.
- Le contrôle `tests/assets/test_scene_models.py` passe et vérifie que les données de géométrie, animations, matériaux et samplers sont préservées. Seuls les payloads d’images et les offsets des buffers changent. Le test des chemins de modèles passe également.

Rendus comparatifs Blender générés en face, trois-quarts et dos. L’inspection du trois-quarts confirme la forme conservée, avec une perte attendue de détail fin du textile dans la variante 512 px. Aucun gain de FPS n’a été mesuré. La suite complète de 611 tests a précédé cette optimisation ; le contrôle de préservation des modèles, le test des chemins, TypeScript et le build ont été relancés après celle-ci.
