#!/usr/bin/env python3
"""
render_cycles_camera.py — Rendu photoréaliste Cycles haute-fidélité via Blender.

Permet de rendre la scène 3D ou un modèle avec le moteur de Raytracing Cycles
de Blender 5.2+ avec illumination globale, caustiques et débruitage OpenImageDenoise.

Usage:
  blender -b -P scripts/render_cycles_camera.py -- [options]
  ou
  python3 scripts/render_cycles_camera.py --cam-pos 150,1000,-150 --samples 256
"""

import sys
import os
import argparse

def run_cycles_render(glb_path, out_path, cam_pos, cam_target, fov=50.0, samples=256, res_x=1920, res_y=1080):
    try:
        import bpy
        import mathutils
    except ImportError:
        print("[Cycles] Exécution hors de Blender détectée. Lancement via le binaire Blender...")
        import subprocess
        cmd = [
            'blender', '-b', '-P', __file__, '--',
            '--glb', glb_path,
            '--out', out_path,
            '--cam-pos', f"{cam_pos[0]},{cam_pos[1]},{cam_pos[2]}",
            '--cam-target', f"{cam_target[0]},{cam_target[1]},{cam_target[2]}",
            '--fov', str(fov),
            '--samples', str(samples),
            '--res-x', str(res_x),
            '--res-y', str(res_y)
        ]
        subprocess.run(cmd, check=True)
        return

    import bpy
    import mathutils

    print(f"[Cycles] Initialisation de la scène avec Cycles ({samples} samples)...")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene

    # Configuration moteur Cycles
    scene.render.engine = 'CYCLES'
    cycles = scene.cycles
    cycles.samples = samples
    cycles.use_denoising = True
    cycles.denoiser = 'OPENIMAGEDENOISE'

    # Résolution
    scene.render.resolution_x = res_x
    scene.render.resolution_y = res_y
    scene.render.resolution_percentage = 100
    scene.render.image_settings.file_format = 'PNG'

    # Import du GLB
    if os.path.exists(glb_path):
        print(f"[Cycles] Importation du modèle: {glb_path}")
        bpy.ops.import_scene.gltf(filepath=glb_path)
    else:
        print(f"[Cycles] Attention: Modèle {glb_path} non trouvé. Création d'une boîte de test.")
        bpy.ops.mesh.primitive_cube_add(size=2)

    # Configuration Caméra
    cam_data = bpy.data.cameras.new(name='CyclesCamera')
    cam_data.angle = fov * (3.14159265 / 180.0)
    cam_obj = bpy.data.objects.new(name='CyclesCamera', object_data=cam_data)
    scene.collection.objects.link(cam_obj)
    scene.camera = cam_obj

    # Positionnement (conversion cm Three.js vers m Blender si besoin, facteur 0.01)
    scale = 0.01
    c_pos = mathutils.Vector((cam_pos[0] * scale, -cam_pos[2] * scale, cam_pos[1] * scale))
    t_pos = mathutils.Vector((cam_target[0] * scale, -cam_target[2] * scale, cam_target[1] * scale))

    cam_obj.location = c_pos
    direction = t_pos - c_pos
    rot_quat = direction.to_track_quat('-Z', 'Y')
    cam_obj.rotation_euler = rot_quat.to_euler()

    # Lumière solaire douce
    sun_data = bpy.data.lights.new(name='Sun', type='SUN')
    sun_data.energy = 3.5
    sun_data.angle = 0.1
    sun_obj = bpy.data.objects.new(name='Sun', object_data=sun_data)
    sun_obj.rotation_euler = (0.7, 0.2, 0.9)
    scene.collection.objects.link(sun_obj)

    # Rendu
    os.makedirs(os.path.dirname(os.path.abspath(out_path)), exist_ok=True)
    scene.render.filepath = os.path.abspath(out_path)
    print(f"[Cycles] Lancement du rendu vers: {scene.render.filepath}")
    bpy.ops.render.render(write_still=True)
    print("[Cycles] Rendu terminé avec succès !")

if __name__ == '__main__':
    args_list = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    parser = argparse.ArgumentParser(description="Rendu Raytracing Cycles")
    parser.add_argument('--glb', default='public/models/room.glb', help="Chemin du GLB")
    parser.add_argument('--out', default='public/renders/cycles_render.png', help="Chemin image de sortie")
    parser.add_argument('--cam-pos', default='150,1000,-150', help="Position caméra X,Y,Z")
    parser.add_argument('--cam-target', default='150,450,200', help="Cible caméra X,Y,Z")
    parser.add_argument('--fov', type=float, default=50.0, help="Champ de vision")
    parser.add_argument('--samples', type=int, default=128, help="Échantillons Cycles")
    parser.add_argument('--res-x', type=int, default=1920, help="Largeur")
    parser.add_argument('--res-y', type=int, default=1080, help="Hauteur")

    parsed = parser.parse_args(args_list)
    c_pos = [float(x) for x in parsed.cam_pos.split(',')]
    t_pos = [float(x) for x in parsed.cam_target.split(',')]

    run_cycles_render(
        parsed.glb,
        parsed.out,
        c_pos,
        t_pos,
        parsed.fov,
        parsed.samples,
        parsed.res_x,
        parsed.res_y
    )
