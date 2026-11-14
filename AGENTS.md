# Appartement 3D — Directives pour les agents IA

Fichier de directives pour tous les assistants IA. Ce document liste les règles de développement, les repères 3D, les commandes de validation et les conventions du projet.

Pour **Codex**, lire uniquement `AGENTS.md` comme fichier de directives du projet ; ne jamais lire `GEMINI.md` ni `Gemini.md`.

## Commandes du projet

```bash
npm install
npm run dev          # Lancer le serveur local (http://localhost:5173)
npm run build        # Compiler pour la production
npx tsc --noEmit     # Vérifier la validité des types TypeScript
```

En développement, chaque chargement de page crée un journal JSONL distinct dans `/tmp/room-3d-logs/`, nommé avec la date et l'identifiant de session. Le lien `/tmp/room-3d-logs/latest.jsonl` désigne le dernier chargement. Lecture en direct : `tail -F /tmp/room-3d-logs/latest.jsonl`. Analyse : `node scripts/analyze-navigation-logs.cjs` (ou ajouter le chemin d'une session). La session reste identique pendant HMR ; un rechargement crée une nouvelle session. Les logs incluent les événements `appLog`, les exceptions navigateur avec leurs causes, les calculs de navigation et un état détaillé des PNJ chaque seconde. Les filtres et la fermeture de la console UI n'affectent pas cet enregistrement. Recharger les onglets déjà ouverts après installation ; les événements antérieurs ne sont pas récupérés. Les journaux restent présents après redémarrage de Vite, jusqu'au nettoyage de `/tmp`.

Les journaux sont limités à **500 Mio au total**. Le collecteur supprime les plus anciens au démarrage et avant chaque écriture qui dépasserait ce budget. Une session longue peut donc repartir sur un journal neuf ; `latest.jsonl` pointe vers le chargement le plus récent encore conservé. Un événement dépassant à lui seul le budget est rejeté avec une erreur explicite.

## Repères et Échelle 3D

- **Échelle** : 1 unité = 1 cm.
- **Axes** :
  - **X** (rouge)
  - **Y** (vert)
  - **Z** (bleu)
- **Norme Sol Jardin / Extérieur** :
  - Le sol du jardin (herbe `BermudaGround`, dalles/terrasse extérieure) est aligné au niveau fini **Y = 0** (plain-pied avec le studio).
  - Tout le mobilier de jardin (baignoire balnéo, canapés, banc coffre, pots, statues, gamelles) et les personnages (PNJ, animaux) reposent et se déplacent au sol à **Y = 0**, éliminant tout décalage vertical ou flottement.

## Stack & Architecture

- **Technologies** : React 19 + Three.js + `@react-three/fiber` (R3F) + `@react-three/drei` + Vite 8 + TypeScript 6.

