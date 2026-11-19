"""Entry point to rebuild either dog from source geometry with an anatomical Pitbull-compatible rig.

Usage:
  blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-dogs.py -- --dog ushiro
  blender -b -noaudio -t 2 --python-exit-code 1 --python scripts/rig-dogs.py -- --dog dachshund-sculpt
"""
from pathlib import Path
import argparse, runpy, sys

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--dog', choices=['dachshund-sculpt', 'ushiro'], required=True)
parser.add_argument('--base-only', action='store_true')
args, extra = parser.parse_known_args(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])

script = ROOT / ('scripts/rig-ushiro.py' if args.dog == 'ushiro' else 'scripts/rig-ulotte.py')
sys.argv = [str(script), '--'] + (['--base-only'] if args.base_only else []) + extra
runpy.run_path(str(script), run_name='__main__')
raise RuntimeError(f'{args.dog} build returned without exporting')
