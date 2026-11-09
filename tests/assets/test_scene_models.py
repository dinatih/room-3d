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


class SceneModelsTest(unittest.TestCase):
    def test_generated_models_preserve_meshes_animation_and_samplers(self):
        models = json.loads(builder.MANIFEST.read_text())
        for source, target in models.items():
            with self.subTest(source=source):
                original, original_bin = builder.unpack((ROOT / 'public' / source.lstrip('/')).read_bytes())
                reduced, reduced_bin = builder.unpack((ROOT / 'public' / target.lstrip('/')).read_bytes())
                image_views = {image['bufferView'] for image in original['images']}
                for key in set(original) - {'buffers', 'bufferViews', 'images'}:
                    self.assertEqual(original[key], reduced[key], key)
                self.assertEqual(len(original['bufferViews']), len(reduced['bufferViews']))
                for index, (before, after) in enumerate(zip(original['bufferViews'], reduced['bufferViews'])):
                    if index in image_views:
                        continue
                    self.assertEqual(original_bin[before.get('byteOffset', 0):before.get('byteOffset', 0) + before['byteLength']], reduced_bin[after.get('byteOffset', 0):after.get('byteOffset', 0) + after['byteLength']])
                for before, after in zip(original['images'], reduced['images']):
                    a = original['bufferViews'][before['bufferView']]
                    b = reduced['bufferViews'][after['bufferView']]
                    old = Image.open(io.BytesIO(original_bin[a.get('byteOffset', 0):a.get('byteOffset', 0) + a['byteLength']])).convert('RGBA')
                    new = Image.open(io.BytesIO(reduced_bin[b.get('byteOffset', 0):b.get('byteOffset', 0) + b['byteLength']])).convert('RGBA')
                    self.assertLessEqual(max(new.size), builder.TEXTURE_SIZE)
                    uniform = all(low == high for low, high in old.getextrema())
                    if uniform:
                        self.assertEqual(new.size, (1, 1))
                        self.assertEqual(old.getpixel((0, 0)), new.getpixel((0, 0)))
                    elif max(old.size) <= builder.TEXTURE_SIZE:
                        self.assertEqual(old.tobytes(), new.tobytes())
                    else:
                        old.thumbnail((builder.TEXTURE_SIZE, builder.TEXTURE_SIZE), Image.Resampling.LANCZOS)
                        self.assertEqual(old.tobytes(), new.tobytes())


if __name__ == '__main__':
    unittest.main()
