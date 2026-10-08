"""Generate mobile HDR panoramas from hdriConfig.ts. Requires oiiotool."""
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
config = (ROOT / 'src/features/scene/hdriConfig.ts').read_text()
for url in re.findall(r"(?<!\w)url: '([^']+\.hdr)'", config):
    source = ROOT / ('public' + url)
    target = source.parent / '2k' / source.name
    target.parent.mkdir(exist_ok=True)
    subprocess.run([
        'oiiotool', str(source), '--resize:filter=triangle', '2048x1024',
        '-o', str(target),
    ], check=True)
    with target.open('rb') as stream:
        if b'-Y 1024 +X 2048\n' not in stream.read(4096):
            raise ValueError(f'Unexpected HDR dimensions: {target}')
    subprocess.run(['oiiotool', '--info', str(target)], check=True)
    print(f'{target.name}: {target.stat().st_size / 1_000_000:.2f} MB', flush=True)
