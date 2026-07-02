import os
import zipfile
import tempfile
import bpy
from mathutils import Vector, Matrix

def log(msg):
    print(f"[rig-breasts] {msg}", flush=True)

def rig_breasts_fbx(target_zip_path, ref_zip_path, out_glb_path):
    log(f"\n==========================================")
    log(f"Processing ZIP target: {target_zip_path}")
    log(f"==========================================")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract ALL files from target zip (to preserve textures!)
        with zipfile.ZipFile(target_zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                log("Error: No FBX file in target zip!")
                return
            tgt_fbx_path = os.path.join(tmpdir, fbx_files[0])
            
        # Extract ALL files from reference zip
        with zipfile.ZipFile(ref_zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                log("Error: No FBX file in reference zip!")
                return
            ref_fbx_path = os.path.join(tmpdir, fbx_files[0])

        # Reset Blender
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Import Reference FBX
        log("Importing reference FBX...")
        bpy.ops.import_scene.fbx(filepath=ref_fbx_path)
        ref_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        ref_arm.name = "Armature_Ref"
        ref_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == ref_arm]
        for m in ref_meshes:
            m.name = f"Mesh_Ref_{m.name}"
            
        # Import Target FBX
        log("Importing target FBX...")
        bpy.ops.import_scene.fbx(filepath=tgt_fbx_path)
        tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o.name != "Armature_Ref")
        tgt_arm.name = "Armature_Tgt"
        tgt_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == tgt_arm]
        for m in tgt_meshes:
            m.name = f"Mesh_Tgt_{m.name}"

        # Save reference bone info in edit mode
        bpy.context.view_layer.objects.active = ref_arm
        bpy.ops.object.mode_set(mode='EDIT')
        ref_bone_data = {}
        for bname in ["breast left base", "breast right base"]:
            ref_b = ref_arm.data.edit_bones.get(bname)
            if ref_b:
                ref_bone_data[bname] = {
                    'head': ref_b.head.copy(),
                    'tail': ref_b.tail.copy(),
                    'roll': ref_b.roll,
                }
        bpy.ops.object.mode_set(mode='OBJECT')

        # 1) Add breast bones to target armature
        log("Adding breast bones to target armature...")
        bpy.context.view_layer.objects.active = tgt_arm
        bpy.ops.object.mode_set(mode='EDIT')
        
        # Find target parent chest bone
        parent_candidates = ["mixamorig_spine_upper", "mixamorig_Spine2", "mixamorig:Spine2", "spine_3", "spine_upper", "spine upper", "spine.003", "spine"]
        target_parent_name = None
        for cand in parent_candidates:
            cand_norm = cand.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if eb_norm == cand_norm:
                    target_parent_name = eb.name
                    break
            if target_parent_name:
                break
        
        # Fallback to any bone containing 'spine' and 'upper', or 'spine_3', or 'spine2'
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "spine_upper" in eb_norm or "spine_3" in eb_norm or "spine2" in eb_norm:
                    target_parent_name = eb.name
                    break
        
        # Fallback to any bone containing 'spine'
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "spine" in eb_norm:
                    target_parent_name = eb.name
                    break
                    
        # Fallback to hips or pelvis
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "hips" in eb_norm or "pelvis" in eb_norm:
                    target_parent_name = eb.name
                    break
        if not target_parent_name:
            target_parent_name = tgt_arm.data.edit_bones[0].name
            
        log(f"Selected target parent chest bone: {target_parent_name}")

        # Remove existing breast bones if any to have a clean start
        for bname in ["breast left base", "breast right base", "breast_left_base", "breast_right_base"]:
            eb = tgt_arm.data.edit_bones.get(bname)
            if eb:
                tgt_arm.data.edit_bones.remove(eb)

        # Create edit bones in target
        for bname, data in ref_bone_data.items():
            eb = tgt_arm.data.edit_bones.new(bname)
            eb.head = data['head']
            eb.tail = data['tail']
            eb.roll = data['roll']
            
            parent_bone = tgt_arm.data.edit_bones.get(target_parent_name)
            if parent_bone:
                eb.parent = parent_bone

        bpy.ops.object.mode_set(mode='OBJECT')

        # 2) Transfer weights for breast vertex groups (ONLY to target body/skin mesh)
        log("Transferring weights for breast vertex groups to body mesh...")
        if tgt_meshes:
            tgt_body_mesh = max(tgt_meshes, key=lambda m: len(m.data.vertices))
            
            for bname in ["breast left base", "breast right base"]:
                if bname not in tgt_body_mesh.vertex_groups:
                    tgt_body_mesh.vertex_groups.new(name=bname)
            
            if ref_meshes:
                ref_m = max(ref_meshes, key=lambda m: len(m.data.vertices))
                
                bpy.ops.object.select_all(action='DESELECT')
                tgt_body_mesh.select_set(True)
                bpy.context.view_layer.objects.active = tgt_body_mesh
                
                mod = tgt_body_mesh.modifiers.new(name="BreastTransfer", type='DATA_TRANSFER')
                mod.object = ref_m
                mod.use_vert_data = True
                mod.data_types_verts = {'VGROUP_WEIGHTS'}
                mod.vert_mapping = 'NEAREST'
                
                bpy.ops.object.datalayout_transfer(modifier="BreastTransfer")
                bpy.ops.object.modifier_apply(modifier="BreastTransfer")

        # 3) Clean up reference objects
        log("Cleaning up reference objects...")
        bpy.ops.object.select_all(action='DESELECT')
        ref_arm.select_set(True)
        for m in ref_meshes:
            m.select_set(True)
        bpy.ops.object.delete()

        # 4) Basic name cleanup on target
        log("Cleaning up bone prefixes...")
        tgt_arm.name = "Armature"
        for bone in tgt_arm.data.bones:
            if ":" in bone.name:
                bone.name = bone.name.split(":")[-1]
                
        for m in tgt_meshes:
            if m.name.startswith("Mesh_Tgt_"):
                m.name = m.name[len("Mesh_Tgt_"):]
            if ":" in m.name:
                m.name = m.name.split(":")[-1]
            
            for vg in m.vertex_groups:
                if ":" in vg.name:
                    vg.name = vg.name.split(":")[-1]

        # Select all remaining objects
        bpy.ops.object.select_all(action='SELECT')
        
        # Export as GLB
        log(f"Exporting GLB to: {out_glb_path}")
        os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=out_glb_path,
            export_format='GLB',
            export_skins=True,
            export_yup=True
        )
        log("Export completed successfully.")


