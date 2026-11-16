# Prototype Pitbull → Ushiro

Prototype séparé, sans modification des personnages ni des animations de la scène.

- Rig et poids d'Ushiro conservés ; correspondances anatomiques explicites.
- Compensation des poses de référence et des axes par rotations dans l'espace monde.
- Attente, marche et course échantillonnées à la fréquence de la scène source.
- Déplacement vertical du bassin ajusté au rapport de hauteur des bassins.
- Les cinq animations natives sont conservées, avec trois nouveaux clips `Pitbull|Idle`, `Pitbull|Walk`, `Pitbull|Run`.
- `idle.gif`, `walk.gif`, `run.gif` : douze poses par cycle pour examiner le mouvement.

Ce premier transfert est en cinématique directe : pas de verrouillage IK des pattes
sur le sol. Les proportions et la distribution des os diffèrent entre les rigs ;
les appuis doivent encore être corrigés avant utilisation en production.
Ulotte n'est pas modifiée par ce prototype.

Reproduction :

```bash
blender -b --python-exit-code 1 --python scripts/retarget-pitbull-ushiro.py
blender -b --python-exit-code 1 --python scripts/render-ushiro-retarget.py
```
