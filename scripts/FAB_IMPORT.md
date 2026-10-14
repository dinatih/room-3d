# Animations Fab et ActorCore

Les sources demandées sont listées dans `import-fab-animations.py`, y compris les archives imbriquées du relevé UE4 et les FBX individuels. Les fichiers originaux restent dans `/home/dinatih/3D Resources/fab.com`.

```bash
blender --background --python-exit-code 1 --python scripts/import-fab-animations.py
npx tsc --noEmit
npm run build
node scripts/temp_fab_check.cjs
```

Le test lance son propre serveur Vite sur le port 5192 et Chromium headless avec le lanceur du projet. Il vérifie le catalogue, les pools IA, toutes les animations sur X-Bot et Lara, les trajectoires métriques du bassin et l'équipement. Son aperçu de contrôle est `/tmp/room-fab-animation-review.png`.

## Conversion

- Le squelette de référence est `public/characters/xbot/Xbot_official.glb`. Les GLB produits contiennent uniquement ses articulations et un clip, sans maillage, matériau ni texture.
- Blender évalue les FBX en coordonnées monde Z-up ; l'import les convertit en Y-up et en mètres. La calibration utilise les positions des articulations de la pose de repos, pas les extrémités arbitraires des os FBX. Les rotations de repos, les bras en A-pose, les différentes chaînes de colonne vertébrale et les animations du bassin porté par l'objet armature sont compensés.
- La cadence native, les deux extrémités du clip et les trajectoires verticales sont conservées. Le déplacement horizontal initial est recentré ; les déplacements suivants restent présents. La hauteur de référence du bassin provient de la géométrie des jambes du rig source.
- Les exports équivalents de format ou de rig et les poses de calibration sont exclus. Les variantes IP/RM sont conservées. La déduplication compare exactement le contenu binaire des pistes converties, indépendamment du nom de fichier.
- Chaque personnage d'un FBX comportant plusieurs humains reçoit une animation distincte, identifiée par son rôle. Ces clips restent individuels ; ils ne créent pas d'activité IA à deux.
- Le travail intermédiaire et les caches de conversion sont dans `/tmp/room-fab-animations`. Leur clé inclut le contenu du FBX, le rôle et le code de calibration. Une source invalide fait échouer l'import.

`fab-import-report.json` relie les sources et leurs empreintes aux clips importés ou aux exclusions explicites. Le manifeste `src/features/scene/animations/fabManifest.ts` est généré seulement lorsque l'ensemble du lot a été converti avec succès. Les animations sont chargées à la demande par l'application.

## Lecture et IA

Le mode `rest-meters` conserve le déplacement du bassin relativement à la pose de repos debout, y compris pour les sauts, les positions couchées et les relevés. Le mode `world-meters` des duos Inter-X conserve son origine au premier échantillon.

Les catégories et le filtre « Fab / ActorCore » utilisent le registre central. Les tags d'activité sont ajoutés explicitement aux danses, combats et gestes compatibles. Les blessures, relevés, rôles multiples et mouvements nécessitant des accessoires absents restent accessibles manuellement.

Cinq marches disposent également d'une variante sur place, obtenue en retirant leur progression horizontale moyenne tout en conservant les oscillations du bassin. Leur vitesse naturelle est mesurée depuis le déplacement original, en cm/s, et utilisée par la navigation IA.

Les clips ActorCore portent `equipment: 'dual-pistols'`. Lara affiche ses deux pistolets pendant leur lecture, puis retrouve ses préférences d'équipement ; les préférences persistantes ne sont pas modifiées. Les transitions de relevé portent `loop: 'once'`.
