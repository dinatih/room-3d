import math

def quat_mult(q1, q2):
    x1, y1, z1, w1 = q1
    x2, y2, z2, w2 = q2
    return (
        w1*x2 + x1*w2 + y1*z2 - z1*y2,
        w1*y2 - x1*z2 + y1*w2 + z1*x2,
        w1*z2 + x1*y2 - y1*x2 + z1*w2,
        w1*w2 - x1*x2 - y1*y2 - z1*z2
    )

Armature = (0.7071068286895752, 0, 0, 0.7071068286895752)
Hips = (-0.70252525806427, 0, 0, 0.7116588950157166)

Q_src = quat_mult(Armature, Hips)
print("Q_src:", Q_src)
