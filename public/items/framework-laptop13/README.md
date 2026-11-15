# Framework Laptop 13 — source Blender

`framework-laptop13.blend` est la source éditable ; `framework-laptop13.glb` est l'export utilisé dans l'application. Le CAD d'origine est conservé dans la collection masquée **CAD reference — original (not exported)**. La collection **Export** contient les pièces modifiées et nettoyées ; **Preview rig (not exported)** contient caméra et éclairages.

Disposition en regardant le clavier, écran en haut :

| | Gauche | Droite |
| --- | --- | --- |
| Arrière / charnière | USB-C rouge mat opaque | USB-C rouge mat opaque |
| Avant / utilisateur | HDMI | USB-A |

Les objets `Expansion_*` portent leurs vrais rôles. Dans le CAD d'origine, la pièce nommée `SD_CARD` désigne la géométrie USB-C retenue ; elle a été dupliquée et orientée pour les deux côtés. La pièce d'origine nommée `USBC_CARD` est remplacée dans Export. Le bezel et les cartes USB-C partagent le matériau `Framework matte red` (sRGB #cc0000, roughness 0,7, opaque). La référence fabricant pour la carte rouge est [Framework USB-C Expansion Card](https://frame.work/products/usb-c-expansion-card?v=FRACCQ0004) ; le rendu opaque mat suit la demande de l'utilisateur.

Les coordonnées Blender sont en mètres : X droite, Y vers la charnière, Z vertical. Les transformations et dimensions du laptop restent celles du CAD. La mise à l'échelle vers les centimètres est effectuée par le composant Laptop.

Après modification et enregistrement du `.blend`, depuis la racine du dépôt :

```bash
blender -b -noaudio -t 4 --python scripts/export-framework-laptop.py
npx tsc --noEmit
node --test --test-isolation=none --test-concurrency=1 tests/unit/laptop-asset.test.cjs tests/unit/laptop-preparation.test.cjs tests/unit/glb-source-lifetime.test.cjs
```

L'export sélectionne uniquement Export, fusionne par matériau, enlève les données inutilisées et compresse sans quantification Draco. Il vérifie les attributs et indices après décodage. Les pièces restent séparées dans le `.blend` pour l'édition. Ne pas réintroduire le placement des ports ou la couleur du bezel dans le code React.

`scripts/configure-framework-laptop.py` documente la création initiale depuis un GLB CAD non compressé : configuration des ports, analyse des faces masquées par rayons, dissolution des subdivisions coplanaires, conservation du CAD et rendus comparatifs. Pour les modifications suivantes, éditer le `.blend` puis utiliser le script d'export, sans relancer cette configuration sur le modèle déjà modifié.

Le modèle final contient 162 794 triangles et six primitives matériau ; l'écran vidéo de React est séparé. Le nettoyage des faces par échantillonnage doit être vérifié visuellement si la géométrie ou les positions changent. Voir `docs/gestion-des-perfs.md` pour les mesures, limites et comparaison avec l'ancien traitement à l'exécution.
