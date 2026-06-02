"""Re-rig Lara mesh onto Mixamo Y Bot skeleton (Perfect version for lara_croft.glb).

Snap Y Bot armature bones to Lara's T-pose using joint-to-joint snapping and
roll alignment, transfer Lara vertex groups to Mixamo bones, reparent meshes
to the Mixamo armature, and export.
"""
import math
import sys
import bpy
from mathutils import Matrix, Vector

LARA_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/lara_croft.glb"
YBOT_GLB = "/home/dinatih/Projects/room-3d/public/media/glb/y_bot_from_mixamo.glb"
OUT_GLB  = "/home/dinatih/Projects/room-3d/public/media/glb/lara_croft_mixamo.glb"


LARA_PREFIX_TO_MIX = {
    "pelvis": "mixamorig:Hips",
    "spine lower": "mixamorig:Spine",
    "spine upper": "mixamorig:Spine2",
    "head neck lower": "mixamorig:Neck",
    "head neck upper": "mixamorig:Head",
    
    # Left arm/leg
    "arm left shoulder 1": "mixamorig:LeftShoulder",
    "arm left shoulder 2": "mixamorig:LeftArm",
    "arm left elbow": "mixamorig:LeftForeArm",
    "arm left wrist": "mixamorig:LeftHand",
    "leg left thigh": "mixamorig:LeftUpLeg",
    "leg left knee": "mixamorig:LeftLeg",
    "leg left ankle": "mixamorig:LeftFoot",
    "leg left toes": "mixamorig:LeftToeBase",
    
    # Right arm/leg
    "arm right shoulder 1": "mixamorig:RightShoulder",
    "arm right shoulder 2": "mixamorig:RightArm",
    "arm right elbow": "mixamorig:RightForeArm",
    "arm right wrist": "mixamorig:RightHand",
    "leg right thigh": "mixamorig:RightUpLeg",
    "leg right knee": "mixamorig:RightLeg",
    "leg right ankle": "mixamorig:RightFoot",
    "leg right toes": "mixamorig:RightToeBase",
}

# Add fingers programmatically
for side in ["left", "right"]:
    side_mix = "Left" if side == "left" else "Right"
    for f_idx, f_name in [("1", "Thumb"), ("2", "Index"), ("3", "Middle"), ("4", "Ring"), ("5", "Pinky")]:
        for seg_idx, seg_let in enumerate(["a", "b", "c"], 1):
            lara_pref = f"arm {side} finger {f_idx}{seg_let}"
            mix_bone = f"mixamorig:{side_mix}Hand{f_name}{seg_idx}"
            LARA_PREFIX_TO_MIX[lara_pref] = mix_bone


def fallback_for(name: str) -> str:
    if name.startswith("weapon left"):
        return "mixamorig:LeftHand"
    if name.startswith("weapon right"):
        return "mixamorig:RightHand"
    if name.startswith("head "):
        return "mixamorig:Head"
    if name == "glasses_087":
        return "mixamorig:Head"
    if name.startswith("root ground"):
        return "mixamorig:Hips"
    if name.startswith("breast "):
        return "mixamorig:Spine2"
    if name.startswith("arm left fix forearm 1"):
        return "mixamorig:LeftForeArm"
    if name.startswith("arm right fix forearm 1"):
        return "mixamorig:RightForeArm"
    return ""


def log(msg):
    print(f"[retarget-perfect-croft] {msg}", flush=True)


def wipe():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def select_only(obj):
    bpy.ops.object.select_all(action="DESELECT")
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj


def import_glb(path: str):
    pre = set(bpy.context.scene.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.context.scene.objects if o not in pre]


def flatten_to_world(objects):
    in_set = set(objects)
    snaps = {o.name: o.matrix_world.copy() for o in objects}

    for o in list(objects):
        if o.parent and o.parent in in_set:
            select_only(o)
            bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
            snaps[o.name] = o.matrix_world.copy()

    seen_data = set()
    for o in objects:
        if o.type not in {"ARMATURE", "MESH"} or o.data is None:
            continue
        if o.data.name in seen_data:
            continue
        seen_data.add(o.data.name)
        o.data.transform(snaps[o.name])
        o.matrix_world = Matrix.Identity(4)


