# Unitree H2

Official source: https://raw.githubusercontent.com/unitreerobotics/unitree_ros/master/robots/h2_description/H2.urdf
Repository: https://github.com/unitreerobotics/unitree_ros/tree/master/robots/h2_description
Redistribution: BSD-3-Clause, see LICENSE.

The 34 official visual meshes retain the URDF motor hierarchy, pivots, axes and
31 angular limits. scripts/unitree-h2-character.py exports one bone per original
link and one rigid influence per piece. Intermediate motor housings follow their
own joints. No mesh bends, stretches or slides along the skeleton.

A separate humanoid reference is stored as metadata, solely for converting the
project's human animation clips into constrained motor rotations. It is not the
visible robot's rig. The resulting motion approximates the source where the
robot cannot reproduce it. This is a visual adaptation, not a balance controller,
collision solver or executable policy for a physical H2.

Light panels are repainted red. Model units are meters (the Character runtime
scales to centimeters), glTF Y up, forward -Z (north), centered on X/Z and grounded
at Y=0. dimensions.json records centimeters in the original URDF neutral pose.

Uses the standard Character animation pipeline, including walking, while listed
and placed with the robots. It is stationary by default and has no autonomous
human NPC activities. Each source clip's initial heading is normalized so Miley
idle and Mixamo walking face the same direction. No Unitree motion policy is used.

The neck pitch pivot is centered along its motor shaft for a readable axial
skeleton. Moving a point along that same shaft leaves the rotation axis and the
rigid link motion unchanged; the downstream bind transforms are compensated.

Regenerate:
```sh
python3 scripts/import-unitree.py --download --robot h2
blender -noaudio --background --python scripts/import-unitree.py -- --robot h2
```
