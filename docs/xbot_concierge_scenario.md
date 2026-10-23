# Scénarios et activités autonomes

Deux parcours sont construits à la demande dans `scenarios.ts`. Chaque personnage
possède ses propres instructions ; aucun tableau de scénario mutable n'est partagé.

## Visite guidée

Le bouton du personnage actif lance une seule visite depuis sa position réelle.
Les Smart Objects publics actifs sont collectés au lancement, y compris les points
de danse, de duo, les destinations voisines et les objets sans actions. Le prochain
objet est le plus proche en position monde (égalité départagée par identifiant).

`OBSERVE_OBJECT` rejoint une approche libre, regarde l'objet pendant 2 secondes,
sans action, réservation de slot ou invitation duo. Les transformations et obstacles
actuels déterminent l'approche ; une destination inaccessible reste explicitement
bloquée. La visite se termine par un retour au départ, puis le fonctionnement
habituel reprend. Elle ne boucle jamais.

## Concierge Xbot

La ronde automatique en boucle suit : entrée extérieure → couloir → salle de bain
→ séjour → jardin → repos 2 mètres devant les 5 mannequins / squelettes du jardin.
Chaque zone reçoit une inspection visuelle à 360° de 3 secondes. Aucun équipement
n'est utilisé et aucune tâche ménagère n'est exécutée.

Au repos, Xbot observe les mannequins (`looking`) pendant 90 secondes avant la ronde suivante.
Le Smart Object `xbot-garden-rest` est positionné à `[410, 0, -500]` orienté face au nord (`rotY: Math.PI`)
et porte `ownerCharacterId: 'xbot'`. Cette restriction permanente s'applique même lorsque
Xbot est absent ou a libéré ses réservations ; elle n'interdit pas le passage.

## Activités libres

`autonomousActivities.ts` conserve les activités aléatoires et les affectations
initiales des autres PNJ, utilisées également pour les interactions duo. Les objets
privés interdits au personnage sont exclus de la sélection. Les ordres directs,
les recherches de slots et les réservations appliquent le même contrôle d'accès.

## Vérification

Avec Vite lancé sur le port 5186 :
`node scripts/temp_kitchen_navigation_check.cjs --browser --scenarios-only`.
Ce test headless charge le mobilier réel, vérifie une visite complète, les objets
occupés, les points duo, les ordres refusés et deux rondes avec repos de 90 secondes.
