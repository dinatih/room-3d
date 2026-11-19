# Linge rouge et accessoires ménagers

Génération reproductible :

```bash
blender -b --python-exit-code 1 --python scripts/generate-laundry-household.py
npx tsc --noEmit
ROOM_TEST_URL=http://127.0.0.1:5173 node scripts/check-laundry-household.cjs --hardware-gpu
```

Le manifeste `scripts/laundry-household-manifest.json` décrit les dimensions
mesurées des modèles en centimètres et le décalage du crochet du séchoir chargé.
Les GLB sont en mètres ; `createStaticGlbItem` les convertit en centimètres.
Les textures de maille et de mousse sont embarquées dans les GLB. Les copies
suspendues réutilisent les maillages drapés, sans simulation dans le navigateur.
Trois vues Blender de chaque modèle sont disponibles dans sa fiche inventaire.

## Références

- Caleçon : https://www.temu.com/fr/g-606349186417358.html — variante **Gris foncé** sélectionnée dans Chrome ; trois photos commerciales conservées. Modèle **rouge** demandé, jambes longues, poche et ouverture avant. Dimensions estimées.
- Chaussettes : création rouge sans référence commerciale fournie ; une paire par modèle, dimensions estimées.
- Cure-dents : https://www.temu.com/fr/g-607656249023717.html — lot de 800, fourche avec fil dentaire et manche antidérapant, boîte de rangement. Le modèle montre une boîte et un bâtonnet. Dimensions estimées.
- Éponge : https://www.temu.com/fr/g-601099697161462.html — mousse blanche, **10 × 6 × 2 cm**, dimensions affichées sur la fiche commerciale. Trois exemplaires représentés, indépendamment du conditionnement de vente.
- Défroisseur : https://www.amazon.fr/dp/B09C6LDJHS — le lien désigne un **Rowenta Access Steam Force DR8250**, nommé « Calor » dans la demande. Reconstitution anthracite et argent avec semelle, sorties vapeur, gâchette, réservoir et cordon. Dimensions estimées ; profondeur mesurée cordon compris.

## Inventaire et placements

Les fiches existantes des chaussettes, caleçons et cure-dents sont complétées,
sans doublons. Les 20 caleçons déjà inventoriés restent en stock ; dix sont
suspendus. Les dix paires de chaussettes sont toutes suspendues, deux chaussettes
par pince, sur la rangée opposée aux caleçons. Le séchoir 20 pinces quitte les
achats futurs et devient un objet possédé, sur la barre basse du MACKAPÄR.
Le sommet mesuré de cette barre est à 122,08 cm ; le placement corrige le
décalage du crochet dans les limites du modèle et l'épaisseur du fil.

Une éponge est dans le STACKSTOD rouge du DRÖNA Ouest, une sur le fond du meuble
bas SDB Ouest, une dans un second PLOGSVÄNG sous l'évier cuisine. La quantité de
PLOGSVÄNG passe à deux. Le défroisseur repose sur la tablette du placard SDB,
devant les rouleaux WC et à gauche des essuie-tout. Aucun emplacement nouveau
n'a été demandé pour les cure-dents ; leur fiche garde le placard cuisine.

Le test utilise un Canvas isolé avec réseau externe bloqué. Il vérifie les
ressources de toutes les fiches, leurs quantités, les dimensions réelles dans
Three.js, la hauteur du crochet et le dégagement du sol et du mur. Capture :
`/tmp/laundry-household-check.png`.