Chaque meuble ou objet interactif est un composant autonome implémentant l'interface `SceneItemProps` :
- **Coordonnées locales** : Centré en X/Z, base au sol à Y=0 (ou sur la surface d'appui).
- **Placement monde** : Géré uniquement par le parent dans `Placements.tsx` (via un `<group position rotation>`), jamais hardcodé dans le composant de l'item.
- **Gestion des GLB multiples** : Utiliser `useGLTFClone` (`@features/scene/utils/useGLTFClone`) pour éviter de partager le même objet 3D mutable entre plusieurs instances.
- **Calcul des dimensions (Pattern B)** :
  - Toujours utiliser `glbLocalBBox(scene)` pour obtenir la Bounding Box locale en ignorant les transformations du parent.
  - Toujours faire `scene.scale.set(1, 1, 1)` au tout début du `useLayoutEffect` avant de lire la Box pour éviter les corruptions de scale lors des remounts liés à Suspense.
  - Appeler `onSize(dimensions)` à la fin de l'effet.-->

## Directives UI & Styling

### Actions des objets 3D

- Déclarer les associations objet/actions dans `src/features/scene/objectActions.ts` et les libellés, clés d'état et comportements dans `src/features/scene/objectActionRegistry.ts`.
- Utiliser le même identifiant d'action dans les composants, les événements et les états de la scène ou de la preview, avec les mêmes libellés et comportements. La scène, les previews 3D et les filtres de l'inventaire doivent utiliser ce registre commun. Ne pas réintroduire de listes d'actions dans les données de l'inventaire ou de table de libellés dans `previewRegistry.tsx`.
- Les placements peuvent ajouter leurs interactions IA contextuelles aux actions communes. Les commandes de déplacement dans l'appartement restent réservées à la scène.
- Les composants reçoivent `isPreview` pour lire les états locaux de la preview sans affecter la scène.

### Styles

- **Bootstrap au maximum** : Toujours privilégier les classes utilitaires et composants Bootstrap (`btn-sm`, `form-control-sm`, `form-select-sm`, `small`, `gap-*`, `p-*`, `m-*`, `w-auto`, etc.).
- **Styles in-line restreints** : N'utiliser les styles in-line (`style={{ ... }}`) que si c'est réellement indispensable (ex. positionnement absolu dynamique, dimensions calculées dynamiquement). Ne jamais utiliser de styles in-line arbitraires (notamment `fontSize`, espacements ou dimensions fixes au hasard) lorsqu'une classe Bootstrap équivalente existe.

## Signatures des Commits Git

Toujours ajouter en pied de message de commit le co-auteur correspondant à l'agent qui a réellement réalisé les modifications :
- **Codex (OpenAI, CLI ou application)** : `Co-authored-by: Codex <noreply@openai.com>`
- **Antigravity IDE (Desktop App)** : `Co-authored-by: Antigravity Agent (IDE) <antigravity-agent-ide@deepmind.google>`
- **Antigravity CLI (Terminal / antigravity-cli / agy)** : `Co-authored-by: Antigravity Agent (CLI) <antigravity-agent-cli@deepmind.google>`

Le terminal ou l'IDE utilisé ne détermine pas l'identité de l'agent. Codex ne doit jamais signer comme Antigravity.

## Directives de communication avec l'utilisateur

- **Format des liens de code pour Zed** : Ne JAMAIS utiliser la syntaxe d'ancre `#L<num>` (comme `file:///path#L96`), car Zed tente de créer un fichier inexistant `path#L96`. Pour ouvrir un fichier à une ligne précise dans Zed, TOUJOURS utiliser le schéma natif avec un libellé propre : `[NomFichier.tsx:Ligne](zed://file/chemin/absolu:Ligne)`.
- **Chemins complets des `.glb`** : Lorsqu’un fichier `.glb` est créé, modifié ou mentionné pour inspection, toujours afficher son chemin absolu complet sur disque (en texte clair et cliquable `file:///chemin/absolu.glb`, ex. `/home/dinatih/Projects/room-3d/public/characters/clothing/lara_hoodie_zip.glb`) pour permettre son ouverture directe.
- **Validation** : Toujours lancer `npx tsc --noEmit` après avoir modifié du code pour garantir l'absence d'erreurs de typage.
- **Interdiction de `git commit -a` / `--all`** : Ne JAMAIS commiter avec `-a`, `--all` ni `git add -A` / `git add .`. Toujours indexer explicitement uniquement les fichiers modifiés par la tâche (`git add <fichier>…`), vérifier avec `git status --short` et `git diff --cached --stat`, puis `git commit` sans `-a`. Les modifications d'autres agents ou préexistantes ne doivent jamais être embarquées.
- **Commit automatique obligatoire** : Avant chaque réponse finale, l’agent DOIT commiter toutes les modifications réalisées pendant le tour via `git commit`, sans attendre d’instruction explicite. Cette règle couvre aussi les modifications de documentation et de configuration. Ne pas créer de commit vide et ne pas inclure les modifications préexistantes étrangères à la tâche.
- **Exécution de scripts (`node` / `python`)** : Éviter d'enchaîner des commandes inline `node -e "..."` ; préférer un script fichier dédié (ex. `scripts/temp_inspect.cjs`) exécuté avec `node scripts/temp_inspect.cjs` pour limiter les demandes de validation.

## Simplicité du code, Anti Over-Engineering & Échec Explicite (Fail Fast)

- **Pas de rétrocompatibilité** : Ce projet ne nécessite pas de rétrocompatibilité. Lors d’une modification, mettre à jour directement les références concernées et supprimer le code obsolète, sans conserver d’alias, de fallbacks ou de couches de compatibilité pour les anciens comportements.
- **Interdiction de l'over-engineering** : Ne jamais ajouter de surcode, de couches d'abstraction superflues ou de logique alambiquée là où une solution simple, directe et idiomatique existe (Three.js, React). Aller au plus court et au plus robuste.
- **Proscription des constantes magiques et filtres arbitraires** : Ne JAMAIS introduire de valeurs en dur arbitraires (ex. seuils de distance arbitraires, plafonds artificiels de boucles ou de particules comme `slice(0, 14)` ou `< 55`) inventées pour masquer un symptôme sans traiter la cause racine.
- **Pas d'erreurs silencieuses (Fail Fast)** : Éviter les garde-fous artificiels qui étouffent ou dissimulent les données invalides ou les comportements anormaux. Si des données sont invalides, l'erreur doit se manifester ou remonter explicitement afin d'être identifiée et corrigée à la source, plutôt que d'être masquée silencieusement par un filtre cosmétique.

## Tests navigateur Codex

- Utiliser `scripts/browser-test-options.cjs` pour lancer Puppeteer dans les tests (import par défaut en ESM, `require` en CommonJS). Le lanceur impose headless, ajoute `--codex-browser-test=room-3d` et transmet stderr/stdout Chromium aux logs du test.
- `--headed` est réservé à une demande explicite de fenêtre visible de l'utilisateur. Un test GPU ou de profilage ne constitue pas une autorisation. Garder headless aussi avec `--hardware-gpu` ; sélectionner Wayland seulement avec `--headed`.
- Tout nouveau test Playwright ou lancement direct Chromium doit appliquer la même règle et le même marqueur ; aucun lanceur Playwright n'est présent actuellement.
- La surcharge utilisateur `~/.config/systemd/user/omarchy-crash-watch.service.d/codex.conf` lance `~/.local/bin/omarchy-crash-watch-codex`. Ses sources sont `scripts/omarchy-crash-watch` et `scripts/omarchy-crash-watch.conf`. Seuls les événements de navigateurs portant ce marqueur sont privés de notification ; systemd-coredump reste inchangé. Les exclusions sont journalisées dans `journalctl --user -u omarchy-crash-watch.service`.
- Vérification réelle : `node scripts/temp_browser_nuisance_check.cjs` ; log `/tmp/room-browser-verification.log`. Pour enregistrer aussi stderr Chromium : `node scripts/temp_browser_nuisance_check.cjs > /tmp/room-browser-test.log 2>&1`.
- **Vérification rapide (obligatoire pour éviter les tests de plusieurs minutes)** :
  - **Inspection visuelle des `.glb` (coupe, coutures, normales, ajustement)** : effectuer un rendu hors-ligne rapide dans Blender (Face + 3/4 + Dos en ~3–5 s) au lieu de relancer le Studio complet pour chaque modèle.
  - **Tests navigateur WebGL / React** : préférer un `<Canvas>` isolé minimal ou **1 seul chargement** du Studio avec `--hardware-gpu` (Vulkan `/dev/dri/renderD128` via `scripts/browser-test-options.cjs`), les calques lourds désactivés (`&furniture=0&decor=0&furnishings=0&animals=0&shadows=0`), le blocage immédiat des requêtes réseau externes hors `localhost`/`127.0.0.1`, et le changement de variantes en mémoire (`useSceneStore.getState().setLaraClothing(...)` / `setLayers(...)`) plutôt que de recharger plusieurs fois la scène complète.
