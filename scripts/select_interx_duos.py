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


def select_height_batch(ranking, maximum, batch_size, target_height, eligible=None):
    if batch_size < 1 or target_height <= 0 or (maximum is not None and not 1 <= maximum <= 8):
        raise ValueError('Invalid batch size, target height or category quota')
    published = json.loads(MANIFEST.read_text())['duos']
    covered = {(duo['actionCode'], duo['variation']) for duo in published}
    counts = Counter(action for action, _ in covered)
    queues = {}
    for action, pairs in ranking['actions'].items():
        best = {}
        for pair in pairs:
            variation = pair['variation']
            if eligible is not None and (action, variation) not in eligible:
                continue
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
            if queue and (maximum is None or counts[action] < maximum):
                selected.append(queue.pop(0))
                counts[action] += 1
                added = True
                if len(selected) == batch_size:
                    break
        if not added:
            break
    if not selected and maximum is not None:
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
    parser.add_argument('--priority-themes', action='store_true', help='Select remaining affection, help/relaxation and play/dance sessions from the original capped catalog')
    parser.add_argument('--all-variations', action='store_true', help='Remove the per-action quota, retaining one height-matched pair per action/session')
    args = parser.parse_args()
    model = estimate_model('full-axis-angle' if args.hand_motion else None)
    if args.all_variations and (not args.height_ranking or args.priority_themes):
        raise ValueError('--all-variations requires --height-ranking and cannot use --priority-themes')
    if args.all_variations and args.batch_size is not None:
        raise ValueError('--all-variations selects all sessions and cannot use --batch-size')
    if args.height_ranking and (args.recordings or (args.batch_size is None and not args.all_variations)):
        raise ValueError('--height-ranking requires --batch-size and cannot be combined with --recordings')
    if args.batch_size is not None and not args.height_ranking:
        raise ValueError('--batch-size requires --height-ranking')
    matched = None
    if args.height_ranking:
        ranking = json.loads(args.height_ranking.read_text())
        eligible = None
        if args.priority_themes:
            preferred = {action['code'] for action in actions() if set(action['tags']) & {'affection', 'help-relaxation', 'play-dance'}}
            eligible = {(RECORDING.fullmatch(recording)[3], RECORDING.fullmatch(recording)[2]) for recording in select_recordings(args.source, args.max_per_action) if RECORDING.fullmatch(recording)[3] in preferred}
        batch_size = sum(len({pair['variation'] for pair in pairs}) for pairs in ranking['actions'].values()) if args.all_variations else args.batch_size
        matched = select_height_batch(ranking, None if args.all_variations else args.max_per_action, batch_size, args.target_height, eligible)
    elif args.priority_themes:
        raise ValueError('--priority-themes requires --height-ranking')
    selected = [pair['recording'] for pair in matched] if matched is not None else args.recordings if args.recordings else select_recordings(args.source, args.max_per_action)
    selection = {'schemaVersion': 1, 'dataset': 'inter-x', 'conversion': CONVERSION,
                 'policy': {'take': 'first-available', 'representative': 'height-matched-all-action-sessions' if args.all_variations else 'height-matched-per-action-session' if matched is not None else 'explicit-recordings' if args.recordings else 'lowest-group-per-action-session', 'maxPerAction': None if args.all_variations else args.max_per_action},
                 'sizeEstimate': model, 'actions': actions(),
                 'duos': [entry_for(args.source, recording, model) for recording in selected]}
    if matched is not None:
        selection['heightSelection'] = {'targetHeightCm': args.target_height, 'models': ranking['models'], 'candidates': matched}
        published = {(duo['actionCode'], duo['variation']) for duo in json.loads(MANIFEST.read_text())['duos']}
        selection['coverage'] = {action: {
            'availableVariations': sorted({pair['variation'] for pair in pairs}),
            'publishedVariations': sorted(variation for code, variation in published if code == action),
        } for action, pairs in ranking['actions'].items()}
        for action, coverage in selection['coverage'].items():
            print(f"COVERAGE {action}: {len(coverage['publishedVariations'])}/{len(coverage['availableVariations'])} sessions published")
    report(selection)
    if not args.dry_run:
        atomic_json(args.output, selection)


if __name__ == '__main__':
    main()
