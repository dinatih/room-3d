import os
import zipfile
import tempfile
import shutil
import bpy
from mathutils import Vector, Matrix

def log(msg):
    print(f"[scoop-perfect] {msg}", flush=True)

def main():
    src_dir = "/home/dinatih/Projects/room-3d/sources_backup/all_lara_style"
    out_dir = "/home/dinatih/Projects/room-3d/public/media/all_lara"
    
    target_zip = os.path.join(src_dir, "07 Scoop bodysuit - Shorts.zip")
    ref_zip = os.path.join(src_dir, "01 Bikini.zip")
    out_glb_path = os.path.join(out_dir, "07_scoop_bodysuit_shorts.glb")
    
    log(f"Starting Lara Scoop Perfect Pipeline...")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract target zip
        with zipfile.ZipFile(target_zip, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            tgt_fbx_path = os.path.join(tmpdir, fbx_files[0])
            
        # Extract reference zip
        with zipfile.ZipFile(ref_zip, 'r') as zip_ref:
            zip_ref.extractall(tmpdir)
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            ref_fbx_path = os.path.join(tmpdir, fbx_files[0])

        # Reset Blender
        bpy.ops.wm.read_factory_settings(use_empty=True)
        
        # 1) Import TARGET first so its bones get clean original names
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

        # 2) Import Reference FBX second (its duplicate names will get .001 suffixes)
        log("Importing reference FBX...")
        bpy.ops.import_scene.fbx(filepath=ref_fbx_path)
        ref_arm = next(o for o in bpy.context.scene.objects if o.type == 'ARMATURE' and o != tgt_arm)
        ref_arm.name = "Armature_Ref"
        ref_meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH' and o.parent == ref_arm]
        for m in ref_meshes:
            m.name = f"Mesh_Ref_{m.name}"

        # 3) Add breast bones to target armature programmatically relative to its chest bone
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

        # 4) Transfer weights for breast vertex groups ONLY using a temporary duplicate mesh
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
                                    tgt_vg.add([v.index], g.weight, 'REPLACE')
                                    
                log("Vertex weight transfer for breast groups completed successfully!")
                
                # Delete the temporary duplicate mesh
                bpy.ops.object.select_all(action='DESELECT')
                tmp_mesh.select_set(True)
                bpy.ops.object.delete()

        # 5) Clean up reference objects to avoid exporting them
        log("Cleaning up reference objects...")
        bpy.ops.object.select_all(action='DESELECT')
        ref_arm.select_set(True)
        for m in ref_meshes:
            m.select_set(True)
        bpy.ops.object.delete()

        # 6) Export the final correct GLB
        tgt_arm.name = "Armature"
        bpy.ops.object.select_all(action='SELECT')
        log(f"Exporting Scoop GLB to: {out_glb_path}")
        os.makedirs(os.path.dirname(out_glb_path), exist_ok=True)
        bpy.ops.export_scene.gltf(
            filepath=out_glb_path,
            export_format='GLB',
            export_skins=True,
            export_yup=True
        )
        log("Lara Scoop built successfully.")

    # Copy the newly built Scoop GLB (07) to the named sandbox variables
    sandbox_destinations = [
        "/home/dinatih/Projects/room-3d/public/media/sandbox/lara_native.glb",
        "/home/dinatih/Projects/room-3d/public/media/sandbox/rosanna_lara_native.glb",
        "/home/dinatih/Projects/room-3d/public/media/sandbox/vivid_red_lara_native.glb",
    ]
    for dest in sandbox_destinations:
        log(f"Copying Scoop GLB to sandbox destination: {dest}")
        shutil.copyfile(out_glb_path, dest)
    log("Pipeline complete!")

if __name__ == "__main__":
    main()
