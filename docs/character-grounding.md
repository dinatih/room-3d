# Origine des personnages supplémentaires

Les GLB et `.blend` de Lewis, David, Alex et Mannequin ont désormais leur sol à
l'origine. Le décalage initial était respectivement de −36,495, −44,304,
−38,406 et −42,825 cm. James était déjà correctement placé.

La normalisation déplace les positions du maillage et la position de repos des
hanches, puis adapte les matrices inverses de liaison. Les textures et matériaux
sont conservés ; Draco est réencodé avec une précision de 20 bits. Les fichiers
Blender contiennent la même origine et une pose de repos sans déplacement résiduel.

Outils de préparation des sources :

```bash
node scripts/ground-extra-characters.cjs
blender --background -noaudio --python-exit-code 1 --python scripts/ground-extra-characters.py
```

L'élévation automatique dans `Character.tsx` a été supprimée après contrôle des
modèles du catalogue : aucune compensation de hauteur par personnage ne subsiste.
Le test `tests/unit/character-grounding.test.cjs` contrôle les cinq modèles, leur
sol natif, leurs matrices de liaison et le retargeting assis/allongé, y compris
après sérialisation vers le worker.
