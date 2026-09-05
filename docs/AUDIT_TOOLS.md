# Guide d'Audit du Code : Volumétrie, Complexité et Maintenabilité

Ce guide documente les outils, commandes et méthodologies utilisés pour mesurer la volumétrie (taille du code, SLOC) et la complexité logicielle (complexité cyclomatique, indice de maintenabilité, Halstead) du projet **room-3d**.

---

## 1. Outils sélectionnés & Rôles

### A. SCC (Sloc, Cloc and Code) ou Tokei
- **Rôle** : Analyseur ultra-rapide de lignes de code source (SLOC).
- **Utilité** :
  - Quantifier le volume réel de code en éliminant les commentaires et les lignes vides.
  - Répartir l'effort par langage (`.ts`, `.tsx`, `.css`, etc.).
  - Calculer une estimation de complexité brute et d'effort COCOMO.
- **Alternative** : `tokei` (écrit en Rust, équivalent en termes de métriques).

### B. es6-plato
- **Rôle** : Outil de visualisation et d'analyse de complexité pour JavaScript / ES6+.
- **Utilité** :
  - **Complexité Cyclomatique (Cyclomatic Complexity)** : Mesure le nombre de chemins d'exécution indépendants dans une fonction ou un module (branches conditionnelles `if`, `switch`, ternaires, boucles).
  - **Indice de Maintenabilité (Maintainability Index - MI)** : Score synthétique (sur 100 ou 171 normalisé) combinant complexité cyclomatique, volume Halstead et lignes de code. Plus le score est élevé, plus le code est facile à maintenir.
  - **Métriques de Halstead** : Difficulté algorithmique, vocabulaire d'opérateurs/opérandes et estimation statistique du risque de bugs.
  - **Rapports visuels interactifs** : Génération d'un site statique HTML avec graphiques d'évolution et jauges de complexité.

---

## 2. Installation manuelle des outils

### Installation de `scc`
- **Arch Linux / Manjaro** :
  ```bash
  sudo pacman -S scc
  ```
- **Debian / Ubuntu** :
  ```bash
  sudo apt install scc
  # ou via binaire GitHub :
  curl -sL https://github.com/boyter/scc/releases/download/v3.4.0/scc_Linux_x86_64.tar.gz | sudo tar -xz -C /usr/local/bin
  ```
- **macOS (Homebrew)** :
  ```bash
  brew install scc
  ```
- **Alternative Rust (`tokei`)** :
  ```bash
  cargo install tokei
  ```

### Installation de `es6-plato`
`es6-plato` s'exécute directement sans installation globale via `npx` :
```bash
npx --yes es6-plato --help
```
Ou installation en dépendance de développement (optionnel) :
```bash
npm install --save-dev es6-plato
```

---

## 3. Commandes d'exécution et génération des rapports

### 3.1. Volumétrie avec `scc`

Pour analyser l'ensemble du projet en excluant les dossiers de build et dépendances :
```bash
scc --exclude-dir node_modules,dist,build,.git
```

Pour cibler uniquement le code applicatif `src/` :
```bash
scc src/
```

Pour afficher le détail par extension ou exporter au format JSON / HTML :
```bash
# Analyse détaillée TypeScript pur (.ts)
scc src/ -i ts

# Analyse composants React (.tsx)
scc src/ -i tsx

# Export HTML
scc src/ --format html > docs/scc_report.html
```

---

### 3.2. Analyse de complexité avec `es6-plato`

Étant donné que `room-3d` est développé en **TypeScript + JSX (TSX)** moderne avec imports directs de `.ts`, `es6-plato` (basé sur le parser Babylon/ESLint ES6) nécessite une transpilation préalable du code JSX/TS vers du JS standard.

#### Étape 1 : Préparation & Transpilation intermédiaire
Une transpilation rapide vers `/tmp/room-3d-transpiled` via `esbuild` (déjà présent dans les dépendances Vite du projet) :

```bash
node -e '
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

function walk(dir) {
  let results = [];
  fs.readdirSync(dir).forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) results = results.concat(walk(file));
    else if (file.endsWith(".ts") || file.endsWith(".tsx")) results.push(file);
  });
  return results;
}

walk("src").forEach(file => {
  const dest = path.join("/tmp/room-3d-transpiled", file.replace(/\.tsx?$/, ".js"));
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const content = fs.readFileSync(file, "utf-8");
  const result = esbuild.transformSync(content, {
    loader: file.endsWith(".tsx") ? "tsx" : "ts",
    target: "es2015",
    format: "cjs",
    jsx: "transform"
  });
  fs.writeFileSync(dest, result.code);
});
console.log("Transpilation terminée dans /tmp/room-3d-transpiled");
'
```

#### Étape 2 : Lancement de `es6-plato`
Générer le rapport dans le répertoire `./report-plato/` :
```bash
npx --yes es6-plato -r -d ./report-plato /tmp/room-3d-transpiled/src
```

#### Étape 3 : Visualisation du rapport dans le navigateur
```bash
# Sous Linux
xdg-open ./report-plato/index.html

# Sous macOS
open ./report-plato/index.html

# Sous Windows (Git Bash / WSL)
start ./report-plato/index.html
```

---

## 4. Interprétation des métriques clés

| Métrique | Seuil d'alerte | Interprétation et action recommandée |
| :--- | :--- | :--- |
| **SLOC (Source Lines of Code)** | > 400 - 500 lignes | Fichier "God Object" ou composant surchargé. Découper en sous-composants, hooks spécialisés ou modules utilitaires. |
| **Complexité Cyclomatique** | > 20 par fonction / > 100 par fichier | Nombre excessif de branches conditionnelles et états entremêlés. Risque élevé de régressions lors des modifications. Privilégier des tables de dispatch, du polymorphisme ou des machines d'état. |
| **Indice de Maintenabilité (MI)** | < 65 (critique si < 50) | Code dense, imbriqué et difficile à tester unitairement. Priorité haute pour du refactoring. |
| **Effort de Halstead / Bugs estimés** | Élevé | Proportionnel au nombre d'opérateurs et d'identifiants uniques manipulés dans une même portée. |
