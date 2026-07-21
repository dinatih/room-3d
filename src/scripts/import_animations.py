#!/usr/bin/env python3
import sys
import os
import re
import subprocess
from pathlib import Path

def main():
    if len(sys.argv) < 2:
        print("Usage: python import_animations.py <file1.fbx> [file2.fbx ...]")
        sys.exit(1)

    project_root = Path(__file__).resolve().parent.parent.parent
    blender_script = project_root / 'sources_backup' / 'fbx_to_glb.py'
    dest_dir = project_root / 'public' / 'media' / 'sandbox'
    walker_file = project_root / 'src' / 'features' / 'scene' / 'Walker.tsx'
    
    if not blender_script.exists():
        print(f"Error: {blender_script} not found.")
        sys.exit(1)

    dest_dir.mkdir(parents=True, exist_ok=True)
    
    new_entries = []

    for fbx_path_str in sys.argv[1:]:
        fbx_path = Path(fbx_path_str).resolve()
        if not fbx_path.exists():
            print(f"Skipping {fbx_path_str} (file not found)")
            continue
            
        base_name = fbx_path.stem
        # Clean the name to match previous convention
        clean_name = re.sub(r'[^a-z0-9]', '_', base_name.lower())
        clean_name = re.sub(r'_+', '_', clean_name)
        clean_name = clean_name.strip('_')
        
        glb_name = f"anim_{clean_name}.glb"
        glb_path = dest_dir / glb_name
        
        print(f"Converting '{fbx_path.name}' -> '{glb_name}'...")
        
        # Run blender conversion if it doesn't already exist
        if not glb_path.exists():
            cmd = [
                'blender', '--background', '--python', str(blender_script), 
                '--', str(fbx_path), str(glb_path)
            ]
            result = subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            if result.returncode != 0:
                print(f"  Failed to convert {fbx_path.name}")
                continue
            else:
                print(f"  Successfully converted to {glb_name}")
        else:
            print(f"  {glb_name} already exists. Skipping conversion.")
            
        new_entries.append({'value': f"media/sandbox/{glb_name}", 'label': base_name})
        
    if not new_entries:
        print("No new animations to add.")
        sys.exit(0)
        
    # Update Walker.tsx
    print(f"Updating {walker_file.name}...")
    with open(walker_file, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # Find the WALKER_ANIM_OPTIONS array
    # It looks like:
    # export const WALKER_ANIM_OPTIONS = [
    #   ...
    # ].filter(...)
    
    match = re.search(r'(export const WALKER_ANIM_OPTIONS\s*=\s*\[)(.*?)(\]\.filter)', content, flags=re.DOTALL)
    if not match:
        print("Error: Could not find WALKER_ANIM_OPTIONS array in Walker.tsx")
        sys.exit(1)
        
    prefix = match.group(1)
    existing_items = match.group(2)
    suffix = match.group(3)
    
    # Append the new items
    new_lines = []
    for entry in new_entries:
        line = f'  {{ value: "{entry["value"]}", label: "{entry["label"]}" }}'
        # Prevent duplicates if it's already there exactly
        if entry["value"] not in existing_items:
            new_lines.append(line)
            
    if not new_lines:
        print("All animations are already in WALKER_ANIM_OPTIONS.")
        sys.exit(0)
        
    # Ensure there's a comma after the last existing item if needed
    existing_items = existing_items.rstrip()
    if existing_items and not existing_items.endswith(','):
        existing_items += ','
        
    new_items_str = ',\n'.join(new_lines)
    
    new_array_content = f"{existing_items}\n{new_items_str}\n"
    new_content = content[:match.start(2)] + new_array_content + content[match.end(2):]
    
    with open(walker_file, 'w', encoding='utf-8') as f:
        f.write(new_content)
        
    print(f"Added {len(new_lines)} animations to {walker_file.name}")

if __name__ == "__main__":
    main()
