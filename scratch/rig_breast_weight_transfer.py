import os
import zipfile
import tempfile
import bpy
from mathutils import Vector, Matrix

def log(msg):
    print(f"[rig-breasts] {msg}", flush=True)

def rig_breasts(target_zip_path, ref_zip_path, out_glb_path):
    log(f"Processing target: {target_zip_path}")
    
    with tempfile.TemporaryDirectory() as tmpdir:
        # Extract target FBX
        with zipfile.ZipFile(target_zip_path, 'r') as zip_ref:
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                log("Error: No FBX file in target zip!")
                return
            tgt_fbx_name = fbx_files[0]
            zip_ref.extract(tgt_fbx_name, tmpdir)
            tgt_fbx_path = os.path.join(tmpdir, tgt_fbx_name)
            
        # Extract reference FBX
        with zipfile.ZipFile(ref_zip_path, 'r') as zip_ref:
            fbx_files = [name for name in zip_ref.namelist() if name.lower().endswith(".fbx")]
            if not fbx_files:
                log("Error: No FBX file in reference zip!")
                return
            ref_fbx_name = fbx_files[0]
            zip_ref.extract(ref_fbx_name, tmpdir)
            ref_fbx_path = os.path.join(tmpdir, ref_fbx_name)

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
                    'parent': ref_b.parent.name if ref_b.parent else None
                }
            else:
                log(f"Warning: Reference breast bone {bname} not found in reference armature!")
        bpy.ops.object.mode_set(mode='OBJECT')

        # 1) Add breast bones to target armature
        log("Adding breast bones to target armature...")
        bpy.context.view_layer.objects.active = tgt_arm
        bpy.ops.object.mode_set(mode='EDIT')

        # Create edit bones in target
        for bname, data in ref_bone_data.items():
            if tgt_arm.data.edit_bones.get(bname):
                log(f"Bone {bname} already exists in target, skipping edit bone creation.")
                continue
            
            eb = tgt_arm.data.edit_bones.new(bname)
            eb.head = data['head']
            eb.tail = data['tail']
            eb.roll = data['roll']
            
            if data['parent']:
                parent_bone = tgt_arm.data.edit_bones.get(data['parent'])
                if parent_bone:
                    eb.parent = parent_bone
                else:
                    log(f"Warning: Parent bone {data['parent']} not found in target edit bones!")

        bpy.ops.object.mode_set(mode='OBJECT')

        # 2) Transfer weights for breast vertex groups
        log("Transferring weights for breast vertex groups...")
        for tgt_m in tgt_meshes:
            # Ensure target mesh has the breast vertex groups
            for bname in ["breast left base", "breast right base"]:
                if bname not in tgt_m.vertex_groups:
                    tgt_m.vertex_groups.new(name=bname)
            
            # Find the best reference mesh to copy weights from (usually the one with most vertices)
            if not ref_meshes:
                continue
            ref_m = max(ref_meshes, key=lambda m: len(m.data.vertices))
            
            # Select target mesh to operate on
            bpy.ops.object.select_all(action='DESELECT')
            tgt_m.select_set(True)
            bpy.context.view_layer.objects.active = tgt_m
            
            # Add Data Transfer modifier
            mod = tgt_m.modifiers.new(name="BreastTransfer", type='DATA_TRANSFER')
            mod.object = ref_m
            mod.use_vert_data = True
            mod.data_types_verts = {'VGROUP_WEIGHTS'}
            mod.vert_mapping = 'NEAREST'
            
            # Run transfer and apply
            bpy.ops.object.datalayout_transfer(modifier="BreastTransfer")
            bpy.ops.object.modifier_apply(modifier="BreastTransfer")
            log(f"Transferred weights from {ref_m.name} to {tgt_m.name}")

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
            # Remove Mesh_Tgt_ prefix from mesh names
            if m.name.startswith("Mesh_Tgt_"):
                m.name = m.name[len("Mesh_Tgt_"):]
            if ":" in m.name:
                m.name = m.name.split(":")[-1]
            
            # Clean up vertex groups prefixes
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
    
    targets = [
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
    
    for zip_name, glb_name in targets:
        target_zip = os.path.join(src_dir, zip_name)
        out_glb = os.path.join(out_dir, glb_name)
        try:
            rig_breasts(target_zip, ref_zip, out_glb)
        except Exception as e:
            log(f"FAILED to process {zip_name}: {e}")
