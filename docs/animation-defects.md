# Défauts récurrents des animations : diagnostic et suivi

État au 23 octobre 2026. Ce document conserve les problèmes observés, les
corrections et leurs limites pour les prochains imports. Les cas ACCAD concernent
les sept GLB de `public/animations/npz/accad/` ; ils ne constituent pas une
validation de toutes les sources du catalogue.

## Symptômes à distinguer

| Défaut | Manifestation | Cause ou piste de diagnostic | Traitement |
| --- | --- | --- | --- |
| Dorsiflexion persistante | Talon au sol, orteils relevés pendant l'appui | Biais mocap déjà présent dans la source, ou mauvais repère de semelle à l'import | Corriger le biais de cheville pendant l'appui, conserver les pieds levés et le déroulé des orteils. |
| Décalage vertical constant | Personnage toujours trop haut ou trop bas | Origine du modèle, unités ou sol nominal du clip | Corriger l'origine ou le décalage après mesure des appuis. |
| Enfoncement pendant la flexion | Pieds qui traversent le sol quand le bassin descend | Translation du bassin et chaîne des jambes ne maintiennent pas la hauteur d'appui ; défaut possible dès le GLB source | Corriger la hauteur pendant les phases d'appui, puis vérifier après retargeting. Un décalage constant ne suffit pas. |
| Patinage horizontal | Pied posé qui avance ou recule pendant que le personnage se baisse | Translation horizontale du bassin et rotations des jambes sans contrainte de contact fixe ; proportions différentes après retargeting possibles | Identifier les contacts, mesurer la dérive X/Z, ancrer le pied pendant l'appui et adapter bassin/jambes par cinématique inverse. |
| Tours complets de cheville | Pied qui tourne progressivement sur lui-même | Correction cumulée entre échantillons ; vérifier aussi normalisation et interpolation des quaternions | Repartir de la rotation source à chaque échantillon, contrôler l'écart angulaire avec l'original. |
| Défaut entre deux images | Clés correctes mais pénétration ou glissement en lecture | Interpolation, pistes désynchronisées ou réduction de fréquence | Évaluer aussi les temps intermédiaires et le clip réellement utilisé après retargeting. |

## Cas ACCAD : ce qui est confirmé

### Enfoncement pendant le ramassage

Sur `anim_pickup_box_floor_male.glb`, à `61 / 30` secondes, le plan d'appui
nominal descendait d'environ **4,84 cm** sous zéro avant la correction dynamique.
La mesure a été faite sur le squelette source, sans Lara ni Xbot : le défaut
n'était donc pas uniquement causé par le retargeting.

La première correction alignait seulement le sol médian du clip et laissait
subsister cette variation. `scripts/correct-accad-feet.cjs` corrige désormais la
translation verticale des hanches à chaque échantillon des six clips debout ou
en déplacement. Le clip couché relâche progressivement la contrainte lorsque
les jambes deviennent horizontales : les pieds ne sont plus les seuls appuis.

La méthode publiée est inscrite dans `asset.extras.accadFootSupport.method` :
`supported-sole-v3`. Les chevilles et les hanches sont échantillonnées à 120 Hz.
Les rotations des autres articulations et la durée restent conservées.

Le contrôle source mesure moins de **0,34 mm** de dérive verticale sur les six
clips debout, en incluant les milieux des intervalles. Il utilise un talon nominal
sous la cheville et le repère des orteils, et non les vertices réels des chaussures.
Ce résultat ne garantit ni l'absence de patinage horizontal, ni le même écart sur
tous les personnages après retargeting et réduction des pistes à 30 Hz.

### Tours complets introduits par le script de correction

Le script modifiait le quaternion de cheville puis comptait sur `AnimationMixer`
pour rétablir la pose source. Quand la valeur source ne changeait pas, le cache
des bindings pouvait empêcher cette réapplication : la correction s'accumulait.

