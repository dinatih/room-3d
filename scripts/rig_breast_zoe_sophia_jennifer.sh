#!/usr/bin/env bash
# rig_breast_zoe_sophia_jennifer.sh
# Exécute le rigging de poitrine pour Zoe, Sophia, et Jennifer via Blender headless.
# 
# Usage (depuis la racine du projet) :
#   chmod +x scripts/rig_breast_zoe_sophia_jennifer.sh
#   ./scripts/rig_breast_zoe_sophia_jennifer.sh
#
# Pré-requis : blender installé et dans le PATH (ou BLENDER_BIN défini)

set -e

BLENDER="${BLENDER_BIN:-blender}"
SCRIPT="scripts/rig_breast_mixamo.py"

echo "🦾 Blender : $($BLENDER --version 2>&1 | head -1)"
echo ""

process() {
    local name="$1"
    local glb="$2"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🏃 Traitement : $name ($glb)"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    "$BLENDER" --background --python "$SCRIPT" -- "$glb" "$glb"
    echo "✅ $name terminé → $glb"
    echo ""
}

process "Zoe"      "public/characters/zoe/zoe.glb"
process "Sophia"   "public/characters/sophia/sophia.glb"
process "Jennifer" "public/characters/jennifer/jennifer.glb"

echo "🎉 Tous les personnages ont été riggués avec succès !"
