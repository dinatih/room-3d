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

P_src = (0.7071068, 0, 0, 0.7071068)
srcLocalQ = (-0.72328, -0.05496, 0.01116, 0.68827)

animWorldQ = quat_mult(P_src, srcLocalQ)
print("animWorldQ:", animWorldQ)
