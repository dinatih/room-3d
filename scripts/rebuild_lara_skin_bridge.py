"""Rebuild the hand-made breast/torso bridges in Lara's Blender source.

ALSOFT_DRIVERS=null blender -b --python-exit-code 1 --python scripts/rebuild_lara_skin_bridge.py
npm run optimize:glb
"""
from pathlib import Path
import importlib.util
import sys
sys.dont_write_bytecode = True
import bpy
import bmesh
import numpy as np
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
FOLDER = ROOT/'public/characters/lara'
MARKER = 'lara_curved_skin_bridges'
# These are the fourteen manually constructed faces in the original assembly.
BRIDGE_FACES = set(range(1338,1352))


def rebuild():
    obj = bpy.data.objects['body_nude_torso']
    mesh = obj.data
    bm = bmesh.new()
    bm.from_mesh(mesh)
    bm.faces.ensure_lookup_table()
    tag = bm.faces.layers.int.new('lara_skin_bridge')
    selected = [bm.faces[i] for i in sorted(BRIDGE_FACES)]
    assert all(f.material_index == 0 for f in selected), 'Unexpected bridge topology'
    for face in selected:
        face[tag] = 1
    # Split the existing edges without moving their boundary. Two cuts provide
    # three segments across each original panel, enough for a curved transition.
    edges = list({edge for face in selected for edge in face.edges})
    bmesh.ops.subdivide_edges(bm,edges=edges,cuts=2,use_grid_fill=True,smooth=0)
    patch = [f for f in bm.faces if f[tag]]
    assert len(patch)>len(selected), 'Bridge subdivision failed'
    vertices = {v for f in patch for v in f.verts}
    free = {v for v in vertices if all(f[tag] for f in v.link_faces)}
    boundary = vertices-free
    unknown = list(free)
    indices = {v:i for i,v in enumerate(unknown)}
    # Minimize the discrete surface Laplacian, including boundary rows. The
    # neighboring untouched surface therefore determines both position and slope.
    rows = list(vertices)
    matrix = np.zeros((len(rows),len(unknown)))
    rhs = np.zeros((len(rows),3))
    for row,vertex in enumerate(rows):
        neighbors = [edge.other_vert(vertex) for edge in vertex.link_edges]
        coefficients = [(vertex,float(len(neighbors)))]+[(other,-1.) for other in neighbors]
        for other,weight in coefficients:
            if other in indices:
                matrix[row,indices[other]] += weight
            else:
                rhs[row] -= weight*np.array(other.co)
    solution, residuals, rank, singular = np.linalg.lstsq(matrix,rhs,rcond=None)
    assert rank==len(unknown), 'Underdetermined bridge curvature'
    for vertex,i in indices.items():
        vertex.co = solution[i]
    uv = bm.loops.layers.uv.active
    anchors = {}
    for vertex in boundary:
        candidates = [loop[uv].uv.copy() for face in vertex.link_faces if not face[tag] for loop in face.loops if loop.vert==vertex]
        assert candidates, 'Bridge boundary has no adjacent UV'
        # Adjacent faces use the same front skin chart; preserve their border.
        anchors[vertex] = sum(candidates,Vector((0,0)))/len(candidates)
    matrix = np.zeros((len(unknown),len(unknown)))
    rhs = np.zeros((len(unknown),2))
    for vertex,i in indices.items():
        neighbors = [edge.other_vert(vertex) for edge in vertex.link_edges]
        matrix[i,i] = len(neighbors)
        for other in neighbors:
            if other in indices:
                matrix[i,indices[other]] -= 1
            else:
                rhs[i] += np.array(anchors[other])
    solution = np.linalg.solve(matrix,rhs)
    coordinates = dict(anchors)
    coordinates.update({v:Vector(solution[i]) for v,i in indices.items()})
    for face in patch:
        face.smooth = True
        for loop in face.loops:
            loop[uv].uv = coordinates[loop.vert]
    bmesh.ops.triangulate(bm,faces=patch)
    bm.to_mesh(mesh)
    bm.free()
    mesh.update()
    print('Rebuilt breast/torso bridges:',len(vertices),'vertices,',len(free),'curved interior vertices',flush=True)


