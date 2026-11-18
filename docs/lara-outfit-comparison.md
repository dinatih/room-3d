# Comparaison des tenues de Lara

Ouvrir `/lara-outfit-comparison.html` sur le serveur Vite, ou le bouton « Comparer les tenues de Lara » dans la preview d’une Lara de l’inventaire.

La page utilise les registres existants des vêtements, perruques et animations. Chaque instance possède ses matériaux, son squelette et ses réglages de tenue. La lecture est commune à toutes les instances : pause, vitesse, curseur et pas de 1/30 seconde. Les vêtements sont attachés par `CharacterClothing`, comme dans le studio.

Sélectionner une tenue via son nom dans la grille ou la liste, modifier ses pièces et accessoires, puis la dupliquer pour comparer. Les boutons de catalogue ajoutent tous les hauts, tous les bas ou toutes les perruques. Le zip reste réglable pour chaque tenue. Les boutons de vue orientent tous les personnages ; la souris contrôle la caméra commune. Le mode filaire facilite l’inspection des déformations. Les compositions restent en mémoire jusqu’au rechargement.

Validation : `npx tsc --noEmit`, `npm run build`, puis `LARA_COMPARISON_URL=http://127.0.0.1:5173 node scripts/check-lara-outfit-comparison.cjs --hardware-gpu` avec Vite actif. Le test bloque les requêtes externes, vérifie le chargement, la sélection d’une perruque, la marche et la duplication. Capture dans `/tmp/lara-outfit-comparison.png`.
