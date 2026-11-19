"""Ensure reduced previews keep geometry, materials, UVs and normal/alpha images."""
import importlib.util
import io
import json
from pathlib import Path
import unittest
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('scene_models', ROOT / 'scripts/build-scene-models.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)


class BobPreviewsTest(unittest.TestCase):
    def test_geometry_and_non_image_data_are_unchanged(self):
        entries = json.loads((ROOT / 'docs/bob-preview-optimization.json').read_text())
        for entry in entries:
            with self.subTest(source=entry['source']):
                # Reports contain absolute paths for review, but tests remain checkout-independent.
                original_path = ROOT / 'public/items' / Path(entry['source']).relative_to(Path(entry['source']).parents[1])
                reduced_path = ROOT / 'public/items' / Path(entry['target']).relative_to(Path(entry['target']).parents[1])
                original, a = builder.unpack(original_path.read_bytes())
                reduced, b = builder.unpack(reduced_path.read_bytes())
                self.assertLess(len(b), len(a))
                for key in set(original) - {'buffers', 'bufferViews', 'images'}:
                    self.assertEqual(original[key], reduced[key], key)
                self.assertEqual(len(original['bufferViews']), len(reduced['bufferViews']))
                image_views = {image['bufferView'] for image in original['images']}
                for index, (before, after) in enumerate(zip(original['bufferViews'], reduced['bufferViews'])):
                    if index not in image_views:
                        self.assertEqual(a[before.get('byteOffset', 0):before.get('byteOffset', 0) + before['byteLength']], b[after.get('byteOffset', 0):after.get('byteOffset', 0) + after['byteLength']])
                for change in entry['images']:
                    image = reduced['images'][change['image']]
                    view = reduced['bufferViews'][image['bufferView']]
                    texture = Image.open(io.BytesIO(b[view.get('byteOffset', 0):view.get('byteOffset', 0) + view['byteLength']]))
                    self.assertEqual(list(texture.size), change['after'])
                    self.assertEqual(original['images'][change['image']].get('name'), image.get('name'))


if __name__ == '__main__':
    unittest.main()
