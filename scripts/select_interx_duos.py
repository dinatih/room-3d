"""Select first available takes and one group per action/session, without Blender."""
import argparse
from collections import Counter
import json
from pathlib import Path

from interx_catalog import DEFAULT_SOURCE, ROOT, RECORDING, CONVERSION, MANIFEST, actions, atomic_json, entry_for, estimate_model, report


def select_recordings(source, maximum):
    if not 1 <= maximum <= 8:
        raise ValueError('--max-per-action must be between 1 and 8')
    first_takes = {}
    for path in sorted(source.iterdir()):
        if not path.is_dir():
            continue
        match = RECORDING.fullmatch(path.name)
        if not match:
            raise ValueError(f'Invalid recording folder: {path}')
        group, session, action, take = match.groups()
        if int(action[1:]) >= 40:
            raise ValueError(f'Unknown action: {action}')
        key = (group, session, action)
        previous = first_takes.get(key)
        if previous is None or take < previous[0]:
            first_takes[key] = (take, path.name)
    representatives = {}
    for (group, session, action), (_, recording) in sorted(first_takes.items()):
        representatives.setdefault((action, session), recording)
    selected = []
    for action in actions():
        candidates = sorted((session, recording) for (code, session), recording in representatives.items() if code == action['code'])
        if not candidates:
            raise ValueError(f"No source recordings for {action['code']}")
        selected.extend(recording for _, recording in candidates[:maximum])
    return selected


def select_height_batch(ranking, maximum, batch_size, target_height):
    if batch_size < 1 or target_height <= 0 or not 1 <= maximum <= 8:
        raise ValueError('Invalid batch size, target height or category quota')
    published = json.loads(MANIFEST.read_text())['duos']
    covered = {(duo['actionCode'], duo['variation']) for duo in published}
    counts = Counter(action for action, _ in covered)
    queues = {}
    for action, pairs in ranking['actions'].items():
        best = {}
        for pair in pairs:
            variation = pair['variation']
            score = (max(abs(person['heightCm'] - target_height) for person in pair['participants']),
                     pair['heightDifferenceCm'], pair['recording'])
            if variation not in best or score < best[variation][0]:
                best[variation] = (score, pair)
        ordered = sorted(best.items(), key=lambda item: (item[1][0], item[0]))
        queues[action] = [pair for variation, (_, pair) in ordered if (action, variation) not in covered]
    selected = []
    while len(selected) < batch_size:
        added = False
        for action, queue in queues.items():
            if queue and counts[action] < maximum:
                selected.append(queue.pop(0))
                counts[action] += 1
                added = True
                if len(selected) == batch_size:
                    break
        if not added:
            break
    if not selected:
        raise ValueError('No unpublished action/session remains in this ranking')
    return selected


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source', type=Path, default=DEFAULT_SOURCE)
    parser.add_argument('--max-per-action', type=int, default=8)
    parser.add_argument('--output', type=Path, default=ROOT / 'scripts/interx_selection.json')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--recordings', nargs='+', help='Explicit pilot recordings instead of the full catalog selection')
    parser.add_argument('--height-ranking', type=Path, help='SMPL-X height ranking used to choose unpublished duos')
    parser.add_argument('--batch-size', type=int, help='Maximum number of new duos to export in this batch')
    parser.add_argument('--target-height', type=float, default=173.4, help='Target avatar height in centimetres')
    parser.add_argument('--hand-motion', action='store_true', help='Estimate disk size from clips with finger animation')
    args = parser.parse_args()
    model = estimate_model('full-axis-angle' if args.hand_motion else None)
    if args.height_ranking and (args.recordings or args.batch_size is None):
        raise ValueError('--height-ranking requires --batch-size and cannot be combined with --recordings')
    if args.batch_size is not None and not args.height_ranking:
        raise ValueError('--batch-size requires --height-ranking')
    matched = None
    if args.height_ranking:
        ranking = json.loads(args.height_ranking.read_text())
        matched = select_height_batch(ranking, args.max_per_action, args.batch_size, args.target_height)
    selected = [pair['recording'] for pair in matched] if matched else args.recordings if args.recordings else select_recordings(args.source, args.max_per_action)
    selection = {'schemaVersion': 1, 'dataset': 'inter-x', 'conversion': CONVERSION,
                 'policy': {'take': 'first-available', 'representative': 'height-matched-per-action-session' if matched else 'explicit-recordings' if args.recordings else 'lowest-group-per-action-session', 'maxPerAction': args.max_per_action},
                 'sizeEstimate': model, 'actions': actions(),
                 'duos': [entry_for(args.source, recording, model) for recording in selected]}
    if matched:
        selection['heightSelection'] = {'targetHeightCm': args.target_height, 'models': ranking['models'], 'candidates': matched}
    report(selection)
    if not args.dry_run:
        atomic_json(args.output, selection)


if __name__ == '__main__':
    main()
