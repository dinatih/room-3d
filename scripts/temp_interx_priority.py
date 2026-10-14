"""Validate the priority draft, then publish it explicitly. Resumable exports stay separate."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path

from interx_catalog import ROOT, MANIFEST, atomic_json, publish_manifest
from convert_interx_duos import GROUND_STANDING_ACTIONS, verified


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true')
    args = parser.parse_args()
    selection = json.loads((ROOT / 'scripts/interx_priority_selection.json').read_text())
    draft_path = ROOT / 'scripts/interx_priority_draft_manifest.json'
    draft = json.loads(draft_path.read_text())
    support = json.loads(Path('/tmp/interx-priority-support.json').read_text())
    if {entry['id'] for entry in draft['duos']} != {entry['id'] for entry in selection['duos']}:
        raise ValueError('Draft export is incomplete')
    for entry in draft['duos']:
        if not verified(entry):
            raise ValueError(f"Invalid export: {entry['id']}")
        entry['placement'] = {'verticalOrigin': 'soles-preserve-hands'} if entry['actionCode'] in GROUND_STANDING_ACTIONS else {
            'verticalOrigin': 'source-support-preserve-hands', **support['duos'][entry['id']]}
    draft['supportModels'] = support['models']
    atomic_json(draft_path, draft)
    digest = hashlib.sha256(draft_path.read_bytes()).hexdigest()
    receipt = Path('/tmp/interx-priority-validation.json')
    if not args.publish:
        subprocess.run(['python3', 'scripts/check_interx_pipeline.py', '--manifest', str(draft_path), '--reference', '/tmp/interx-motion-reference.json'], cwd=ROOT, check=True)
        for entry in draft['duos']:
            subprocess.run(['node', '--expose-gc', 'scripts/check_interx_motion.cjs', '--manifest', str(draft_path), '--duo', entry['id']], cwd=ROOT, check=True)
        atomic_json(receipt, {'manifestSha256': digest})
        print(f"Numeric validation passed: {len(draft['duos'])} duos", flush=True)
    if args.publish:
        if json.loads(receipt.read_text())['manifestSha256'] != digest:
            raise ValueError('Draft must pass numeric validation before publication')
        visual = json.loads(Path('/tmp/interx-browser-validation.json').read_text())
        complex_actions = {entry['actionCode'] for entry in draft['duos'] if entry['actionCode'] in {'A025', 'A026', 'A027', 'A028', 'A035'}}
        visually_checked = {entry['actionCode'] for entry in draft['duos'] if entry['id'] in visual['ids']}
        if visual['manifestSha256'] != digest or not complex_actions.issubset(visually_checked):
            raise ValueError('Each complex action must have a draft browser validation before publication')
        published = json.loads(MANIFEST.read_text())
        entries = {entry['id']: entry for entry in published['duos']}
        entries.update({entry['id']: entry for entry in draft['duos']})
        published['duos'] = sorted(entries.values(), key=lambda entry: (entry['actionCode'], entry['variation'], entry['id']))
        published['supportModels'] = support['models']
        publish_manifest(published)
        size = sum(clip['sizeBytes'] for entry in draft['duos'] for clip in entry['clips'].values())
        print(f"Published {len(draft['duos'])} additional duos / {2 * len(draft['duos'])} GLB / {size / 1e6:.2f} MB")
        planned = json.loads((ROOT / 'scripts/interx_selection.json').read_text())['duos']
        covered = {(entry['actionCode'], entry['variation']) for entry in published['duos']}
        remaining = sum((entry['actionCode'], entry['variation']) not in covered for entry in planned)
        total_size = sum(clip['sizeBytes'] for entry in published['duos'] for clip in entry['clips'].values())
        print(f"Studio catalog: {len(published['duos'])} duos / {2 * len(published['duos'])} GLB / {total_size / 1e6:.2f} MB; {remaining} original catalog sessions remain")


if __name__ == '__main__':
    main()
