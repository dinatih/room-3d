# Unitree H2

Official source: https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/h2_description/H2.urdf
Repository: https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h2_description
Redistribution: BSD-3-Clause, see LICENSE.

The official 34 visual meshes are assembled from the URDF, then converted to a
humanoid character by scripts/unitree-h2-character.py. Each rigid piece has one
bone influence, with no flexible skin deformation. Arms are aligned in T-pose;
the mechanical 31-DOF control rig is replaced by an 18-bone Mixamo-compatible rig.
This visual adaptation does not enforce the real robot's joint limits.

Light panels are repainted red. Model units are meters (the Character runtime
scales to centimeters), glTF Y up, centered on X/Z and grounded at Y=0.
dimensions.json records centimeters in T-pose.

Uses the project's standard Character, retargeting and navigation systems, with
the existing walking animation as its NPC gait. No Unitree motion policy is used.

Regenerate:
```sh
python3 scripts/import-unitree.py --download --robot h2
blender -noaudio --background --python scripts/import-unitree.py -- --robot h2
```
