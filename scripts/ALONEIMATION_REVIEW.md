# Aloneimation — correction des 160 sources

Les 160 GLB de `public/animations/aloneimation` ont reçu une correction des
chevilles près du sol et une remontée du bassin lorsque les semelles nominales
traversaient leur plan de référence. Les phases aériennes libres ne sont pas
rabattues au sol. Aucune immobilisation horizontale des appuis n'est inférée.

Les corrections sont échantillonnées à quatre points par intervalle source
(100 Hz pour ces clips à 25 Hz), avec interpolation continue et conservation de
cet échantillonnage pendant le retargeting. Le contrôle des clés et de leurs
milieux mesure encore jusqu'à 3,980 mm de pénétration entre deux clés. Il porte
sur le squelette source et des semelles nominales, pas sur chaque mesh cible.

Les pistes STEP d'origine étaient constantes : leur passage en LINEAR ne
corrige pas à lui seul une saccade visible. Les poses rapides existantes sont
conservées, sans filtre de lissage arbitraire.

`anim_ff_cobra_entrance.glb` contenait 25 poses cachées environ 78 m sous le sol,
puis une téléportation de 79,69 m à 1,04 s. Ce préambule est retiré ; l'entrée
qui suit est conservée et sa durée dans le registre passe de 7,3 à 6,3 s.
Chaque autre clip commence désormais à sa première clé, sans attente initiale
de 0,04 s. Les temps relatifs entre les poses sont conservés.

## Validation

- `node scripts/correct-aloneimation.cjs --check` : 160 fichiers vérifiés.
- `node scripts/temp_aloneimation.cjs '/tmp/aloneimation-original'` : comparaison
  avec le snapshot avant correction ; conservation des pistes non concernées,
  des trajectoires horizontales, des durées après coupe, et vérification des
  temps ordonnés et des valeurs finies. Le snapshot est local et non versionné.
- `npx tsc --noEmit` : réussi.
- Tests unitaires `snake-foot-contacts`, `yoga-foot-support`, `yoga-retargeting`
  et `miley-duo-retargeting` : quatre réussites.

Pas de validation visuelle exhaustive des 160 animations sur les personnages.

## Réexécution

`node scripts/correct-aloneimation.cjs` mesure sans écrire ; `--write` applique
la correction et actualise les durées du registre. Les fichiers déjà corrigés
sont reconnus par leur métadonnée `aloneimationSupport` et ne sont pas modifiés
une seconde fois. Pour changer l'algorithme, repartir de sources originales.
