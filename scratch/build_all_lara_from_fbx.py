import os
import zipfile
import tempfile
import shutil
import bpy
from mathutils import Vector, Matrix

def log(msg):
    print(f"[fbx-pipeline] {msg}", flush=True)

def build_model_from_fbx(target_zip_path, ref_zip_path, out_glb_path, is_reference=False):
    log(f"\n==========================================")
    log(f"Processing ZIP: {target_zip_path}")
    log(f"==========================================")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract target zip
        with zipfile.ZipFile(target_zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                log("Error: No FBX file in target zip!")
                return
            tgt_fbx_path = os.path.join(tmpdir, fbx_files[0])
            
        # Extract reference zip
        with zipfile.ZipFile(ref_zip_path, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                log("Error: No FBX file in reference zip!")
                return
            ref_fbx_path = os.path.join(tmpdir, fbx_files[0])

        # Reset Blender
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        if is_reference:
            # For 01 Bikini itself, just import and export to standardize scale/naming
            log("Importing reference model...")
            bpy.ops.import_scene.fbx(filepath=tgt_fbx_path)
            tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
            tgt_arm.name = "Armature"
            
            # Clean names
            for bone in tgt_arm.data.bones:
                if ":" in bone.name:
                    bone.name = bone.name.split(":")[-1]
                bone.name = bone.name.replace(" ", "_")
                
            for m in bpy.context.scene.objects:
                if m.type == 'MESH' and m.parent == tgt_arm:
                    if ":" in m.name:
                        m.name = m.name.split(":")[-1]
                    for vg in m.vertex_groups:
                        if ":" in vg.name:
                            vg.name = vg.name.split(":")[-1]
                        vg.name = vg.name.replace(" ", "_")
            
            bpy.ops.object.select_all(action='SELECT')
            log(f"Exporting standardized reference to GLB: {out_glb_path}")
            os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)
            bpy.ops.export_scene.gltf(
                filepath=out_glb_path,
                export_format='GLB',
                export_skins=True,
                export_yup=True
            )
            return

        # Import Reference FBX to copy breast bone positions & weights
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

        # Save reference bone info in EDIT mode in WORLD space to handle scaling differences
        bpy.context.view_layer.objects.active = ref_arm
        bpy.ops.object.mode_set(mode='EDIT')
        ref_bone_data = {}
        for bname in ["breast left base", "breast right base"]:
            ref_b = ref_arm.data.edit_bones.get(bname)
            if ref_b:
                ref_bone_data[bname] = {
                    'head_world': ref_arm.matrix_world @ ref_b.head.copy(),
                    'tail_world': ref_arm.matrix_world @ ref_b.tail.copy(),
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
        
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "spine_upper" in eb_norm or "spine_3" in eb_norm or "spine2" in eb_norm:
                    target_parent_name = eb.name
                    break
        
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "spine" in eb_norm:
                    target_parent_name = eb.name
                    break
                    
        if not target_parent_name:
            for eb in tgt_arm.data.edit_bones:
                eb_norm = eb.name.lower().replace(" ", "_").replace(":", "_").replace(".", "_")
                if "hips" in eb_norm or "pelvis" in eb_norm:
                    target_parent_name = eb.name
                    break
        if not target_parent_name:
            target_parent_name = tgt_arm.data.edit_bones[0].name
            
        log(f"Target chest bone for parenting: {target_parent_name}")

        # Remove existing breast bones if any to avoid overlaps
        for bname in ["breast left base", "breast right base", "breast_left_base", "breast_right_base"]:
            eb = tgt_arm.data.edit_bones.get(bname)
            if eb:
                tgt_arm.data.edit_bones.remove(eb)

        # Create edit bones in target (and rename to standard underscore style)
        for bname, data in ref_bone_data.items():
            clean_name = bname.replace(" ", "_")
            eb = tgt_arm.data.edit_bones.new(clean_name)
            # Transform from world space to target local space
            eb.head = tgt_arm.matrix_world.inverted() @ data['head_world']
            eb.tail = tgt_arm.matrix_world.inverted() @ data['tail_world']
            eb.roll = data['roll']
            
            parent_bone = tgt_arm.data.edit_bones.get(target_parent_name)
            if parent_bone:
                eb.parent = parent_bone

        bpy.ops.object.mode_set(mode='OBJECT')

        # 2) Transfer weights for breast vertex groups (ONLY to target body/skin mesh)
        log("Transferring weights for breast vertex groups...")
        if tgt_meshes:
            tgt_body_mesh = max(tgt_meshes, key=lambda m: len(m.data.vertices))
            
            for bname in ["breast_left_base", "breast_right_base"]:
                if bname not in tgt_body_mesh.vertex_groups:
                    tgt_body_mesh.vertex_groups.new(name=bname)
            
            if ref_meshes:
                ref_m = max(ref_meshes, key=lambda m: len(m.data.vertices))
                
                # Align vertex group names in reference to match target
                for bname in ["breast left base", "breast right base"]:
                    clean_name = bname.replace(" ", "_")
                    if bname in ref_m.vertex_groups and clean_name not in ref_m.vertex_groups:
                        ref_m.vertex_groups[bname].name = clean_name
                
                bpy.ops.object.select_all(action='DESELECT')
                tgt_body_mesh.select_set(True)
                bpy.context.view_layer.objects.active = tgt_body_mesh
                
                mod = tgt_body_mesh.modifiers.new(name="BreastTransfer", type='DATA_TRANSFER')
                mod.object = ref_m
                mod.use_vert_data = True
                mod.data_types_verts = {'VGROUP_WEIGHTS'}
                mod.vert_mapping = 'POLYINTERP_NEAREST'
                
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
        log("Cleaning up bone and vertex group names...")
        tgt_arm.name = "Armature"
        for bone in tgt_arm.data.bones:
            if ":" in bone.name:
                bone.name = bone.name.split(":")[-1]
            bone.name = bone.name.replace(" ", "_")
                
        for m in tgt_meshes:
            if m.name.startswith("Mesh_Tgt_"):
                m.name = m.name[len("Mesh_Tgt_"):]
            if ":" in m.name:
                m.name = m.name.split(":")[-1]
            
            for vg in m.vertex_groups:
                if ":" in vg.name:
                    vg.name = vg.name.split(":")[-1]
                vg.name = vg.name.replace(" ", "_")

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
        log("SUCCESS")

if __name__ == "__main__":
    src_dir = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style"
    out_dir = "/home/dinatih/Projects/room-3d/public/media/all_lara"
    
    ref_zip = os.path.join(src_dir, "01 Bikini.zip")
    
    # List of all 19 zip files in all_lara_style
    all_zips = [
        ("01 Bikini.zip", "01_bikini.glb", True),
        ("02 Double slit dress.zip", "02_double_slit_dress.glb", False),
        ("03 Dress.zip", "03_dress.glb", False),
        ("04 Baywatch.zip", "04_baywatch.glb", False),
        ("05 Crop top - Shorts.zip", "05_crop_top_shorts.glb", False),
        ("06 Cap sleeve crop top - Shorts.zip", "06_cap_sleeve_crop_top_shorts.glb", False),
        ("07 Scoop bodysuit - Shorts.zip", "07_scoop_bodysuit_shorts.glb", False),
        ("08 Crew neck bodysuit - Shorts.zip", "08_crew_neck_bodysuit_shorts.glb", False),
        ("09 Cap sleeve biketard.zip", "09_cap_sleeve_biketard.glb", False),
        ("10 Long sleeve surfsuit.zip", "10_long_sleeve_surfsuit.glb", False),
        ("11 Tank top - Pants.zip", "11_tank_top_pants.glb", False),
        ("12 Bodysuit - Jeans.zip", "12_bodysuit_jeans.glb", False),
        ("13 3-4 sleeve catsuit.zip", "13_3_4_sleeve_catsuit.glb", False),
        ("14 Catsuit.zip", "14_catsuit.glb", False),
        ("14 Catsuit (mp5).zip", "14_catsuit_mp5.glb", False),
        ("15 Business suit.zip", "15_business_suit.glb", False),
        ("16 Motorcycle.zip", "16_motorcycle.glb", False),
        ("17 Jacket - Pants.zip", "17_jacket_pants.glb", False),
        ("18 Wetsuit.zip", "18_wetsuit.glb", False),
    ]
    
    for zip_name, glb_name, is_ref in all_zips:
        target_zip = os.path.join(src_dir, zip_name)
        out_glb = os.path.join(out_dir, glb_name)
        try:
            build_model_from_fbx(target_zip, ref_zip, out_glb, is_reference=is_ref)
        except Exception as e:
            log(f"FAILED to process {zip_name}: {e}")

    # Copy the newly built Scoop GLB (07) to the named sandbox variables to ensure they are 100% correct
    scoop_glb_src = os.path.join(out_dir, "07_scoop_bodysuit_shorts.glb")
    sandbox_destinations = [
        "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb",
        "/home/dinatih/Projects/room-3d/public/media/sandbox/rosanna_lara_native.glb",
        "/home/dinatih/Projects/room-3d/public/media/sandbox/vivid_red_lara_native.glb",
    ]
    for dest in sandbox_destinations:
        log(f"Copying correct Scoop GLB to: {dest}")
        shutil.copyfile(scoop_glb_src, dest)
