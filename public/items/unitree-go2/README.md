# Unitree GO2

Source: https://raw.githubusercontent.com/unitreerobotics/unitree_mujoco/main/unitree_robots/go2/go2.xml

Official visual meshes assembled in Blender with the original joint hierarchy and axes. Light body panels repainted red; dark sensors and rubber preserved. Centimeters, glTF Y up, centered on X/Z and grounded at Y=0.

Procedural visual animations authored for this project in src/features/scene/items/unitreeMotion.ts: idle, locomotion, greeting, bow and dance. These are not recordings or control policies from Unitree. Go2 resting joint angles come from the official MuJoCo home keyframe. No physics or autonomous navigation.

See LICENSE for upstream redistribution terms. Regenerate using scripts/import-unitree.py.
