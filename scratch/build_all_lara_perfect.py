import os
import zipfile
import tempfile
import shutil
import bpy
from mathutils import Vector, Matrix

def log(msg):
    print(f"[master-perfect] {msg}", flush=True)

def build_model_perfect(target_zip_path, ref_zip_path, out_glb_path, is_reference=False):
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
        
        # 1) Import TARGET first so its bones get original names
        log("Importing target FBX...")
        bpy.ops.import_scene.fbx(filepath=tgt_fbx_path)
        tgt_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE')
        tgt_arm.name = "Armature_Tgt"
        tgt_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == tgt_arm]
        for m in tgt_meshes:
            m.name = f"Mesh_Tgt_{m.name}"

        # Standardize target names (spaces to underscores, remove colon prefixes)
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

        # 3) Import Reference FBX second (its duplicate names will get .001 suffixes)
        log("Importing reference FBX...")
        bpy.ops.import_scene.fbx(filepath=ref_fbx_path)
        ref_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o != tgt_arm)
        ref_arm.name = "Armature_Ref"
        ref_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == ref_arm]
        for m in ref_meshes:
            m.name = f"Mesh_Ref_{m.name}"

        # 4) Add breast bones to target armature programmatically relative to its chest bone
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
            target_parent_name = tgt_arm.data.edit_bones[0].name
            
        log(f"Target chest bone for parenting: {target_parent_name}")
        parent_bone = tgt_arm.data.edit_bones.get(target_parent_name)

        # Detect target scale
        is_meters = False
        if parent_bone and parent_bone.length < 0.8:
            is_meters = True
            log("Detected target scale: METERS")
        else:
            log("Detected target scale: CENTIMETERS")
            
        scale_fac = 0.01 if is_meters else 1.0

        # Remove existing breast bones if any to have a clean start
        for bname in ["breast left base", "breast right base", "breast_left_base", "breast_right_base"]:
            eb = tgt_arm.data.edit_bones.get(bname)
            if eb:
                tgt_arm.data.edit_bones.remove(eb)

        # Create edit bones in target (centered, forward, slightly up from chest bone head)
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

        # 5) Transfer weights for breast vertex groups ONLY using a temporary duplicate mesh
        log("Transferring weights for breast vertex groups to temporary duplicate...")
        if tgt_meshes:
            tgt_body_mesh = max(tgt_meshes, key=lambda m: len(m.data.vertices))
            
            # Ensure target mesh has the breast vertex groups
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
                
                # Duplicate the target body mesh to run the Data Transfer on
                bpy.ops.object.select_all(action='DESELECT')
                tgt_body_mesh.select_set(True)
                bpy.context.view_layer.objects.active = tgt_body_mesh
                bpy.ops.object.duplicate()
                tmp_mesh = bpy.context.active_object
                tmp_mesh.name = "Mesh_Tmp_Transfer"
                
                for bname in ["breast_left_base", "breast_right_base"]:
                    if bname not in tmp_mesh.vertex_groups:
                        tmp_mesh.vertex_groups.new(name=bname)
                
                # Set up Data Transfer modifier on the temporary mesh
                mod = tmp_mesh.modifiers.new(name="BreastTransfer", type='DATA_TRANSFER')
                mod.object = ref_m
                mod.use_vert_data = True
                mod.data_types_verts = {'VGROUP_WEIGHTS'}
                mod.vert_mapping = 'POLYINTERP_NEAREST'
                
                bpy.ops.object.select_all(action='DESELECT')
                tmp_mesh.select_set(True)
                bpy.context.view_layer.objects.active = tmp_mesh
                bpy.ops.object.datalayout_transfer(modifier="BreastTransfer")
                bpy.ops.object.modifier_apply(modifier="BreastTransfer")
                
                # Copy ONLY the breast groups' weights from tmp_mesh back to tgt_body_mesh
                for bname in ["breast_left_base", "breast_right_base"]:
                    tgt_vg = tgt_body_mesh.vertex_groups.get(bname)
                    if tgt_vg:
                        tgt_body_mesh.vertex_groups.remove(tgt_vg)
                    tgt_vg = tgt_body_mesh.vertex_groups.new(name=bname)
                    
                    tmp_vg = tmp_mesh.vertex_groups.get(bname)
                    if tmp_vg:
                        for v in tmp_mesh.data.vertices:
                            for g in v.groups:
                                if g.group == tmp_vg.index:
                                    # Boost weights by 3x (capped at 1.0) to make the mesh highly responsive
                                    boosted_weight = min(1.0, g.weight * 3.0)
                                    tgt_vg.add([v.index], boosted_weight, 'REPLACE')
                                    
                log("Vertex weight transfer completed successfully!")
                
                # 5.2) Flatten backpack strap slits in the back of the Scoop bodysuit (Zip 07)
                if "07 Scoop" in target_zip_path:
                    log("Flattening backpack strap slits in the Scoop bodysuit...")
                    shirt_idx = -1
                    for i, slot in enumerate(tgt_body_mesh.material_slots):
                        if "shirt" in slot.name.lower():
                            shirt_idx = i
                            break
                    if shirt_idx != -1:
                        flattened_count = 0
                        for poly in tgt_body_mesh.data.polygons:
                            if poly.material_index == shirt_idx:
                                for v_idx in poly.vertices:
                                    v = tgt_body_mesh.data.vertices[v_idx]
                                    # Left slit region
                                    if 0.04 <= v.co.x <= 0.105 and -0.11 <= v.co.y <= -0.07 and 1.20 <= v.co.z <= 1.28:
                                        v.co.y = -0.114
                                        flattened_count += 1
                                    # Right slit region
                                    elif -0.105 <= v.co.x <= -0.04 and -0.11 <= v.co.y <= -0.07 and 1.20 <= v.co.z <= 1.28:
                                        v.co.y = -0.114
                                        flattened_count += 1
                        log(f"Successfully flattened {flattened_count} slit vertices on the back.")
                
                # Delete the temporary duplicate mesh
                bpy.ops.object.select_all(action='DESELECT')
                tmp_mesh.select_set(True)
                bpy.ops.object.delete()

        # 6) Clean up reference objects to avoid exporting them
        log("Cleaning up reference objects...")
        bpy.ops.object.select_all(action='DESELECT')
        ref_arm.select_set(True)
        for m in ref_meshes:
            m.select_set(True)
        bpy.ops.object.delete()

        # 7) Export the final correct GLB
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
        ("04 Baywatch.zip", "04_baywatch.glb", False),
        ("05 Crop top - Shorts.zip", "05_crop_top_shorts.glb", False),
        ("07 Scoop bodysuit - Shorts.zip", "07_scoop_bodysuit_shorts.glb", False),
        ("14 Catsuit.zip", "14_catsuit.glb", False),
    ]
    
    for zip_name, glb_name, is_ref in all_zips:
        target_zip = os.path.join(src_dir, zip_name)
        out_glb = os.path.join(out_dir, glb_name)
        try:
            build_model_perfect(target_zip, ref_zip, out_glb, is_reference=is_ref)
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
    log("Master pipeline completed successfully!")
