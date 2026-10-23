"""Regression checks for contact-aware Inter-X ankle cleanup."""
import json
import subprocess
import unittest

import numpy as np
from interx_catalog import DEFAULT_SOURCE, MANIFEST, ROOT, SOURCE_FPS, glb_document, glb_info
from interx_foot_support import correct_foot_support, load_model, rotations


def fixture(count):
    parents = np.array([-1, 0, 0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 9, 9, 12, 13, 14, 16, 17, 18, 19])
    vertices = np.zeros((26, 3)); vertices[:22, 1] = 1
    for side, hip, knee, ankle, toe, heel, tip in [(1, 1, 4, 7, 10, 22, 23), (-1, 2, 5, 8, 11, 24, 25)]:
        vertices[[hip, knee, ankle, toe, heel, tip], 0] = side * .1
        vertices[[hip, knee, ankle, toe, heel, tip], 1] = [1, .55, .1, .03, 0, 0]
        vertices[[toe, heel, tip], 2] = [.15, -.05, .25]
    weights = np.zeros((26, 22)); weights[:22, 0] = 1
    weights[22, 7] = weights[23, 10] = weights[24, 8] = weights[25, 11] = 1
    model = {'v_template': vertices, 'shapedirs': np.zeros((26, 3, 1)), 'J_regressor': np.eye(22, 26), 'weights': weights, 'kintree_table': np.array([parents])}
    motion = {'betas': np.zeros(1), 'pose_body': np.zeros((count, 21, 3)), 'root_orient': np.zeros((count, 3)), 'trans': np.zeros((count, 3)), 'pose_lhand': np.zeros((count, 15, 3))}
    return model, motion


class SupportTests(unittest.TestCase):
    def test_stationary_dorsiflexion_is_removed_without_freezing_toes(self):
        model, motion = fixture(20)
        motion['pose_body'][:, [6, 7], 0] = np.deg2rad(-20)
        motion['pose_body'][:, 9, 0] = np.linspace(0, np.deg2rad(15), 20)
        original = motion['pose_body'].copy()
        corrected, _ = correct_foot_support(motion, model)
        np.testing.assert_allclose(corrected['pose_body'][:, [6, 7]], 0, atol=1e-12)
        np.testing.assert_array_equal(corrected['pose_body'][:, 9], original[:, 9])
        np.testing.assert_array_equal(motion['pose_body'], original)
        for key in ['trans', 'root_orient', 'pose_lhand']:
            np.testing.assert_array_equal(corrected[key], motion[key])

    def test_heel_strike_and_toe_off_survive(self):
        model, motion = fixture(25)
        pitch = np.deg2rad(np.tile([0, 20, 0, -25, 0], 5))
        motion['pose_body'][:, [6, 7], 0] = -pitch[:, None]
        corrected, report = correct_foot_support(motion, model)
        np.testing.assert_array_equal(corrected['pose_body'], motion['pose_body'])
        self.assertTrue(all(np.all(foot['correction'] == 0) for foot in report))

    def test_lifted_dorsiflexed_foot_remains_free(self):
        model, motion = fixture(20)
        motion['pose_body'][:, 0, 0] = np.deg2rad(60)
        motion['pose_body'][:, 3, 0] = np.deg2rad(-120)
        motion['pose_body'][:, 6, 0] = np.deg2rad(40)
        corrected, report = correct_foot_support(motion, model)
        self.assertTrue(np.all(report[0]['support'] == 0))
        np.testing.assert_array_equal(corrected['pose_body'], motion['pose_body'])

    def test_cleanup_never_forces_plantarflexion(self):
        model, motion = fixture(120)
        pitch = np.deg2rad(20 + 2 * np.sin(np.linspace(0, 6 * np.pi, 120)))
        motion['pose_body'][:, [6, 7], 0] = -pitch[:, None]
        corrected, report = correct_foot_support(motion, model)
        for foot in report:
            self.assertTrue(np.all(foot['correction'] >= 0))
            self.assertTrue(np.all(foot['correction'] <= np.maximum(foot['pitch'], 0)))
        direction = rotations(corrected['pose_body'][:, 6]) @ np.array([0., 0., 1.])
        self.assertGreaterEqual(direction[:, 1].min(), -1e-12)


