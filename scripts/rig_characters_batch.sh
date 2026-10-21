#!/usr/bin/env bash
# rig_characters_batch.sh
# Rigs customized volumetric breast bones & weights for Mixamo characters
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

# 3 premiers validés
# Nouveaux demandés
process "Arissa"   "public/characters/arissa/arissa.glb"
process "Astra"    "public/characters/astra/astra.glb"
process "Kachujin" "public/characters/kachujin/kachujin.glb"
process "Megan"    "public/characters/megan/megan.glb"
process "Medea"    "public/characters/medea/medea.glb"
process "Sophie"   "public/characters/sophie/sophie.glb"

echo "🎉 Tous les 11 personnages ont été riggués avec succès !"
