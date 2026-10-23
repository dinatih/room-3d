# Unitree As2-W

Source: https://github.com/unitreerobotics/unitree_ros/tree/master/robots/as2w_description
License: BSD-3-Clause (see LICENSE). Original description: as2w.urdf.

Official rigid meshes and motor pivots: 12 leg joints and four continuous wheel
joints, plus the fixed JT128 sensor. Leg limits are retained in glTF extras.
The project's reference stance uses thigh=0.9 and calf=-1.8 radians, within the
URDF limits. This is an authored stance, not an official Unitree control policy.
Light panels are red; wheels and sensor are dark. Units: centimeters, Y up,
forward +Z, centered on X/Z, tires grounded at Y=0. Draco-compressed meshes.

Visual animations: idle, rolling, crouching, bowing and dance. Rolling uses the
actual wheel radii and traveled distance, including differential wheel travel
when turning. Legs and wheels rotate as rigid pieces; no mesh deformation.
The shared robot controller provides garden navigation. No physical simulation.

Regenerate:
```sh
python3 scripts/import-unitree.py --download --robot as2w
blender -noaudio --background --python scripts/import-unitree.py -- --robot as2w
```
