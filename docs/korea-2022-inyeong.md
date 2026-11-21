# Maillot Corée 2022/23 — INYEONG 24

Référence : maillot domicile Nike 2022/23, rouge avec col polo noir, manches
à motif tigre, Swoosh et écusson tigre KOREA noirs. Le cercle Taegeuk bleu
procédural a été supprimé. Personnalisation conservée : INYEONG et 24 noirs
au dos, petit 24 devant ; pas de logo Stüssy.

Références consultées :
- https://about.nike.com/en/newsroom/releases/introducing-nike-s-2022-men-s-national-team-collections/1000
- https://aztecasoccer.com/products/nike-mens-korea-2022-23-home-jersey-global-red-black
- Trois photos fournies par l’utilisateur (domicile 2022, dont variante Stüssy et HM SON 7).

Le corps est une coque cousue ouverte au col, aux manches et à l’ourlet.
Blender Cloth calcule 90 images de gravité avec auto-collision et appuis aux
épaules. Le col polo renforcé est une pièce structurée distincte. Le résultat
est figé pour le navigateur ; les UV et le flocage suivent les plis.
Les manches et logos reprennent les photos produit ; les couleurs sont sans
bleu. Les dimensions sont estimées, puis mesurées sur le modèle final.

Le fichier inclut le cintre SPRUTTIG : aucun second cintre ne doit être ajouté
par le placement. Le sommet du crochet est l’origine de fixation en scène.
Le modèle est écarté du mur pour laisser passer l’épaisseur du tissu.

```bash
python scripts/korea-2022-textures.py
blender -b --python-exit-code 1 --python scripts/generate-korea-2022.py
npx tsc --noEmit
ROOM_TEST_URL=http://127.0.0.1:5174 node scripts/check-korea-2022.cjs --hardware-gpu
```

Le fichier Blender conserve le résultat figé et les textures embarquées ;
le script Python conserve la construction et la simulation reproductibles.
Les rendus face, trois-quarts et dos servent aussi de photos d’inventaire.
