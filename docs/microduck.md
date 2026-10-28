# Microduck — sources et adaptations

- Produit et photos : https://pollen-robotics.com/microduck/
- Modèle et inférence : https://github.com/pollen-robotics/microduck_rl (branche `develop`, export CPU `scripts/infer_policy.py`).
- Politiques : https://huggingface.co/pollen-robotics/microduck-policies : `velstand.onnx`, `alpha_sitstand.onnx`, `alpha_ground_pick.onnx`, manifeste consulté le 28 octobre 2026.
- Bec : https://github.com/pollen-robotics/microduck/blob/main/duck-control/src/model.rs (`mouth_target`, −5° fermé, +30° ouvert). Le bec est exclu des 14 sorties des politiques.

Les maillages sont de Pollen Robotics, sous [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/), voir `LICENSE-MODELS.md` dans microduck_rl. L’assemblage initial du GLB a été réalisé par Gemini. Cette adaptation conserve cette licence pour le modèle : pièces plastiques rouges, pièces métalliques et noires conservées, animations remplacées. Les photos sont celles de la galerie officielle, dans les coloris du fabricant ; elles ne représentent pas la personnalisation rouge.

## Animations

Les politiques officielles sont exécutées à 50 Hz dans MuJoCo CPU, avec les actuateurs de position XML (`--no-bam`, mode prévu par le script officiel), gravité projetée et commandes 13D. Ce sont des enregistrements de simulation, pas des captures du robot réel. Le test avec BAM M6 à 7,4 V a fait basculer le robot pendant le relevé ; le mode XML a effectué le cycle complet et a été retenu pour cette adaptation visuelle.

- `idle` : posture stationnaire de la politique `velstand`.
- `walk` : un cycle complet mesuré dans `velstand`, commande avant 0,3 m/s ; déplacement effectif de 9,9177 cm/s. La scène emploie cette vitesse mesurée. Le déplacement horizontal et le lacet sont retirés du clip, puisque le placement les pilote. Le dernier échantillon rejoint le premier pour boucler.
- `sit-stand` : drapeau posture à 1, maintien assis pendant 4 s, puis à 0 pour se relever ; clip de 7 s joué une seule fois.
- `grab` : phase officielle sur une période de 4 s, fin de commande à 0,7 (2,8 s), puis retour debout ; clip de 4 s joué une seule fois. Aucun objet n’est attaché au bec.
- `quack` : ouverture visuelle recréée, indépendante des politiques et sans son. La course relative est de 35° sur le pivot hérité de l’assemblage Gemini. Les sources MJCF consultées ne fournissent pas de charnière de bouche animée ; ce pivot et la cadence ne constituent donc pas un mouvement officiel validé.

La marche Gemini utilisait des échantillons dont la provenance n’était pas conservée et une période doublée à 0,8122 s. Elle a été remplacée par un nouveau cycle de 0,42 s issu de la politique officielle actuelle. Le coin-coin Gemini ouvrait à 0,32 rad (~18°) et ajoutait des mouvements de cou sans source ; il a été remplacé par une animation limitée au bec et explicitement identifiée comme visuelle.

Les maillages visuels reçoivent des noms uniques : le fichier initial partageait notamment `bearing_roll` entre un roulement et le pivot de hanche droite, ce qui pouvait cibler le mauvais objet pendant l’animation.

Chaque clip définit les 14 articulations, la position et l’orientation du tronc, et le bec : changer de mouvement ne laisse aucune articulation dans la pose précédente. Les surfaces visibles des semelles sont ramenées au sol à chaque échantillon, car elles diffèrent des enveloppes de collision du simulateur.

## Reproduire l’export

Dans un environnement Python contenant `numpy`, `scipy`, `mujoco` et `onnxruntime`, télécharger le dépôt RL et les trois fichiers ONNX indiqués ci-dessus, puis :

```bash
python scripts/import-microduck-motion.py /chemin/microduck_rl /chemin/politiques /tmp/microduck-motion.json
node scripts/import-microduck-motion.mjs /tmp/microduck-motion.json
```

Le second script met à jour `public/models/microduck.glb` en conservant les maillages et leurs pivots. La conversion mètres → centimètres et l’orientation +X → +Z restent dans le composant React.

Photos téléchargées depuis `/assets/microduck/gallery/` sur le site officiel : `closeup.webp`, `desk.webp`, `kickabout.webp`, `walkabout.webp`.
