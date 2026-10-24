# Raph Rover — Fictionlab

Source: https://github.com/RaphRover/raph_common/tree/main/raph_description

Official simulation meshes (`raph_base_link.dae`, `servo.dae`, `wheel.dae`),
assembled using the visual origins and neutral joint transforms in
`urdf/raph_macros.xacro`. MIT license reproduced in LICENSE.

Static model with separate steering/wheel groups. White/gray body panels and LED
strips repainted red to match the other robots; tires, frame and sensors preserved.
No invented sensor geometry: the upstream camera and lidar frames have no visual mesh.
Centimeters, Y up, forward +Z, centered on X/Z, grounded at Y=0.
Assimp's COLLADA-to-glTF axis conversion is undone before applying the ROS visual transforms.
Measured bounds include antennas and differ from the commercial specification.

Rebuild: download and extract the upstream repository to `/tmp/raph_common-main`,
then run:

```sh
assimp export /tmp/raph_common-main/raph_description/models/raph_base_link.dae /tmp/raph-base.glb -fglb2
assimp export /tmp/raph_common-main/raph_description/models/wheel.dae /tmp/raph-wheel.glb -fglb2
assimp export /tmp/raph_common-main/raph_description/models/servo.dae /tmp/raph-servo.glb -fglb2
node scripts/temp_raph_rover.mjs
```
