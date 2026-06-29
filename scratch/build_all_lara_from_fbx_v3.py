import os
import zipfile
import tempfile
import shutil
import bpy
from mathutils import Vector, Matrix

def log(msg):
    print(f"[fbx-pipeline-v3] {msg}", flush=True)

def build_model_from_fbx_v3(target_zip_path, ref_zip_path, out_glb_path, is_reference=False):
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

        # Reset Blender to keep a clean workspace
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # 1) Import TARGET first so its bones get original names
        log("Importing target FBX...")
        bpy.ops.import_scene.fbx(filepath=tgt_fbx_path)
        tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        tgt_arm.name = "Armature_Tgt"
        tgt_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == tgt_arm]
        for m in tgt_meshes:
            m.name = f"Mesh_Tgt_{m.name}"

        # Standardize target names first (spaces to underscores, remove colon prefixes)
        bpy.context.view_layer.objects.active = tgt_arm
        bpy.ops.object.mode_set(mode='EDIT')
        for eb in tgt_arm.data.edit_bones:
            if ":" in eb.name:
                eb.name = eb.name.split(":")[-1]
            eb.name = eb.name.replace(" ", "_")
        bpy.ops.object.mode_set(mode='OBJECT')

        for m in tgt_meshes:
            if m.name.startswith("Mesh_Tgt_"):
                m.name = m.name[len("Mesh_Tgt_"):]
            if ":" in m.name:
                m.name = m.name.split(":")[-1]
            for vg in m.vertex_groups:
                if ":" in vg.name:
                    vg.name = vg.name.split(":")[-1]
                vg.name = vg.name.replace(" ", "_")

        # 2) If it is reference (Bikini itself), just export and exit
        if is_reference:
            tgt_arm.name = "Armature"
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

        # 3) Import Reference FBX second (its duplicate names will get .001 suffixes, which is fine)
        log("Importing reference FBX...")
        bpy.ops.import_scene.fbx(filepath=ref_fbx_path)
        ref_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o != tgt_arm)
        ref_arm.name = "Armature_Ref"
        ref_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == ref_arm]
        for m in ref_meshes:
            m.name = f"Mesh_Ref_{m.name}"

        # 4) Bone Structure Alignments (EDIT MODE)
        bpy.context.view_layer.objects.active = tgt_arm
        bpy.ops.object.mode_set(mode='EDIT')
        
        # A) Detect shifted shoulder naming and rename bones/vertex groups
        has_s1 = tgt_arm.data.edit_bones.get("arm_left_shoulder_1") is not None
        has_s2 = tgt_arm.data.edit_bones.get("arm_left_shoulder_2") is not None
        
        rename_map = {}
        if not has_s1 and has_s2:
            log("Detected shifted shoulder bones! Renaming shoulder chain...")
            rename_map = {
                "arm_left_shoulder_2": "arm_left_shoulder_1",
                "arm_left_elbow": "arm_left_shoulder_2",
                "arm_left_wrist": "arm_left_elbow",
                "arm_left_wrist_2": "arm_left_wrist",
                
                "arm_right_shoulder_2": "arm_right_shoulder_1",
                "arm_right_elbow": "arm_right_shoulder_2",
                "arm_right_wrist": "arm_right_elbow",
                "arm_right_wrist_2": "arm_right_wrist"
            }
            
            for old_name, new_name in rename_map.items():
                eb = tgt_arm.data.edit_bones.get(old_name)
                if eb:
                    eb.name = new_name
                    log(f"Renamed edit bone {old_name} -> {new_name}")

        # B) Insert missing head_hair parent bone to align ponytail depth index
        if not tgt_arm.data.edit_bones.get("head_hair") and tgt_arm.data.edit_bones.get("head_hair_ponytail_1"):
            log("Inserting missing head_hair parent bone to align ponytail index...")
            eb_p1 = tgt_arm.data.edit_bones.get("head_hair_ponytail_1")
            parent_bone = eb_p1.parent
            if parent_bone:
                eb_hh = tgt_arm.data.edit_bones.new("head_hair")
                eb_hh.head = parent_bone.tail if hasattr(parent_bone, "tail") else eb_p1.head
                eb_hh.tail = eb_p1.head
                eb_hh.roll = 0.0
                eb_hh.parent = parent_bone
                eb_p1.parent = eb_hh

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
            target_parent_name = tgt_arm.data.edit_bones[0].name
            
        log(f"Chest bone for breast parenting: {target_parent_name}")
        parent_bone = tgt_arm.data.edit_bones.get(target_parent_name)

        # Detect target scale
        is_meters = False
        if parent_bone and parent_bone.length < 0.8:
            is_meters = True
            log("Detected target scale: METERS")
        else:
            log("Detected target scale: CENTIMETERS")
            
        scale_fac = 0.01 if is_meters else 1.0

        # Remove existing breast bones if any to avoid duplicates
        for bname in ["breast left base", "breast right base", "breast_left_base", "breast_right_base"]:
            eb = tgt_arm.data.edit_bones.get(bname)
            if eb:
                tgt_arm.data.edit_bones.remove(eb)

        # C) Create new chest-relative breast bones
        eb_l = tgt_arm.data.edit_bones.new("breast_left_base")
        eb_l.head = parent_bone.head + Vector((5.4, -5.0, 3.0)) * scale_fac
        eb_l.tail = parent_bone.head + Vector((12.0, -11.0, 2.5)) * scale_fac
        eb_l.roll = 0.0
        eb_l.parent = parent_bone

        eb_r = tgt_arm.data.edit_bones.new("breast_right_base")
        eb_r.head = parent_bone.head + Vector((-5.4, -5.0, 3.0)) * scale_fac
        eb_r.tail = parent_bone.head + Vector((-12.0, -11.0, 2.5)) * scale_fac
        eb_r.roll = 0.0
        eb_r.parent = parent_bone

        bpy.ops.object.mode_set(mode='OBJECT')

        # 5) Rename vertex groups on target meshes to match shifted bone names
        if rename_map:
            for m in tgt_meshes:
                for old_name, new_name in rename_map.items():
                    vg = m.vertex_groups.get(old_name)
                    if vg:
                        vg.name = new_name
                        log(f"Renamed vertex group on mesh {m.name}: {old_name} -> {new_name}")

        # 6) Transfer weights for breast vertex groups
        log("Transferring weights for breast vertex groups...")
        if tgt_meshes:
            tgt_body_mesh = max(tgt_meshes, key=lambda m: len(m.data.vertices))
            
            for bname in ["breast_left_base", "breast_right_base"]:
                if bname not in tgt_body_mesh.vertex_groups:
                    tgt_body_mesh.vertex_groups.new(name=bname)
            
            if ref_meshes:
                ref_m = max(ref_meshes, key=lambda m: len(m.data.vertices))
                
                # Align vertex group names in reference to match target group names
                for vg in ref_m.vertex_groups:
                    vg_name_lower = vg.name.lower()
                    if "breast" in vg_name_lower and "left" in vg_name_lower:
                        vg.name = "breast_left_base"
                    elif "breast" in vg_name_lower and "right" in vg_name_lower:
                        vg.name = "breast_right_base"
                
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
                log("Weights transferred successfully.")

        # 7) Clean up reference objects
        log("Cleaning up reference objects...")
        bpy.ops.object.select_all(action='DESELECT')
        ref_arm.select_set(True)
        for m in ref_meshes:
            m.select_set(True)
        bpy.ops.object.delete()

        # 8) Export final cleaned GLB
        tgt_arm.name = "Armature"
        bpy.ops.object.select_all(action='SELECT')
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
            build_model_from_fbx_v3(target_zip, ref_zip, out_glb, is_reference=is_ref)
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
