"""Generate 2K and 4K HDR panoramas from hdriConfig.ts. Requires oiiotool."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
config = (ROOT / 'src/features/scene/hdriConfig.ts').read_text()
for url in re.findall(r"(?<!\w)url: '([^']+\.hdr)'", config):
    source = ROOT / ('public' + url)
    for resolution, width, height in [('2k', 2048, 1024), ('4k', 4096, 2048)]:
        target = source.parent / resolution / source.name
        target.parent.mkdir(exist_ok=True)
        subprocess.run([
            'oiiotool', str(source), '--resize:filter=triangle', f'{width}x{height}',
            '-o', str(target),
        ], check=True)
        with target.open('rb') as stream:
            if f'-Y {height} +X {width}\n'.encode() not in stream.read(4096):
                raise ValueError(f'Unexpected HDR dimensions: {target}')
        subprocess.run(['oiiotool', '--info', str(target)], check=True)
        print(f'{resolution}/{target.name}: {target.stat().st_size / 1_000_000:.2f} MB', flush=True)