def rig_breasts_glb(target_glb_path, ref_zip_path, out_glb_path):
    log(f"\n==========================================")
    log(f"Processing GLB target: {target_glb_path}")
    log(f"==========================================")
    
    if not os.path.exists(target_glb_path):
        log(f"Error: Target GLB does not exist: {target_glb_path}")
        return
        
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract ALL files from reference zip
        with zipfile.ZipFile(ref_zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                log("Error: No FBX file in reference zip!")
                return
            ref_fbx_path = os.path.join(tmpdir, fbx_files[0])

        # Reset Blender
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # Import Reference FBX
        log("Importing reference FBX...")
        bpy.ops.import_scene.fbx(filepath=ref_fbx_path)
        ref_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        ref_arm.name = "Armature_Ref"
        ref_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == ref_arm]
        for m in ref_meshes:
            m.name = f"Mesh_Ref_{m.name}"
            
        # Import Target GLB
        log("Importing target GLB...")
        bpy.ops.import_scene.gltf(filepath=target_glb_path)
        tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o.name != "Armature_Ref")
        tgt_arm.name = "Armature_Tgt"
        tgt_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.name != ref_arm.name and not o.name.startswith("Mesh_Ref_")]
        for m in tgt_meshes:
            m.name = f"Mesh_Tgt_{m.name}"

        # Save reference bone info in edit mode
        bpy.context.view_layer.objects.active = ref_arm
        bpy.ops.object.mode_set(mode='EDIT')
        ref_bone_data = {}
        for bname in ["breast left base", "breast right base"]:
            ref_b = ref_arm.data.edit_bones.get(bname)
            if ref_b:
                ref_bone_data[bname] = {
                    'head': ref_b.head.copy(),
                    'tail': ref_b.tail.copy(),
                    'roll': ref_b.roll,
                }
        bpy.ops.object.mode_set(mode='OBJECT')

        # 1) Add breast bones to target armature
        log("Adding breast bones to target armature...")
        bpy.context.view_layer.objects.active = tgt_arm
        bpy.ops.object.mode_set(mode='EDIT')
        
        # Find target parent chest bone
        parent_candidates = ["mixamorig_spine_upper", "mixamorig_Spine2", "mixamorig:Spine2", "spine_3", "spine_upper", "spine upper", "spine.003", "spine"]
        target_parent_name = None
        for cand in parent_candidates:
            cand_norm = cand.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if eb_norm == cand_norm:
                    target_parent_name = eb.name
                    break
            if target_parent_name:
                break
        
        # Fallback to any bone containing 'spine' and 'upper', or 'spine_3', or 'spine2'
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "spine_upper" in eb_norm or "spine_3" in eb_norm or "spine2" in eb_norm:
                    target_parent_name = eb.name
                    break
        
        # Fallback to any bone containing 'spine'
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "spine" in eb_norm:
                    target_parent_name = eb.name
                    break
                    
        # Fallback to hips or pelvis
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "hips" in eb_norm or "pelvis" in eb_norm:
                    target_parent_name = eb.name
                    break
        if not target_parent_name:
            target_parent_name = tgt_arm.data.edit_bones[0].name
            
        log(f"Selected target parent chest bone: {target_parent_name}")

        # Remove existing breast bones if any to have a clean start
        for bname in ["breast left base", "breast right base", "breast_left_base", "breast_right_base"]:
            eb = tgt_arm.data.edit_bones.get(bname)
            if eb:
                tgt_arm.data.edit_bones.remove(eb)

        # Create edit bones in target
        for bname, data in ref_bone_data.items():
            tgt_bone_name = bname.replace(" ", "_")
            eb = tgt_arm.data.edit_bones.new(tgt_bone_name)
            eb.head = data['head']
            eb.tail = data['tail']
            eb.roll = data['roll']
            
            parent_bone = tgt_arm.data.edit_bones.get(target_parent_name)
            if parent_bone:
                eb.parent = parent_bone

        bpy.ops.object.mode_set(mode='OBJECT')

        # 2) Transfer weights for breast vertex groups (ONLY to target body/skin mesh)
        log("Transferring weights for breast vertex groups to body mesh...")
        if tgt_meshes:
            tgt_body_mesh = max(tgt_meshes, key=lambda m: len(m.data.vertices))
            
            for bname in ["breast left base", "breast right base"]:
                tgt_vg_name = bname.replace(" ", "_")
                if tgt_vg_name not in tgt_body_mesh.vertex_groups:
                    tgt_body_mesh.vertex_groups.new(name=tgt_vg_name)
            
            if ref_meshes:
                ref_m = max(ref_meshes, key=lambda m: len(m.data.vertices))
                
                bpy.ops.object.select_all(action='DESELECT')
                tgt_body_mesh.select_set(True)
                bpy.context.view_layer.objects.active = tgt_body_mesh
                
                mod = tgt_body_mesh.modifiers.new(name="BreastTransfer", type='DATA_TRANSFER')
                mod.object = ref_m
                mod.use_vert_data = True
                mod.data_types_verts = {'VGROUP_WEIGHTS'}
                mod.vert_mapping = 'NEAREST'
                
                bpy.ops.object.datalayout_transfer(modifier="BreastTransfer")
                bpy.ops.object.modifier_apply(modifier="BreastTransfer")

        # 3) Clean up reference objects
        log("Cleaning up reference objects...")
        bpy.ops.object.select_all(action='DESELECT')
        ref_arm.select_set(True)
        for m in ref_meshes:
            m.select_set(True)
        bpy.ops.object.delete()

        # 4) Basic name cleanup on target
        log("Cleaning up bone prefixes...")
        tgt_arm.name = "Armature"
        for bone in tgt_arm.data.bones:
            if ":" in bone.name:
                bone.name = bone.name.split(":")[-1]
                
        for m in tgt_meshes:
            if m.name.startswith("Mesh_Tgt_"):
                m.name = m.name[len("Mesh_Tgt_"):]
            if ":" in m.name:
                m.name = m.name.split(":")[-1]
            
            for vg in m.vertex_groups:
                if ":" in vg.name:
                    vg.name = vg.name.split(":")[-1]

        # Select all remaining objects
        bpy.ops.object.select_all(action='SELECT')
        
        # Export as GLB
        log(f"Exporting GLB to: {out_glb_path}")
        os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=out_glb_path,
            export_format='GLB',
            export_skins=True,
            export_yup=True
        )
        log("Export completed successfully.")