def repair_hip_uvs():
    """Reconnect the isolated hip UV island to its neighboring leg skin."""
    obj = bpy.data.objects['body_nude_legs']
    mesh = obj.data
    uv = mesh.uv_layers.active.data
    # Face 1333 is the visible hip patch identified in the close-up. Follow its
    # authored UV edges to include the complete isolated island, not a box mask.
    edges = {}
    face_edges = {}
    for face in mesh.polygons:
        keys = []
        for i,loop in enumerate(face.loop_indices):
            other = face.loop_indices[(i+1)%len(face.loop_indices)]
            key = tuple(sorted(((mesh.loops[loop].vertex_index,tuple(uv[loop].uv)),
                                (mesh.loops[other].vertex_index,tuple(uv[other].uv)))))
            edges.setdefault(key,[]).append(face.index)
            keys.append(key)
        face_edges[face.index] = keys
    patch,queue = {1333},[1333]
    while queue:
        for edge in face_edges[queue.pop()]:
            for index in edges[edge]:
                if index not in patch:
                    patch.add(index)
                    queue.append(index)
    assert all(mesh.polygons[i].material_index==0 for i in patch)
    vertices = {v for i in patch for v in mesh.polygons[i].vertices}
    anchors,neighbors = {},{v:set() for v in vertices}
    for face in mesh.polygons:
        if face.index in patch:
            ids = list(face.vertices)
            for i,vertex in enumerate(ids):
                neighbors[vertex].update((ids[i-1],ids[(i+1)%len(ids)]))
        elif face.material_index==0:
            for loop in face.loop_indices:
                vertex = mesh.loops[loop].vertex_index
                if vertex in vertices:
                    anchors.setdefault(vertex,[]).append(uv[loop].uv.copy())
    pins = {v:sum(values,Vector((0,0)))/len(values) for v,values in anchors.items()}
    unknown = list(vertices-pins.keys())
    indices = {v:i for i,v in enumerate(unknown)}
    matrix,rhs = np.zeros((len(unknown),len(unknown))),np.zeros((len(unknown),2))
    for vertex,i in indices.items():
        matrix[i,i] = len(neighbors[vertex])
        for other in neighbors[vertex]:
            if other in indices:
                matrix[i,indices[other]] -= 1
            else:
                rhs[i] += np.array(pins[other])
    solution = np.linalg.solve(matrix,rhs) if unknown else []
    pins.update({v:Vector(solution[i]) for v,i in indices.items()})
    for index in patch:
        for loop in mesh.polygons[index].loop_indices:
            uv[loop].uv = pins[mesh.loops[loop].vertex_index]
    print('Reconnected isolated hip UV island:',len(patch),'faces',flush=True)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
    modified = False
    if not bpy.context.scene.get(MARKER):
        rebuild()
        bpy.context.scene[MARKER] = True
        modified = True
    spec = importlib.util.spec_from_file_location('limbs',ROOT/'scripts/separate_lara_limb_uvs.py')
    limbs = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(limbs)
    if not bpy.context.scene.get('lara_hip_uv_patch'):
        repair_hip_uvs()
        legs = bpy.data.objects['body_nude_legs']
        filename = 'body_nude_legs_0_tattoo_uv.png'
        limbs.bake_projection(legs,0,limbs.tattoo_reference(),FOLDER/'textures'/filename)
        bpy.context.scene['lara_hip_uv_patch'] = True
        modified = True
    if modified:
        limbs.verify()
        bpy.context.preferences.filepaths.save_version = 0
        bpy.ops.wm.save_as_mainfile(filepath=str(FOLDER/'lara_perfect.blend'))
    limbs.export()


if __name__=='__main__':
    main()
