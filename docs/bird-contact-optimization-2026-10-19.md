# Appuis du rouge-gorge : travail répété réduit

Le profil précédent relevait environ 3,21 s inclusives dans le callback du
rouge-gorge sur sa fenêtre de mesure (`freeze-regression-2026-10-19.md`).
Deux calculs inutiles ou répétés ont été supprimés :

- Sur une mangeoire, `resolveBirdPerch` ne calcule plus la boîte complète du
  support : la hauteur de départ des rayons utilise déjà la position du perchoir.
- La mesure des pattes compose une fois par mesh les matrices de retour au
  repère du modèle, au lieu d'appliquer deux matrices par sommet de patte.

Le test unitaire contrôle l'absence de calcul de boîte sur une mangeoire,
son déplacement et son masquage. Le test comparatif ajouté initialement (30 poses,
écart inférieur à 1e-10) a été retiré : `scripts/test-scene-performance.cjs`
compare déjà le skinning des pattes à Three.js sur 50 poses avec morphs et échelles
non uniformes. Aucun appui ni état animé n'est mis en cache.

Validation initiale : `npx tsc --noEmit`, `npm test` (38 tests). Le nombre d'opérations
diminue ; aucun gain global de FPS ou de durée des freezes n'est mesuré ici.
