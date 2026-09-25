# Appartement 3D — Guide pour Gemini / Antigravity

Fichier de directives pour l'assistant IA Gemini. Ce document liste les règles de développement, les repères 3D, les commandes de validation et les conventions du projet.

## Commandes du projet

```bash
npm install
npm run dev          # Lancer le serveur local (http://localhost:5173)
npm run build        # Compiler pour la production
npx tsc --noEmit     # Vérifier la validité des types TypeScript
```

## Repères et Échelle 3D

- **Échelle** : 1 unité = 1 cm.
- **Axes** :
  - **X** (rouge) = largeur de la pièce, de 0 à ROOM_W (300 cm)
  - **Y** (vert) = hauteur, de 0 à 250 cm (`WALL_H = 250`)
  - **Z** (bleu) = profondeur de la pièce, de 0 à ROOM_D (400+ cm)
- **Murs** : A (X=0), B (X=ROOM_W), C (Z=0), D (Z=ROOM_D)

## Stack & Architecture

- **Technologies** : React 18 + Three.js + `@react-three/fiber` (R3F) + `@react-three/drei` + Vite + TypeScript.
<!--- **Aliases d'importation** :
  - `@shared/*` → `src/*` (types et configurations partagés)
  - `@features/*` → `src/features/*` (domaines fonctionnels)
  - `@config` → `src/config.ts` (constantes de la pièce)-->

<!--## Règles d'implémentation des items (`src/features/scene/items/`)

Chaque meuble ou objet interactif est un composant autonome implémentant l'interface `SceneItemProps` :
- **Coordonnées locales** : Centré en X/Z, base au sol à Y=0 (ou sur la surface d'appui).
- **Placement monde** : Géré uniquement par le parent dans `Placements.tsx` (via un `<group position rotation>`), jamais hardcodé dans le composant de l'item.
- **Gestion des GLB multiples** : Utiliser `useGLTFClone` (`@features/scene/utils/useGLTFClone`) pour éviter de partager le même objet 3D mutable entre plusieurs instances.
- **Calcul des dimensions (Pattern B)** :
  - Toujours utiliser `glbLocalBBox(scene)` pour obtenir la Bounding Box locale en ignorant les transformations du parent.
  - Toujours faire `scene.scale.set(1, 1, 1)` au tout début du `useLayoutEffect` avant de lire la Box pour éviter les corruptions de scale lors des remounts liés à Suspense.
  - Appeler `onSize(dimensions)` à la fin de l'effet.-->

<!--## États UI et Synchronisation (Événements)

Les actions utilisateur (allumer une lampe, ouvrir une porte, changer la vitesse du ventilateur) sont transmises via des `CustomEvent` nommés `furniture-toggle` :
```ts
document.dispatchEvent(new CustomEvent('furniture-toggle', { detail: { key, value } }))
```
- Pour écouter ces états de manière factorisée, utiliser le hook `useFurnitureToggles` dans `Placements.tsx`.
- Pour les animations R3F (`useFrame`), synchroniser l'état réactif dans des refs locales (ex. `const isPowerOnRef = useRef(false)`) afin d'éviter les closures obsolètes dans la boucle d'animation.-->

## Signatures des Commits Git

Pour différencier l'origine des commits (IDE vs CLI/agy), toujours ajouter le co-auteur correspondant en pied de message de commit :
- **IDE (Desktop App)** : `Co-authored-by: Antigravity Agent (IDE) <antigravity-agent-ide@deepmind.google>`
- **CLI (Terminal / antigravity-cli / agy)** : `Co-authored-by: Antigravity Agent (CLI) <antigravity-agent-cli@deepmind.google>`

## Directives de communication avec l'utilisateur

- **Format des liens de code pour Zed** : Ne JAMAIS utiliser la syntaxe d'ancre `#L<num>` (comme `file:///path#L96`), car Zed tente de créer un fichier inexistant `path#L96`. Pour ouvrir un fichier à une ligne précise dans Zed, TOUJOURS utiliser le schéma natif avec un libellé propre : `[NomFichier.tsx:Ligne](zed://file/chemin/absolu:Ligne)`.
- **Validation** : Toujours lancer `npx tsc --noEmit` après avoir modifié du code pour garantir l'absence d'erreurs de typage.
- **Commit automatique** : L'agent DOIT toujours commiter ses modifications de code via `git commit` à chaque fois qu'une réponse est envoyée, sans attendre d'instruction explicite.
- **Exécution de scripts / Règle Anti-Spam `node -e`** : Ne JAMAIS lancer de commandes inline répétitives de type `node -e "..."` qui demandent à l'utilisateur de valider chaque commande une par une. Toujours écrire le script dans un fichier temporaire réutilisable (`scripts/temp_inspect.cjs` ou similaire), puis exécuter ce fichier avec `node scripts/temp_inspect.cjs`. De cette façon, l'utilisateur ne valide l'autorisation d'exécution qu'une seule fois pour toute la conversation. Supprimer le fichier temporaire une fois l'analyse terminée.

## Économie de quota et limitation d'investigation

> [!CAUTION]
> **Interdiction absolue du micro-découpage de lecture (Anti-Pattern des 20 lignes)** :
> Ne JAMAIS morceler les lectures de fichiers en blocs de 15 à 30 lignes successifs. C'est un piège absurde et inefficace :
> - **Le piège du modèle** : Quand un LLM cherche un morceau de code précis sans vue globale, son réflexe paranoïaque est d'inspecter 20 lignes autour de la cible, puis 20 lignes plus bas, entrant dans une boucle infernale de micro-lectures.
> - **L'effet pervers sur le contexte et les tokens** : Chaque appel d'outil génère un tour de boucle complet (entrée/sortie d'outil + renvoi de tout l'historique au modèle). Faire 25 lectures de 20 lignes consomme **infiniment plus de tokens, de temps et de quota d'appels API** que de lire une seule fois 400 ou 800 lignes d'un coup ! C'est extrêmement coûteux et contre-productif.
> - **Règle impérative** :
>   - Si un fichier fait moins de 800 lignes, le lire en un seul appel `view_file` (ou cibler précisément avec `grep_search`).
>   - Si une plage est nécessaire, utiliser des plages larges de **100 à 300 lignes minimum**.
>   - L'utilisateur en tant que développeur doit surveiller ce comportement et interrompre l'IA si elle retombe dans ce travers.

- **Lectures efficaces** : Utiliser des plages de lecture larges (100 à 300+ lignes) lors des appels `view_file`.
- **Budget d'outils par tour** : Ne JAMAIS dépasser 6 à 8 appels d'outils au total par message utilisateur. Si une analyse nécessite plus d'étapes, s'interrompre et faire un point avec l'utilisateur au lieu de boucler.
- **Interdiction absolue d'explorer `node_modules`** : Se concentrer exclusivement sur le code du projet (`src/`). Ne jamais lire ou parcourir les dossiers de dépendances externes.
- **Action directe** : Dès qu'une piste ou une cause probable est identifiée, appliquer la correction et tester immédiatement au lieu de sur-analyser.
