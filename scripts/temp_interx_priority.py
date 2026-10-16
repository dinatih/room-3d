"""Validate the priority draft, then publish it explicitly. Resumable exports stay separate."""
import argparse
import hashlib
import json
import subprocess
from pathlib import Path
import math

import numpy as np

from interx_catalog import ROOT, MANIFEST, DEFAULT_SOURCE, RECORDING, SOURCE_FPS, TARGET_FPS, actions, atomic_json, publish_manifest, estimate_model
from convert_interx_duos import GROUND_STANDING_ACTIONS, verified


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true')
    parser.add_argument('--inventory', type=Path, help='Write source/session coverage for all 40 actions as Markdown')
    parser.add_argument('--estimate-segments', type=Path, help='Estimate additional R segments for currently selected G/T/A recordings without exporting')
    parser.add_argument('--include-other-shoots', action='store_true', help='Also include other T recordings for the same selected binomes and action')
    args = parser.parse_args()
    if args.include_other_shoots and not args.estimate_segments:
        raise ValueError('--include-other-shoots requires --estimate-segments')
    if args.estimate_segments:
        published = json.loads(MANIFEST.read_text())['duos']
        representatives = {}
        for entry in published:
            key = (entry['actionCode'], entry['variation'])
            previous = representatives.get(key)
            if previous is None:
                representatives[key] = entry
            elif {previous['source']['group'], entry['source']['group']} == {'G001', 'G053'}:
                # Explicit historical pilot comparisons: retain the matched G053.
                representatives[key] = next(item for item in (previous, entry) if item['source']['group'] == 'G053')
            else:
                raise ValueError(f'Unresolved representative comparison: {key}')
        model = estimate_model('full-axis-angle')
        existing = {entry['source']['recording'] for entry in published}
        folders = {}
        for folder in DEFAULT_SOURCE.iterdir():
            if not folder.is_dir():
                continue
            if not RECORDING.fullmatch(folder.name):
                raise ValueError(f'Invalid recording: {folder}')
            folders.setdefault(folder.name[:12], []).append(folder)
        estimates, seen = [], set()
        for entry in representatives.values():
            candidates = [folder for prefix, items in folders.items() for folder in items
                          if prefix[:4] == entry['source']['group'] and prefix[8:12] == entry['actionCode']] if args.include_other_shoots else folders[entry['source']['recording'][:12]]
            for folder in sorted(candidates):
                if folder.name in existing or folder.name in seen:
                    continue
                seen.add(folder.name)
                counts = []
                for person in ('P1', 'P2'):
                    with np.load(folder / f'{person}.npz', allow_pickle=False) as data:
                        translation = data['trans']
                    if translation.ndim != 2 or translation.shape[1] != 3 or not len(translation) or not np.isfinite(translation).all():
                        raise ValueError(f'Invalid translation: {folder}/{person}')
                    counts.append(len(translation))
                if counts[0] != counts[1]:
                    raise ValueError(f'Unsynchronized participants: {folder}')
                frames = math.ceil(counts[0] / (SOURCE_FPS // TARGET_FPS))
                estimates.append({'recording': folder.name, 'actionCode': entry['actionCode'], 'variation': RECORDING.fullmatch(folder.name)[2],
                                  'group': entry['source']['group'], 'frameCount': frames,
                                  'estimatedBytes': round(2 * (model['baseBytes'] + model['bytesPerFrame'] * frames))})
        lines = ['# Estimation des segments R supplémentaires', '',
                 'Périmètre : tous les T/R des binômes G déjà retenus pour chaque action.' if args.include_other_shoots else 'Périmètre : binôme actuellement sélectionné pour chaque action/session G/T/A ; tous les R encore absents.',
                 'Les anciennes comparaisons G001/G053 retiennent G053. Aucun autre binôme G n’est ajouté.',
                 'Poids estimés à partir des GLB avec doigts déjà exportés, hors métadonnées JSON. Aucune conversion lancée.', '',
                 '| Action | Duos supplémentaires | GLB supplémentaires | Poids estimé (Mo) |', '| --- | ---: | ---: | ---: |']
        for action in actions():
            items = [entry for entry in estimates if entry['actionCode'] == action['code']]
            size = sum(item['estimatedBytes'] for item in items)
            lines.append(f"| {action['label']} | {len(items)} | {2 * len(items)} | {size / 1e6:.2f} |")
            print(f"{action['label']}: +{len(items)} duos / +{2 * len(items)} GLB / ~{size / 1e6:.2f} Mo")
        total = sum(item['estimatedBytes'] for item in estimates)
        lines.extend([f'| Total | {len(estimates)} | {2 * len(estimates)} | {total / 1e6:.2f} |', ''])
        args.estimate_segments.write_text('\n'.join(lines))
        atomic_json(args.estimate_segments.with_suffix('.json'), {'scope': 'all-missing-T-R-for-current-G-A-representatives' if args.include_other_shoots else 'all-missing-R-for-current-G-T-A-representatives',
                                                                'sizeEstimate': model, 'duos': estimates})
        g053 = [item for item in estimates if item['group'] == 'G053' and item['actionCode'] == 'A000']
        print(f"G053 hugs only: +{len(g053)} duos / +{2 * len(g053)} GLB / ~{sum(item['estimatedBytes'] for item in g053) / 1e6:.2f} Mo")
        print(f'TOTAL: +{len(estimates)} duos / +{2 * len(estimates)} GLB / ~{total / 1e6:.2f} Mo')
        current_size = sum(clip['sizeBytes'] for entry in published for clip in entry['clips'].values())
        print(f'PROJECTED CATALOG: {len(published) + len(estimates)} duos / {2 * (len(published) + len(estimates))} GLB / ~{(current_size + total) / 1e6:.2f} Mo')
        return
    if args.inventory:
        available = {action['code']: set() for action in actions()}
        for folder in DEFAULT_SOURCE.iterdir():
            if not folder.is_dir():
                continue
            match = RECORDING.fullmatch(folder.name)
            if not match or match[3] not in available:
                raise ValueError(f'Invalid source recording: {folder}')
            available[match[3]].add(match[2])
        published = json.loads(MANIFEST.read_text())['duos']
        lines = ['# Catalogue Inter-X : couverture des variantes T', '',
                 'Un binôme de taille adaptée par session T, première prise disponible ; les répétitions G/R sont exclues.', '',
                 '| Code | Thème | Variantes disponibles | Publiées | Restantes |',
                 '| --- | --- | ---: | ---: | ---: |']
        totals = [0, 0, 0]
        for action in actions():
            code = action['code']
            covered = {entry['variation'] for entry in published if entry['actionCode'] == code}
            if not covered.issubset(available[code]):
                raise ValueError(f'Published session missing from source: {code}')
            counts = [len(available[code]), len(covered), len(available[code] - covered)]
            totals = [a + b for a, b in zip(totals, counts)]
            lines.append(f"| {code} | {action['label']} | {counts[0]} | {counts[1]} | {counts[2]} |")
            print(f"{code} {action['label']}: {counts[1]}/{counts[0]} published; {counts[2]} remaining")
        size = sum(clip['sizeBytes'] for entry in published for clip in entry['clips'].values())
        lines.extend([f'| Total | | {totals[0]} | {totals[1]} | {totals[2]} |', '',
                      f"Le catalogue contient {len(published)} duos, comparaisons de binômes conservées comprises.",
                      f"Fichiers : {2 * len(published)} GLB, soit {size / 1e6:.2f} Mo. Les métadonnées JSON s'ajoutent à ce poids.", ''])
        print(f"TOTAL: {totals[1]}/{totals[0]} sessions, {totals[2]} remaining; {len(published)} duos / {2 * len(published)} GLB / {size / 1e6:.2f} MB")
        args.inventory.write_text('\n'.join(lines))
        return
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