if __name__ == "__main__":
    ref_zip = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style/01 Bikini.zip"
    
    # 1. Process FBX targets (zipping) with full extraction to preserve textures
    fbx_targets = [
        ("04 Baywatch.zip", "04_baywatch.glb"),
        ("05 Crop top - Shorts.zip", "05_crop_top_shorts.glb"),
        ("07 Scoop bodysuit - Shorts.zip", "07_scoop_bodysuit_shorts.glb"),
        ("09 Cap sleeve biketard.zip", "09_cap_sleeve_biketard.glb"),
        ("10 Long sleeve surfsuit.zip", "10_long_sleeve_surfsuit.glb"),
        ("11 Tank top - Pants.zip", "11_tank_top_pants.glb"),
        ("14 Catsuit.zip", "14_catsuit.glb"),
        ("14 Catsuit (mp5).zip", "14_catsuit_mp5.glb"),
        ("17 Jacket - Pants.zip", "17_jacket_pants.glb"),
        ("18 Wetsuit.zip", "18_wetsuit.glb")
    ]
    
    src_dir = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style"
    out_dir = "/home/dinatih/Projects/room-3d/public/media/all_lara"
    
    for zip_name, glb_name in fbx_targets:
        target_zip = os.path.join(src_dir, zip_name)
        out_glb = os.path.join(out_dir, glb_name)
        try:
            rig_breasts_fbx(target_zip, ref_zip, out_glb)
        except Exception as e:
            log(f"FAILED fbx target {zip_name}: {e}")
            
    # 2. Process GLB targets for Laras with first names
    glb_targets = [
        ("/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb", "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb"),
        ("/home/dinatih/Projects/room-3d/public/media/sandbox/rosanna_lara_native.glb", "/home/dinatih/Projects/room-3d/public/media/sandbox/rosanna_lara_native.glb"),
        ("/home/dinatih/Projects/room-3d/public/media/sandbox/vivid_red_lara_native.glb", "/home/dinatih/Projects/room-3d/public/media/sandbox/vivid_red_lara_native.glb")
    ]
    
    for target_glb, out_glb in glb_targets:
        try:
            rig_breasts_glb(target_glb, ref_zip, out_glb)
        except Exception as e:
            log(f"FAILED glb target {target_glb}: {e}")
