"""Continuous Blender curves matching the app's shortest-arc quaternion playback."""
def make_actions_continuous(actions):
    corrected=0
    for action in actions:
        for layer in action.layers:
            for strip in layer.strips:
                for bag in strip.channelbags:
                    quaternions={}
                    for curve in bag.fcurves:
                        for key in curve.keyframe_points:key.interpolation='LINEAR'
                        if curve.data_path.endswith('rotation_quaternion'):
                            quaternions.setdefault(curve.data_path,{})[curve.array_index]=curve
                    for path,curves in quaternions.items():
                        if set(curves)!={0,1,2,3}:raise RuntimeError('Incomplete quaternion: '+path)
                        count=len(curves[0].keyframe_points)
                        if any(len(c.keyframe_points)!=count for c in curves.values()):raise RuntimeError('Inconsistent quaternion keys: '+path)
                        previous=None
                        for i in range(count):
                            values=[curves[c].keyframe_points[i].co.y for c in range(4)]
                            if previous is not None and sum(a*b for a,b in zip(previous,values))<0:
                                values=[-v for v in values];corrected+=1
                                for c in range(4):curves[c].keyframe_points[i].co.y=values[c]
                            previous=values
    return corrected