def ensure_z_up(objects, armature_obj, sample_bones):
    sample = None
    for name in sample_bones:
        if name in armature_obj.data.bones:
            sample = armature_obj.data.bones[name].head_local
            log(f"sample bone {name} head_local post-flatten: {sample}")
            break
    if sample is None:
        log("no sample bone found — skip z-up")
        return
    if not (abs(sample.y) > abs(sample.z) and abs(sample.y) > 0.3):
        log("already Z-up")
        return

    log("rotating data +90 X to Z-up")
    R = Matrix.Rotation(math.pi / 2, 4, "X")
    seen_data = set()
    for o in objects:
        if o.type not in {"ARMATURE", "MESH"} or o.data is None:
            continue
        if o.data.name in seen_data:
            continue
        seen_data.add(o.data.name)
        o.data.transform(R)


def snapshot_bone_world(arm_obj):
    M = arm_obj.matrix_world
    return {
        b.name: (M @ b.head_local, M @ b.tail_local)
        for b in arm_obj.data.bones
    }


def main():
    wipe()

    # 1) Import Lara
    log(f"importing Lara: {LARA_GLB}")
    lara_objs = import_glb(LARA_GLB)
    lara_arm = next(o for o in lara_objs if o.type == "ARMATURE")
    log(f"lara armature: {lara_arm.name} bones={len(lara_arm.data.bones)}")

    flatten_to_world(lara_objs)
    ensure_z_up(lara_objs, lara_arm,
                ("head neck upper_06", "pelvis_082", "spine upper_04"))
    lara_world = snapshot_bone_world(lara_arm)
    log(f"lara pelvis world: {lara_world.get('pelvis_082')}")
    log(f"lara head world: {lara_world.get('head neck upper_06')}")

    lara_meshes = [o for o in lara_objs if o.type == "MESH"]
    # drop helper icospheres
    for m in list(lara_meshes):
        if "Icosphere" in m.name:
            log(f"removing helper mesh {m.name}")
            bpy.data.objects.remove(m, do_unlink=True)
            lara_meshes.remove(m)
    log(f"lara meshes: {len(lara_meshes)}")
    for m in lara_meshes:
        m.name = "LARA_" + m.name
    lara_arm.name = "LARA_ARM"

    # 2) Import Y Bot
    log(f"importing Y Bot: {YBOT_GLB}")
    ybot_objs = import_glb(YBOT_GLB)
    ybot_arm = next(o for o in ybot_objs if o.type == "ARMATURE")
    log(f"ybot armature: {ybot_arm.name} bones={len(ybot_arm.data.bones)}")

    # Strip suffix from bone names
    import re
    select_only(ybot_arm)
    bpy.ops.object.mode_set(mode="EDIT")
    suffix_re = re.compile(r"_\d+$")
    renamed = 0
    for eb in list(ybot_arm.data.edit_bones):
        clean = suffix_re.sub("", eb.name)
        if clean != eb.name and clean not in ybot_arm.data.edit_bones:
            eb.name = clean
            renamed += 1
    bpy.ops.object.mode_set(mode="OBJECT")
    log(f"stripped suffix from {renamed} ybot bones")

    flatten_to_world(ybot_objs)
    ensure_z_up(ybot_objs, ybot_arm,
                ("mixamorig:Head", "mixamorig:Spine2", "mixamorig:Spine"))

    # drop Y Bot meshes
    for o in ybot_objs:
        if o.type == "MESH":
            log(f"removing ybot mesh {o.name}")
            bpy.data.objects.remove(o, do_unlink=True)

    # 3) Snapshot Y-Bot original properties (Edit Mode)
    select_only(ybot_arm)
    bpy.ops.object.mode_set(mode="EDIT")
    ybot_orig = {}
    for eb in ybot_arm.data.edit_bones:
        ybot_orig[eb.name] = {
            "orig_len": eb.length,
            "orig_dir": (eb.tail - eb.head).normalized(),
            "orig_z": eb.matrix.col[2].to_3d().normalized(),
            "orig_head": eb.head.copy(),
            "orig_tail": eb.tail.copy()
        }
    bpy.ops.object.mode_set(mode="OBJECT")

    # 4) Calculate snapping targets
    def find_lara_bone_by_prefix(prefix: str):
        for name in lara_world.keys():
            if name.startswith(prefix):
                return name
        return None

    # Set up snapping targets
    targets = {}
    
    # 4.1) Main mapped bones
    for lara_pref, mix_bone in LARA_PREFIX_TO_MIX.items():
        lara_name = find_lara_bone_by_prefix(lara_pref)
        if lara_name:
            targets[mix_bone] = (lara_world[lara_name][0].copy(), lara_world[lara_name][1].copy())
        else:
            log(f"warning: could not find lara bone for prefix '{lara_pref}'")
            
    # 4.2) Adjust hips, spine chain
    pelvis = find_lara_bone_by_prefix("pelvis")
    spine_lower = find_lara_bone_by_prefix("spine lower")
    spine_upper = find_lara_bone_by_prefix("spine upper")
    neck = find_lara_bone_by_prefix("head neck lower")
    
    if pelvis and spine_lower and spine_upper and neck:
        pelvis_head = lara_world[pelvis][0]
        spine_head = lara_world[spine_lower][0]
        neck_head = lara_world[neck][0]
        
        # Divide the back height (from spine_head to neck_head) into three equal segments
        # to place the upper chest bone (mixamorig:Spine2) in the upper chest,
        # starting at the top of the solar plexus (around 66% of the back height).
        total_back_vec = neck_head - spine_head
        spine1_head = spine_head + total_back_vec * 0.333
        spine2_chest_head = spine_head + total_back_vec * 0.666
        
        targets["mixamorig:Hips"] = (pelvis_head.copy(), spine_head.copy())
        targets["mixamorig:Spine"] = (spine_head.copy(), spine1_head.copy())
        targets["mixamorig:Spine1"] = (spine1_head.copy(), spine2_chest_head.copy())
        targets["mixamorig:Spine2"] = (spine2_chest_head.copy(), neck_head.copy())
        
    # 4.2b) Adjust Head bone tail to point straight up to the top of the skull
    head_bone = find_lara_bone_by_prefix("head neck upper")
    if head_bone:
        head_head = lara_world[head_bone][0]
        new_head_tail = head_head.copy()
        new_head_tail.z = head_head.z + 0.175
        new_head_tail.y = head_head.y
        new_head_tail.x = head_head.x
        targets["mixamorig:Head"] = (head_head.copy(), new_head_tail)
        
    # 4.2c) Adjust foot and toe bones to lie flat/forward to prevent curling and reduce toe_End length
    for side in ["Left", "Right"]:
        toe_base_name = f"mixamorig:{side}ToeBase"
        toe_end_name = f"mixamorig:{side}Toe_End"
        if toe_base_name in targets:
            head, tail = targets[toe_base_name]
            new_tail = head.copy()
            new_tail.y = head.y - 0.06  # 6 cm forward length
            new_tail.z = head.z         # keep it flat!
            targets[toe_base_name] = (head, new_tail)
            
            end_head = new_tail.copy()
            end_tail = end_head.copy()
            end_tail.y = end_head.y - 0.04  # 4 cm forward length
            targets[toe_end_name] = (end_head, end_tail)
        
    # 4.3) Adjust shoulders (no-op now since LeftShoulder/RightShoulder map directly to arm left/right shoulder 1)
    pass
        
    # 4.4) Adjust hands (tails to middle finger heads)
    left_wrist = find_lara_bone_by_prefix("arm left wrist")
    right_wrist = find_lara_bone_by_prefix("arm right wrist")
    left_middle1 = find_lara_bone_by_prefix("arm left finger 3a")
    right_middle1 = find_lara_bone_by_prefix("arm right finger 3a")
    if left_wrist and left_middle1:
        targets["mixamorig:LeftHand"] = (lara_world[left_wrist][0].copy(), lara_world[left_middle1][0].copy())
    if right_wrist and right_middle1:
        targets["mixamorig:RightHand"] = (lara_world[right_wrist][0].copy(), lara_world[right_middle1][0].copy())

    # Close the gap between elbow tail and wrist head by forcing Left/RightForeArm tail to snap to Left/RightHand head
    if "mixamorig:LeftForeArm" in targets and "mixamorig:LeftHand" in targets:
        targets["mixamorig:LeftForeArm"] = (targets["mixamorig:LeftForeArm"][0], targets["mixamorig:LeftHand"][0].copy())
    if "mixamorig:RightForeArm" in targets and "mixamorig:RightHand" in targets:
        targets["mixamorig:RightForeArm"] = (targets["mixamorig:RightForeArm"][0], targets["mixamorig:RightHand"][0].copy())

    # 5) Perform bone snapping & roll alignment in Edit Mode
    select_only(ybot_arm)
    bpy.ops.object.mode_set(mode="EDIT")
    
    # Pass 1: Set head/tail for mapped bones
    for name, bone in ybot_arm.data.edit_bones.items():
        if name in targets:
            head, tail = targets[name]
            bone.head = head
            bone.tail = tail
            
    # Pass 2: Set head/tail for unmapped bones (leaves, ends, etc.)
    for name, bone in ybot_arm.data.edit_bones.items():
        if name not in targets:
            if bone.parent:
                bone.head = bone.parent.tail
            orig = ybot_orig.get(name)
            if orig:
                bone.tail = bone.head + orig["orig_dir"] * orig["orig_len"]

    # Pass 3: Align rolls to preserve original local coordinate frames
    for name, bone in ybot_arm.data.edit_bones.items():
        orig = ybot_orig.get(name)
        if orig:
            bone.align_roll(orig["orig_z"])

    bpy.ops.object.mode_set(mode="OBJECT")
    log("snapped Mixamo bones to Lara joints and aligned rolls successfully")

    # 6) Transfer meshes & weights
    rename_full = {}
    for b in lara_arm.data.bones:
        matched = False
        for lara_pref, mix_bone in LARA_PREFIX_TO_MIX.items():
            if b.name.startswith(lara_pref):
                rename_full[b.name] = mix_bone
                matched = True
                break
        if not matched:
            fb = fallback_for(b.name)
            if fb:
                rename_full[b.name] = fb
            else:
                rename_full[b.name] = "mixamorig:Hips"
                
    log(f"rename map size: {len(rename_full)} of {len(lara_arm.data.bones)} lara bones")

    for mesh in lara_meshes:
        for mod in list(mesh.modifiers):
            if mod.type == "ARMATURE":
                mesh.modifiers.remove(mod)

        if "_rootJoint" in mesh.vertex_groups:
            mesh.vertex_groups.remove(mesh.vertex_groups["_rootJoint"])

        idx_to_name = {vg.index: vg.name for vg in mesh.vertex_groups}
        if not idx_to_name:
            log(f"mesh {mesh.name} has no vertex groups — skipping skin transfer")
            mesh.parent = ybot_arm
            mesh.matrix_parent_inverse = ybot_arm.matrix_world.inverted()
            continue

        targets_set = set()
        for src_name in idx_to_name.values():
            tgt = rename_full.get(src_name, "mixamorig:Hips")
            targets_set.add(tgt)

        per_vert = {}
        for v in mesh.data.vertices:
            for g in v.groups:
                src_name = idx_to_name.get(g.group)
                if src_name is None:
                    continue
                tgt = rename_full.get(src_name, "mixamorig:Hips")
                d = per_vert.setdefault(v.index, {})
                d[tgt] = d.get(tgt, 0.0) + g.weight

        for vg in list(mesh.vertex_groups):
            mesh.vertex_groups.remove(vg)

        for tgt in targets_set:
            mesh.vertex_groups.new(name=tgt)

        for vidx, weights in per_vert.items():
            for tgt, w in weights.items():
                w = max(0.0, min(1.0, w))
                mesh.vertex_groups[tgt].add([vidx], w, "REPLACE")

        mesh.parent = ybot_arm
        mesh.matrix_parent_inverse = ybot_arm.matrix_world.inverted()
        mod = mesh.modifiers.new(name="Armature", type="ARMATURE")
        mod.object = ybot_arm
        mod.use_vertex_groups = True

    # 7) Drop old Lara armature
    bpy.data.objects.remove(lara_arm, do_unlink=True)
    ybot_arm.name = "lara_mixamo_armature"

    # 8) Export
    bpy.ops.object.select_all(action="DESELECT")
    ybot_arm.select_set(True)
    bpy.context.view_layer.objects.active = ybot_arm
    for m in lara_meshes:
        m.select_set(True)

    log(f"exporting perfect rig GLB to {OUT_GLB}")
    for o in bpy.context.scene.objects:
        o.scale = (1.0, 1.0, 1.0)

    bpy.ops.export_scene.gltf(
        filepath=OUT_GLB,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_animations=False,
        export_yup=True,
        export_def_bones=False,
        export_rest_position_armature=True,
    )
    log("done")


if __name__ == "__main__":
    main()
