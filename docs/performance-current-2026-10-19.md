# Contrôle après les corrections du 19 octobre, vers 23 h

Une seule capture actuelle à 15 PNJ, Low, Chromium headless, Radeon 840M
confirmée via ANGLE/Vulkan. Les autres applications restent ouvertes.
Commande :

```bash
ROOM_PROFILE_OUT=/tmp/room-perf-current-2026-10-19 ROOM_PROFILE_COUNTS=15 node scripts/profile-npc-startup.cjs --hardware-gpu --serve
```

La capture a été interrompue volontairement après le lancement de la scène :
la RAM disponible était descendue d'environ 5,2 Gio à 549 Mio, avec 10 Gio de
swap occupés. Après fermeture du seul navigateur de test, elle remonte à 5,8 Gio.
`vmstat` relève jusqu'à 267 828 Kio/s d'entrées et 929 612 Kio/s de sorties vers
le swap. Le navigateur de diagnostic contribue lui-même à cette pression.

Sur 105 relevés espacés d'une seconde, l'utilisation globale du GPU varie de
15 à 87 % (moyenne 57 %). La fenêtre comprend le lancement et la période suivant
l'arrêt du navigateur. Elle ne mesure ni le coût de YouTube ni celui d'un agent.
Elle ne montre pas une saturation GPU permanente.

Le lancement est détecté au sondage à 54,6 s ; une tâche de 3 944 ms est observée.
Le profil CPU du lancement conserve notamment environ 1,55 s inclusives dans
`useGLTFClone`, dont 1,05 s dans la préparation du culling animé, et plusieurs
chemins de transferts de textures et de premiers usages de shaders. Ces coûts
s'imbriquent et ne s'additionnent pas. Le temps `(program)` ne distingue pas
GPU, pilote, attente système et swap. Aucun coût ne peut être isolé proprement
avec cette pression mémoire ; aucune optimisation applicative n'en est déduite.

Il n'y a pas de fenêtre stable complète ni de comparaison avant/après valable.
L'erreur `TargetCloseError` du journal provient de notre fermeture volontaire.
Le navigateur et le serveur de test sont arrêtés. Artefacts :
`/tmp/room-perf-current-2026-10-19/`, `/tmp/room-perf-current-report.txt`,
`/tmp/room-perf-host-{gpu,vmstat}.log`.

Nettoyage : suppression du test de pattes ajouté en double et de son oracle
reconstruit par remplacement de source. Le contrôle existant
`node scripts/test-scene-performance.cjs` passe (100 000 sommets, écart maximal
7,2e-15), ainsi que TypeScript et les 37 tests unitaires. Les modifications
applicatives du dernier complément n'ajoutaient aucune abstraction et restent
en place. Aucun gain global de FPS n'est annoncé.
