#!/bin/bash
# scripts/visualize.sh — Lance repo-visualizer sur room-3d
set -e

VISUALIZER_DIR="/tmp/repo-visualizer"
REPO_DIR="$(cd "$(dirname "$0")/.." && pwd)"

if [ ! -d "$VISUALIZER_DIR" ]; then
  echo "→ Clonage de repo-visualizer..."
  git clone --depth 1 https://github.com/Jany-M/repo-visualizer.git "$VISUALIZER_DIR"
fi

cd "$VISUALIZER_DIR"

# Installer les deps si nécessaire
if [ ! -d "node_modules" ]; then
  echo "→ Installation des dépendances..."
  npm install
fi

# Analyser room-3d
echo "→ Analyse de l'historique de room-3d..."
node scripts/analyze.mjs "$REPO_DIR"

# Lancer le serveur dev
echo "→ Démarrage du visualizer sur http://localhost:5173"
npm run dev