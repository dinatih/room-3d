# Jumper — KingKong Robotics

Source: https://github.com/KingKongRobotics/jumper
Revision: `78966f45de6f2b6de3f7cea017f32a39f8b993e6`

Converted from the official URDF visual meshes to GLB with `scripts/temp_jumper.py`.
Original colours and official neutral standing pose preserved. Metres/Z-up converted to centimetres/Y-up, centered horizontally and grounded. Local joint pivots and axes retained. Official clips: hello, bow, paw, salute, maze (dance), sampled at their declared recording rates. Root orientation is retained; source trajectories contain no root translation, so vertical placement follows the lowest mesh point. Gestures play once; dance loops. Reconstructed clips: walk, turn-left, turn-right, using diagonal foot trajectories and bounded inverse kinematics, based on the official stride/frequency settings. Walk previews in place; turning previews rotate through a full circle. These three clips are visual reconstructions, not the learned locomotion policy. See animations.json for durations and provenance. Rebuild requires Python numpy and scipy; source downloads are pinned to the revision above.

Dimensions in this pose: {'w': 41.53, 'h': 17.84, 'd': 36.85} cm.

Copyright 2026 KingKong Robotics. Distributed under Apache-2.0; see LICENSE and upstream NOTICE alongside the model.
