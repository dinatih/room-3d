#!/bin/bash

# Navigate to animations directory
cd /home/dinatih/Projects/room-3d/sources_backup/animations

DEST_DIR="/home/dinatih/Projects/room-3d/public/media/sandbox"
PYTHON_SCRIPT="/home/dinatih/Projects/room-3d/sources_backup/fbx_to_glb.py"

# Process all FBX files in the directory
for fbx in *.fbx; do
    # Skip if no FBX files are found
    [ -e "$fbx" ] || continue

    # Calculate new name
    # 1. Remove .fbx extension
    # 2. Lowercase
    # 3. Replace spaces and special characters with underscore
    # 4. Prefix with anim_ and append .glb
    name_no_ext="${fbx%.fbx}"
    
    # lowercase and replace non-alphanumeric with underscore
    clean_name=$(echo "$name_no_ext" | tr '[:upper:]' '[:lower:]' | sed -e 's/[^a-z0-9]/_/g' -e 's/_\+/_/g' -e 's/^_//' -e 's/_$//')
    
    glb_name="anim_${clean_name}.glb"
    
    # If the file already exists in sandbox, skip
    if [ -f "$DEST_DIR/$glb_name" ]; then
        echo "Skipping $fbx, $glb_name already exists."
        continue
    fi
    
    echo "Converting '$fbx' -> '$glb_name'..."
    blender --background --python "$PYTHON_SCRIPT" -- "$PWD/$fbx" "$DEST_DIR/$glb_name" > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "Success: $glb_name"
    else
        echo "Failed to convert $fbx"
    fi
done

echo "Done."
