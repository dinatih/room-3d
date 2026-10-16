"""Convert the selected KIT daily-life themes into reviewable Mixamo GLBs.

Run with:
  blender --background --python scripts/convert_kit_themes.py
"""

import fnmatch
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
KIT_ROOT = Path('/home/dinatih/3D Resources/animations/KIT/KIT')
OUTPUT_ROOT = ROOT / 'public/animations/npz/kit'
META_PATH = OUTPUT_ROOT / 'kit_themes_meta.json'
MANIFEST_PATH = ROOT / 'src/features/scene/animations/kitManifest.ts'

THEMES = {
    'conversation': ['*conversation*'],
    'saluts': ['wave*'],
    'boire': ['*drink*', '*drinking*'],
    'appui-table': ['lean_on_table*', 'lean_over_table*'],
    'livre': ['take_book_from_shelf*'],
    'cuisine': [
        '*stir*', '*mixing*', '*pour*', '*cutting*', '*cooking*', '*bowl*',
        '*knife*', '*egg_whisk*', '*PizzaDelivery*', '*Preparing_the_dough*',
    ],
    'douche-lavage': ['*shower*', '*wash*', '*dry_*'],
    'nettoyage-table': ['wiping_the_table*'],
}


def write_manifest(results):
    manifest = [
        "import type { AnimationDefinition } from './animationRegistry';",
        '',
        'export const KIT_ANIMATION_DEFINITIONS: AnimationDefinition[] = [',
    ]
    for item in results:
        entry = {key: item[key] for key in ('id', 'path', 'category', 'label', 'tags', 'duration')}
        manifest.append(f'  {json.dumps(entry, ensure_ascii=False)},')
    manifest.extend(['];', ''])
    MANIFEST_PATH.write_text('\n'.join(manifest))


def main():
    sys.path.insert(0, str(ROOT / 'scripts'))
    from convert_studio_life import convert

    imported_meta = ROOT / 'public/animations/npz/daily/all_trimmed_meta.json'
    imported = {
        str(Path(item['src']).resolve())
        for item in json.loads(imported_meta.read_text())
        if item.get('src')
    }

    sources = sorted(KIT_ROOT.glob('*/*_poses.npz'))
    assignments = []
    for source in sources:
        theme = next((name for name, patterns in THEMES.items()
                      if any(fnmatch.fnmatch(source.name, pattern) for pattern in patterns)), None)
        if theme and str(source.resolve()) not in imported:
            assignments.append((theme, source))

    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    results = json.loads(META_PATH.read_text()) if META_PATH.exists() else []
    for item in results:
        item['path'] = item['path'].replace('animations/npz/kit-themes/', 'animations/npz/kit/')
        source = Path(item['source'])
        stem = source.stem.lower()
        item.setdefault('id', re.sub(r'[^a-z0-9]+', '-', f"kit-{source.parent.name}-{stem}").strip('-'))
        item.setdefault('category', 'emotes_gestures' if item['theme'] in {'conversation', 'saluts'} else 'interactions')
        item.setdefault('tags', sorted(set(['kit', item['theme'], *re.findall(r'[a-z]+', stem)])))
    completed_sources = {
        item['source'] for item in results
        if (ROOT / 'public' / item['path']).exists()
    }
    assignments = [item for item in assignments if str(item[1]) not in completed_sources]
    write_manifest(results)
    total = len(assignments)
    for index, (theme, source) in enumerate(assignments, 1):
        subject = source.parent.name
        stem = re.sub(r'[^a-zA-Z0-9_-]+', '-', source.stem).strip('-').lower()
        filename = f'{subject}_{stem}.glb'
        output = OUTPUT_ROOT / theme / filename
        print(f'[{index}/{total}] {theme}: {source.name} ({subject})', flush=True)
        conversion = convert(source, output)
        results.append({
            'id': re.sub(r'[^a-z0-9]+', '-', f'kit-{subject}-{stem}'.lower()).strip('-'),
            'theme': theme,
            'label': source.stem.removesuffix('_poses'),
            'source': str(source),
            'path': output.relative_to(ROOT / 'public').as_posix(),
            'category': 'emotes_gestures' if theme in {'conversation', 'saluts'} else 'interactions',
            'tags': sorted(set(['kit', theme, *re.findall(r'[a-z]+', source.stem.lower())])),
            **conversion,
        })
        META_PATH.write_text(json.dumps(results, indent=2, ensure_ascii=False))

    write_manifest(results)

    print(f'Converted {len(results)} files. Metadata: {META_PATH}. Catalog: {MANIFEST_PATH}', flush=True)


if __name__ == '__main__':
    main()