def verify_assets():
    manifest = json.loads(MANIFEST.read_text())
    relative = 'src/features/scene/animations/interx_manifest.json'
    before = json.loads(subprocess.check_output(['git', 'show', 'HEAD:' + relative], cwd=ROOT))
    comparison = json.loads(json.dumps(manifest))
    for old_duo, new_duo in zip(before['duos'], comparison['duos']):
        old_duo.pop('footSupport', None)
        new_duo.pop('footSupport', None)
        for person in ['p1', 'p2']:
            for field in ['sha256', 'sizeBytes']:
                new_duo['clips'][person][field] = old_duo['clips'][person][field]
    assert before == comparison, relative + ' changed unrelated metadata'
    checked = changed = 0
    def tracks(doc, data):
        import struct
        length = struct.unpack_from('<I', data, 12)[0]; binary = data[28 + length:]
        def value(index):
            a = doc['accessors'][index]; v = doc['bufferViews'][a['bufferView']]
            size = {'SCALAR': 1, 'VEC3': 3, 'VEC4': 4}[a['type']]
            return np.frombuffer(binary, dtype='<f4', count=a['count'] * size, offset=v.get('byteOffset', 0) + a.get('byteOffset', 0)).copy()
        return {(doc['nodes'][c['target']['node']]['name'], c['target']['path']): (value(doc['animations'][0]['samplers'][c['sampler']]['input']), value(doc['animations'][0]['samplers'][c['sampler']]['output'])) for c in doc['animations'][0]['channels']}
    for duo in manifest['duos']:
        for person, clip in duo['clips'].items():
            path = ROOT / 'public' / clip['path']; info = glb_info(path)
            assert all(info[key] == clip[key] for key in info), str(path)
            relative = str(path.relative_to(ROOT))
            before = subprocess.check_output(['git', 'show', 'HEAD:' + relative], cwd=ROOT)
            after, doc = glb_document(path)
            if duo.get('footSupport') is None:
                assert before == after, relative + ' changed an unsupported action'
                continue
            import struct
            length = struct.unpack_from('<I', before, 12)[0]; old_doc = json.loads(before[20:20 + length])
            assert doc['nodes'] == old_doc['nodes'], relative + ' changed the rig'
            old_tracks = tracks(old_doc, before); new_tracks = tracks(doc, after)
            assert old_tracks.keys() == new_tracks.keys()
            with np.load(DEFAULT_SOURCE / duo['source'][person], allow_pickle=False) as data:
                motion = {key: data[key] for key in data.files}
            model = load_model(DEFAULT_SOURCE.parent.parent / f"SMPLX_{str(motion['gender'].item()).upper()}.npz")
            _, support = correct_foot_support(motion, model)
            for (name, prop), (times, values) in old_tracks.items():
                new_times, new_values = new_tracks[(name, prop)]
                if name.endswith(('LeftFoot', 'RightFoot')) and prop == 'rotation':
                    quaternions = new_values.reshape(-1, 4)
                    np.testing.assert_allclose(np.linalg.norm(quaternions, axis=1), 1, atol=1e-6)
                    assert np.all(np.sum(quaternions[1:] * quaternions[:-1], axis=1) >= 0), relative + ' quaternion discontinuity'
                    foot = support[0 if name.endswith('LeftFoot') else 1]
                    untouched = foot['correction'][np.rint(new_times * SOURCE_FPS).astype(int)] == 0
                    old_values = values.reshape(-1, 4)
                    if not np.array_equal(times, new_times):
                        assert np.all(old_values == old_values[0])
                        old_values = np.repeat(old_values[:1], len(new_times), axis=0)
                    np.testing.assert_array_equal(old_values[untouched], quaternions[untouched], err_msg=relative + ' altered a free foot')
                    continue
                np.testing.assert_array_equal(times, new_times, err_msg=relative + name)
                np.testing.assert_array_equal(values, new_values, err_msg=relative + name)
            checked += 1; changed += before != after
    print(f'Verified {checked} supported clips ({changed} changed); every other track and unsupported action is byte-identical.')


if __name__ == '__main__':
    import sys
    if '--assets' in sys.argv:
        verify_assets()
    else:
        unittest.main()
