"""Build reduced inventory previews; keep source GLBs for detailed inspection.
Run with system Python (Pillow): python scripts/build-bob-preview-models.py
Uses the existing GLB image builder and preserves every non-image buffer.
"""
import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('scene_models', ROOT / 'scripts/build-scene-models.py')
builder = importlib.util.module_from_spec(spec)
spec.loader.exec_module(builder)
# Preview tiers retain four times the scene-tier pixel count or more.
MODELS = [('bob-red/BobRed.glb', 'bob-red/BobRed-preview-1024.glb', 1024),
          ('bob-droit-red/BobDroitRed.glb', 'bob-droit-red/BobDroitRed-preview-2048.glb', 2048)]
report = []
for source, target, size in MODELS:
    original = ROOT / 'public/items' / source
    reduced = ROOT / 'public/items' / target
    data = original.read_bytes()
    output, images = builder.build_model(data, max_size=size)
    reduced.write_bytes(output)
    report.append({'source': str(original), 'target': str(reduced), 'bytesBefore': len(data), 'bytesAfter': len(output), 'images': images})
(ROOT / 'docs/bob-preview-optimization.json').write_text(json.dumps(report, indent=2) + '\n')
print(json.dumps(report, indent=2))
