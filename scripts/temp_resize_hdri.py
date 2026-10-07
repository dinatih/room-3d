"""Keep oversized Radiance HDR panoramas just below 100 decimal MB.

Requires oiiotool (OpenImageIO). Resamples the original in linear HDR space,
preserving the 2:1 aspect ratio and testing encoded file sizes.
"""

from pathlib import Path
import re
import shutil
import subprocess
import tempfile


LIMIT = 100_000_000
DIRECTORY = Path(__file__).resolve().parents[1] / 'public/environment/hdri'


def dimensions(path):
    with path.open('rb') as stream:
        match = re.search(rb'-Y (\d+) \+X (\d+)\n', stream.read(4096))
    if match is None:
        raise ValueError(f'Unsupported HDR header: {path}')
    height, width = map(int, match.groups())
    if width != height * 2:
        raise ValueError(f'Expected a 2:1 panorama: {path}')
    return height, width


def resize(path):
    height, width = dimensions(path)
    original_size = path.stat().st_size
    with tempfile.TemporaryDirectory(prefix='room-hdri-') as temporary:
        candidate = Path(temporary) / 'candidate.hdr'
        best = Path(temporary) / 'best.hdr'
        low, high = 1, height
        best_height = None
        # Search the largest height whose encoded HDR fits the byte limit.
        while low <= high:
            trial = high if best_height is None and high == height else (low + high) // 2
            command = ['oiiotool', str(path)]
            if trial != height:
                command += ['--resize:filter=triangle', f'{trial * 2}x{trial}']
            subprocess.run(command + ['-o', str(candidate)], check=True)
            size = candidate.stat().st_size
            print(f'{path.name}: {trial * 2}x{trial}, {size:,} bytes', flush=True)
            if size < LIMIT:
                shutil.copyfile(candidate, best)
                best_height = trial
                low = trial + 1
            else:
                high = trial - 1
        if best_height is None:
            raise RuntimeError(f'Cannot fit HDR under {LIMIT} bytes: {path}')
        subprocess.run(['oiiotool', '--info', '--stats', str(best)], check=True)
        if dimensions(best) != (best_height, best_height * 2):
            raise RuntimeError(f'Unexpected output dimensions: {path}')
        shutil.copyfile(best, path)
        print(f'SAVED {path.name}: {original_size:,} -> {path.stat().st_size:,} bytes', flush=True)


if __name__ == '__main__':
    for hdr in sorted(DIRECTORY.glob('*.hdr')):
        if hdr.stat().st_size >= LIMIT:
            resize(hdr)
    for hdr in sorted(DIRECTORY.glob('*.hdr')):
        if hdr.stat().st_size >= LIMIT:
            raise RuntimeError(f'HDR still exceeds limit: {hdr}')