Le calcul repart maintenant de la rotation source à chaque échantillon. Les pistes
sont évaluées directement pour éviter aussi les états résiduels d'une action
arrêtée en fin de clip. Le contrôle compare chaque quaternion corrigé à sa
référence originale et vérifie la borne angulaire de la correction.

### Patinage vers l'avant : encore à corriger

Observation utilisateur : **« Reposer la boîte au sol »**, personnage **Native
(Lara)**, vers l'image **63 / 72**, à environ **2,12 s**, en vue orthographique.
Les pieds semblent avancer pendant la flexion.

La correction verticale actuelle laisse la trajectoire horizontale intacte :
elle garantit une hauteur d'appui, pas un point de contact X/Z fixe. La chaîne
cinématique peut donc déplacer les pieds horizontalement malgré Y = 0.

C'est l'explication mécanique à vérifier pour ce clip. La part exacte provenant
du mocap, de la conversion et des proportions du personnage n'a pas encore été
mesurée. Une capture seule ne permet pas de les départager ni de distinguer un
pas voulu d'un glissement parasite. **Le patinage n'est pas corrigé à ce stade.**

Pour le traiter, relever séparément les phases de contact gauche/droite, puis
comparer les positions monde des talons/orteils sur le GLB source, Xbot et Lara.
Ancrer chaque pied pendant son appui, avec relâchement au lever du pied ; conserver
les pas réels, les pivots et le déplacement voulu du bassin. Deux pieds en appui
peuvent nécessiter une résolution des jambes et du bassin, plutôt qu'une simple
translation globale. Ne pas supprimer toute la trajectoire X/Z pour masquer le
problème.

## Procédure de diagnostic à réutiliser

1. Noter source, identifiant du clip, personnage, temps exact, vue et mode de
   trajectoire. Tester avec une caméra fixe et les repères du sol visibles.
2. Comparer la source avant conversion, le GLB publié et le résultat retargeté.
   Séparer déplacement de l'objet parent, translation des hanches et flexion des
   jambes ; mesurer dans le même repère et avec les mêmes unités.
3. Mesurer hauteur et dérive X/Z des appuis, inclinaison des pieds et quaternions,
   pendant les contacts et entre les clés. Un pied levé ne doit pas être verrouillé.
4. Vérifier les deux côtés, les chaussures visibles, les transitions et la boucle.
   Une moyenne ou médiane correcte peut masquer une mauvaise portion du clip.
5. Tester le résultat réellement lu par l'application, y compris après réduction
   de fréquence, retargeting et passage au worker. Les proportions des jambes et
   la géométrie des semelles peuvent changer les contacts.
6. Conserver une référence originale pour les comparaisons ; régénérer depuis
   cette référence pour éviter d'empiler les corrections.

## Outils et références

```bash
node scripts/temp_accad_ground.cjs
ACCAD_ORIGINAL_DIR=/chemin/vers/les/GLB/originaux node scripts/correct-accad-feet.cjs --check
```

La première commande mesure les appuis des GLB ACCAD publiés. La seconde doit
recevoir un dossier de références originales pour comparer les rotations et les
pistes conservées ; sans ce dossier, la comparaison avec le fichier courant ne
constitue pas une preuve de conservation de l'original.

`--write` régénère les fichiers publiés : utiliser le même dossier de références
originales avec `ACCAD_ORIGINAL_DIR`, puis relancer les contrôles. Les sources
précédant les corrections ACCAD sont accessibles dans Git avant `a324b3c8`.

- [Pieds Inter-X et Fab](foot-retargeting.md) : biais mocap et repères de semelle.
- [Origine des personnages](character-grounding.md) : modèles, bind pose et preview.
- `src/features/scene/retargeting/footContacts.ts` : résolution existante de contacts
  explicitement annotés ; ne pas l'appliquer à des contacts non vérifiés.
- `src/features/scene/retargeting/retargetClip.ts` : transfert des rotations,
  translation des hanches, réduction de fréquence et application des contacts.
